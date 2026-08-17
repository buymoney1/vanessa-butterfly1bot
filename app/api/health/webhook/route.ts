import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    )
    
    const data = await response.json()
    
    if (data.ok) {
      return NextResponse.json({ 
        status: 'ok',
        webhookInfo: data.result
      })
    }
    
    return NextResponse.json({ status: 'error' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}