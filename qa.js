import { openai } from './openai.js'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube'

const question = process.argv[2] || 'HI'

const video = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn'

const createStore = (docs) => MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())


const docsFromYTVideo = (video) => {
    const loader = YoutubeLoader.createFromUrl(video, {
        language: 'en',
        addVideoInfo: true,
    })
    return loader.loadAndSplit(
        new CharacterTextSplitter({
            separator: ' ',
            chunkSize: 2500,
            chunkOverlap: 100
        })
    )
}

const docsFromPDF = () => {
    const loader = new PDFLoader('xbox.pdf')
    return loader.loadAndSplit(new CharacterTextSplitter({
        separator: '. ',
        chunkSize: 2500,
        chunkOverlap: 200
    }))
}


const loadStore = async () => {
    const videoDocs = await docsFromYTVideo(video)
    const pdfDocs = await docsFromPDF()
    const docs = [...videoDocs, ...pdfDocs]
    return createStore(docs)
}

const query = async () => {
    const store = await loadStore()
    const results = await store.similaritySearch(question, 2)

    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        temperature: 0,
        messages: [
            { role: 'system', content: 'You are a helpful AI assistant. Answer your questions to the best of teh ability' },
            {
                role: 'user',
                content: `Answer the following question using the provided context. If yyou cannot answer the question with the context, dont lie and make up stuff. Just say you need more context. 
                Question: ${question}
                Context: ${results.map((r) => r.pageContent).join('\n')}
            `
            }
        ]
    })

    console.log(`Answer: ${response.choices[0].message.content}\nSources: ${results.map(r => r.metadata.source).join(', ')}`)
}

query()

console.log(question)
