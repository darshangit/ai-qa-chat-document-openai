import { openai } from "./openai.js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { compile } from "html-to-text";
import { RecursiveUrlLoader } from "langchain/document_loaders/web/recursive_url";

const question = process.argv[2] || 'What is teh gist of the this URL'


const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

const createStore = (docs) => MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())

const url = 'https://js.langchain.com/v0.1/docs/get_started/introduction/'

const docsFromURL = () => {
    const loader = new RecursiveUrlLoader(url, {
        extractor: compiledConvert,
        maxDepth: 0,
        excludeDirs: ["https://js.langchain.com/docs/api/"],
      });

      return loader.loadAndSplit(new CharacterTextSplitter({
        separator: '. ',
        chunkSize: 2500,
        chunkOverlap: 200
    }))
}

const loadStore = async() => {
    const urlDocs = await docsFromURL()
    const docs = [...urlDocs]
    return createStore(docs)
}

const query = async() => {
    const store = await loadStore()
    const results = await store.similaritySearch(question, 2)

    const response = await openai.chat.completions.create({
        model: 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF',
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

    console.log('***********ANSWER*****************')
    console.log(`${response.choices[0].message.content}\nSources: ${results.map(r => r.metadata.source).join(', ')}`)
    console.log('**********************************')
}

query()


console.log('************Question****************')
console.log('Question: ', question)
console.log('*************************************')
