// src/lib/gapgpt.ts
import OpenAI from 'openai'
import { prisma } from './prisma'

// ==================== Types ====================
type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ContentItem = {
  type: string
  text: string | null
  title: string | null
  description: string | null
}

// ==================== Client Initialization ====================
let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GAPGPT_API_KEY
    
    if (!apiKey) {
      throw new Error(
        'GAPGPT_API_KEY is not configured. Please add it to your environment variables.'
      )
    }
    
    client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.GAPGPT_API_URL || 'https://api.gapgpt.com/v1',
    })
  }
  
  return client
}

// Check if GapGPT is available
export function isGapGPTConfigured(): boolean {
  return Boolean(process.env.GAPGPT_API_KEY)
}

// ==================== Helper Functions ====================
function buildSystemPrompt(contents: ContentItem[]): string {
  let systemMessage = `You are Vanca Support Bot (ونسا - برند گل جاودان), a helpful assistant for the Vanca project.
    
IMPORTANT: The brand name is "ونسا" (Vanca), NOT "ونکا" (Vanka).

Available contents in the knowledge base:
`

  contents.forEach((content, index) => {
    if (content.type === 'text' && content.text) {
      systemMessage += `
${index + 1}. ${content.title || 'Untitled'}
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

  return systemMessage
}

async function fetchActiveContents(): Promise<ContentItem[]> {
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
    return contents
  } catch (error) {
    console.error('❌ Error fetching contents from database:', error)
    return [] // Return empty array if database fails
  }
}

// ==================== Main Functions ====================
export async function getGapGPTResponse(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<string> {
  try {
    // Check if GapGPT is configured
    if (!isGapGPTConfigured()) {
      console.warn('⚠️ GapGPT is not configured. Returning fallback response.')
      return 'سیستم هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.'
    }

    const openaiClient = getClient()
    
    // Fetch active contents from database
    const contents = await fetchActiveContents()
    
    // Build system prompt with knowledge base
    const systemMessage = buildSystemPrompt(contents)

    // Prepare messages
    const messages: Message[] = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant'
      ),
      { role: 'user', content: userMessage },
    ]

    // Call GapGPT API
    const completion = await openaiClient.chat.completions.create({
      model: process.env.GAPGPT_MODEL || 'gapgpt-turbo',
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response =
      completion.choices[0]?.message?.content ||
      'متأسفانه نتوانستم پاسخ مناسبی تولید کنم.'

    return response
  } catch (error) {
    console.error('❌ Error calling GapGPT:', error)
    
    // Return user-friendly error message instead of throwing
    if (error instanceof Error && error.message.includes('not configured')) {
      return 'سیستم هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.'
    }
    
    return 'خطایی در ارتباط با هوش مصنوعی رخ داد. لطفاً دوباره تلاش کنید.'
  }
}

export async function getGapGPTResponseWithImage(
  imageBase64: string,
  userMessage?: string
): Promise<string> {
  try {
    // Check if GapGPT is configured
    if (!isGapGPTConfigured()) {
      console.warn('⚠️ GapGPT is not configured. Returning fallback response.')
      return 'سیستم تحلیل تصویر در حال حاضر در دسترس نیست.'
    }

    const openaiClient = getClient()

    const completion = await openaiClient.chat.completions.create({
      model: process.env.GAPGPT_MODEL || 'gapgpt-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are Vanca Support Bot (ونسا). Analyze the image and provide a helpful response in Persian.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                userMessage ||
                'Please analyze this image and provide a helpful response.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ] as any,
      max_tokens: 1000,
    })

    return (
      completion.choices[0]?.message?.content ||
      'متأسفانه نتوانستم تصویر را تحلیل کنم.'
    )
  } catch (error) {
    console.error('❌ Error calling GapGPT with image:', error)
    
    if (error instanceof Error && error.message.includes('not configured')) {
      return 'سیستم تحلیل تصویر در حال حاضر در دسترس نیست.'
    }
    
    return 'خطایی در تحلیل تصویر رخ داد. لطفاً دوباره تلاش کنید.'
  }
}

// ==================== Utility Functions ====================
export async function testGapGPTConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    if (!isGapGPTConfigured()) {
      return {
        success: false,
        message: 'GAPGPT_API_KEY is not configured',
      }
    }

    const openaiClient = getClient()
    const completion = await openaiClient.chat.completions.create({
      model: process.env.GAPGPT_MODEL || 'gapgpt-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "OK" if you can hear me.',
        },
      ],
      max_tokens: 10,
    })

    const response = completion.choices[0]?.message?.content || ''

    return {
      success: true,
      message: `Connection successful. Response: ${response}`,
    }
  } catch (error) {
    console.error('❌ Error testing GapGPT connection:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ==================== Default Export ====================
export default {
  getGapGPTResponse,
  getGapGPTResponseWithImage,
  testGapGPTConnection,
  isGapGPTConfigured,
}