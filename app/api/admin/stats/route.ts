import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalConversations,
      totalMessages,
      totalContents,
      activeUsers,
      recentMessages
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.content.count(),
      prisma.user.count(),
      prisma.message.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        include: {
          conversation: {
            include: {
              user: true
            }
          }
        }
      })
    ])

    return NextResponse.json({
      totalConversations,
      totalMessages,
      totalContents,
      activeUsers,
      recentMessages
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}