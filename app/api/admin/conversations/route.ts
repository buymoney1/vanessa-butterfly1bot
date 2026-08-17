// src/app/api/admin/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching conversations...')
    
    const conversations = await prisma.conversation.findMany({
      include: {
        user: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 100,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    })

    // تبدیل BigInt به String برای JSON serialization
    const serializedConversations = conversations.map(conversation => ({
      ...conversation,
      user: {
        ...conversation.user,
        telegramId: conversation.user.telegramId.toString(), // BigInt → String
      },
      messages: conversation.messages.map(message => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }))

    console.log(`✅ Found ${serializedConversations.length} conversations`)
    
    return NextResponse.json(serializedConversations)
    
  } catch (error) {
    console.error('❌ Error fetching conversations:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}