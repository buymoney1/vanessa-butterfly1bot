import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'checking',
        telegram: 'checking',
        gapgpt: 'checking',
        webhook: 'checking'
      }
    }

    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`
      healthData.services.database = 'online'
    } catch (error) {
      healthData.services.database = 'offline'
    }

    // Check Telegram Bot
    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
      )
      if (telegramResponse.ok) {
        healthData.services.telegram = 'online'
      } else {
        healthData.services.telegram = 'offline'
      }
    } catch (error) {
      healthData.services.telegram = 'offline'
    }

    // Check GapGPT
    try {
      const gapgptResponse = await fetch(`${process.env.GAPGPT_API_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${process.env.GAPGPT_API_KEY}`
        }
      })
      if (gapgptResponse.ok) {
        healthData.services.gapgpt = 'online'
      } else {
        healthData.services.gapgpt = 'offline'
      }
    } catch (error) {
      healthData.services.gapgpt = 'offline'
    }

    // Check Webhook
    try {
      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
      )
      const webhookData = await webhookResponse.json()
      if (webhookData.ok && webhookData.result.url) {
        healthData.services.webhook = 'online'
      } else {
        healthData.services.webhook = 'offline'
      }
    } catch (error) {
      healthData.services.webhook = 'offline'
    }

    return NextResponse.json(healthData)
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    )
  }
}