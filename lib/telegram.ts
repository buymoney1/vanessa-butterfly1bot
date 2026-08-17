// src/lib/telegram.ts
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendTelegramMessage(chatId: number, text: string, replyToMessageId?: number) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_to_message_id: replyToMessageId,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      throw new Error(`Failed to send message: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    throw error
  }
}

// New function: send message with keyboard
export async function sendTelegramMessageWithKeyboard(chatId: number, text: string, keyboard: any) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: keyboard,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      throw new Error(`Failed to send message: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending Telegram message with keyboard:', error)
    throw error
  }
}

export async function sendTelegramPhoto(chatId: number, photoBase64: string, caption?: string) {
  try {
    const photoBuffer = Buffer.from(photoBase64, 'base64')
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())
    formData.append('photo', new Blob([photoBuffer]), 'image.jpg')
    if (caption) {
      formData.append('caption', caption)
    }

    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      throw new Error(`Failed to send photo: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending Telegram photo:', error)
    throw error
  }
}

export async function setWebhook(url: string, secretToken: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      throw new Error(`Failed to set webhook: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error setting webhook:', error)
    throw error
  }
}

export async function deleteWebhook() {
  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
      method: 'POST',
    })
    return await response.json()
  } catch (error) {
    console.error('Error deleting webhook:', error)
    throw error
  }
}

export async function getWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`)
    return await response.json()
  } catch (error) {
    console.error('Error getting webhook info:', error)
    throw error
  }
}