import 'dotenv/config'

import OpenAI from "openai";
const openai = new OpenAI()

const results = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
        {
            role: 'system',
            content: 'You are an AI assistant, answer any question to the best of the ability'
        },
        {
            role: 'user',
            content: 'Hi!! whats my name'
        }
    ]
})

console.log('res', results.choices[0].message.content)

