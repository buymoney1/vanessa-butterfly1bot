// src/app/api/admin/faq/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// دریافت همه سوالات
export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(faqs)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching FAQs' }, { status: 500 })
  }
}

// ایجاد سوال جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, answer } = body
    
    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        order: await prisma.fAQ.count(),
      },
    })
    
    return NextResponse.json(faq)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating FAQ' }, { status: 500 })
  }
}

// ویرایش سوال
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, question, answer, order, isActive } = body
    
    const faq = await prisma.fAQ.update({
      where: { id },
      data: { question, answer, order, isActive },
    })
    
    return NextResponse.json(faq)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating FAQ' }, { status: 500 })
  }
}

// حذف سوال
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    await prisma.fAQ.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting FAQ' }, { status: 500 })
  }
}