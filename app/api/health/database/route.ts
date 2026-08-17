import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // برای MongoDB از ping استفاده کنید
    await prisma.$runCommandRaw({ ping: 1 })
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Database connection error:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown database error'
    
    return NextResponse.json(
      { status: 'error', message: errorMessage }, 
      { status: 500 }
    )
  }
}