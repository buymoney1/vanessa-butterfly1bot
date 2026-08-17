// src/lib/gapgpt.ts
import OpenAI from 'openai'
import { prisma } from './prisma'

const client = new OpenAI({
  apiKey: process.env.GAPGPT_API_KEY,
  baseURL: process.env.GAPGPT_API_URL || 'https://api.gapgpt.com/v1',
})

type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function getGapGPTResponse(
  userMessage: string, 
  conversationHistory: Message[] = []
) {
  try {
    const contents = await prisma.content.findMany({
      where: {
        isActive: true,
      },
      select: {
        type: true,
        text: true,
        title: true,
        description: true,
      },
    })

    console.log('📚 Active contents found:', contents.length)

    let systemMessage = `You are Vanca Support Bot (ونسا - برند گل جاودان), a helpful assistant for the Vanca project.
    
IMPORTANT: The brand name is "ونسا" (Vanca), NOT "ونکا" (Vanka).

Available contents in the knowledge base:
`

    contents.forEach((content, index) => {
      if (content.type === 'text' && content.text) {
        systemMessage += `
${index + 1}. ${content.title}
Description: ${content.description || 'No description'}
Content: ${content.text}
---`
      }
    })

    systemMessage += `

IMPORTANT INSTRUCTIONS:
- The brand name is "ونسا" (Vanca) - always use this spelling
- Use the knowledge base above to answer questions
- If you find relevant information, use it directly
- Answer in Persian (Farsi) if the user writes in Persian
- Be helpful and specific
- Don't say you don't have information if it exists in the knowledge base
- Quote the relevant information when answering`

    const messages: Message[] = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant'),
      { role: 'user', content: userMessage },
    ]

    const completion = await client.chat.completions.create({
      model: process.env.GAPGPT_MODEL || 'gapgpt-turbo',
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    
    return response
  } catch (error) {
    console.error('❌ Error calling GapGPT:', error)
    throw new Error('Failed to get response from GapGPT')
  }
}

export async function getGapGPTResponseWithImage(imageBase64: string, userMessage?: string) {
  try {
    const completion = await client.chat.completions.create({
      model: process.env.GAPGPT_MODEL || 'gapgpt-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Vanca Support Bot (ونسا). Analyze the image and provide a helpful response in Persian.',
        },
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: userMessage || 'Please analyze this image and provide a helpful response.' 
            },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${imageBase64}` 
              } 
            },
          ],
        },
      ] as any,
      max_tokens: 1000,
    })

    return completion.choices[0]?.message?.content || 'Sorry, I could not analyze the image.'
  } catch (error) {
    console.error('Error calling GapGPT with image:', error)
    throw new Error('Failed to analyze image with GapGPT')
  }
}