import 'dotenv/config'
import OpenAI from 'openai'

export const openai = new OpenAI({baseURL:"http://localhost:1234/v1", apiKey:"lm-studio"})

