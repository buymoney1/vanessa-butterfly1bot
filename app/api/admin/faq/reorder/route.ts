// src/app/api/admin/faq/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { faqs } = await request.json()
    
    // به‌روزرسانی ترتیب همه سوالات
    for (const faq of faqs) {
      await prisma.fAQ.update({
        where: { id: faq.id },
        data: { order: faq.order },
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error reordering FAQs' }, { status: 500 })
  }
}