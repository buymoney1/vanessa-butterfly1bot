// src/app/api/admin/contents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContentSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const contents = await prisma.content.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(contents)
  } catch (error) {
    console.error('Error fetching contents:', error)
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ContentSchema.parse(body)

    const content = await prisma.content.create({
      data: validatedData,
    })

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Error creating content:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
  }
}