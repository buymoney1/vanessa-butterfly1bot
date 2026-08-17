import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
    )
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ 
        status: 'ok', 
        bot: data.result 
      })
    }
    
    return NextResponse.json({ status: 'error' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}