// src/app/api/admin/contents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContentSchema } from '@/lib/validators'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validatedData = ContentSchema.partial().parse(body)

    const content = await prisma.content.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.content.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
  }
}