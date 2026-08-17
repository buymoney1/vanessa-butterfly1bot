// src/app/api/admin/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllUniquePosts, getAllHashtagsCategorized } from '@/lib/telegramChannel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'hashtags') {
      const hashtagsData = await getAllHashtagsCategorized()
      return NextResponse.json(hashtagsData.all)
    }

    const posts = await prisma.channelPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // تبدیل BigInt اگر لازم باشد
    const serializedPosts = posts.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
    }))

    return NextResponse.json(serializedPosts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.channelPost.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}