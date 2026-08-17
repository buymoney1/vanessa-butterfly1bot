import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(`${process.env.GAPGPT_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.GAPGPT_API_KEY}`
      }
    })
    
    if (response.ok) {
      return NextResponse.json({ status: 'ok' })
    }
    
    return NextResponse.json({ status: 'error' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}