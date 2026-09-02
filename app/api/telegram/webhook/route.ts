// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, sendTelegramMessageWithKeyboard } from '@/lib/telegram'
import { getGapGPTResponse, getGapGPTResponseWithImage } from '@/lib/gapgpt'
import { 
  saveChannelPost, 
  searchPostsByHashtag, 
  searchPostsByHashtags, 
  getPostLink, 
  CHANNEL_USERNAME,
  getAllHashtagsCategorized,
  buildDynamicKeyboard,
  extractHashtags,
  sendPhotoToUser
} from '@/lib/telegramChannel'
import { 
  processExcelFile, 
  searchShipment, 
  formatShipmentMessage 
} from '@/lib/shipment'

// ============ آیدی ادمین ============
const ADMIN_USERNAME = '@nazanin_zahedi7'
const ADMIN_TELEGRAM_IDS = [896753676, 91126748] // آیدی‌های عددی ادمین‌ها

// ============ توابع FAQ داینامیک ============
async function getFAQsFromDB() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    
    return faqs.map(faq => ({
      id: `faq_${faq.id}`,
      question: faq.question,
      answer: faq.answer,
    }))
  } catch (error) {
    console.error('Error fetching FAQs from DB:', error)
    return []
  }
}

async function buildFAQKeyboard() {
  const faqs = await getFAQsFromDB()
  
  if (faqs.length === 0) {
    return {
      inline_keyboard: [
        [{ text: '🔙 بازگشت به منو', callback_data: 'back_to_main' }]
      ]
    }
  }
  
  const keyboard = []
  
  for (let i = 0; i < faqs.length; i += 2) {
    const row = []
    
    row.push({
      text: faqs[i].question.length > 30 
        ? faqs[i].question.substring(0, 27) + '...' 
        : faqs[i].question,
      callback_data: faqs[i].id
    })
    
    if (faqs[i + 1]) {
      row.push({
        text: faqs[i + 1].question.length > 30 
          ? faqs[i + 1].question.substring(0, 27) + '...' 
          : faqs[i + 1].question,
        callback_data: faqs[i + 1].id
      })
    }
    
    keyboard.push(row)
  }
  
  keyboard.push([
    { text: '🔙 بازگشت به منو', callback_data: 'back_to_main' }
  ])
  
  return { inline_keyboard: keyboard }
}

// ============ تبدیل callback_data به متن ============
async function getButtonLabel(data: string): Promise<string> {
  const labels: Record<string, string> = {
    'track_order': '📦 پیگیری سفارش',
    'track_name': '👤 جستجو با نام',
    'track_phone': '📱 جستجو با موبایل',
    'track_postal': '📮 جستجو با کد پستی',
    'track_code': '🔖 جستجو با کد رهگیری',
    'selection_guide': '🌸 راهنمای انتخاب',
    'categories': '📋 دسته‌بندی محصولات',
    'faq': '❓ سوالات متداول',
    'back_to_main': '🏠 بازگشت به منو',
  }
  
  if (labels[data]) return labels[data]
  
  if (data.startsWith('faq_')) {
    const faqId = data.replace('faq_', '')
    try {
      const faq = await prisma.fAQ.findUnique({
        where: { id: faqId },
      })
      return faq ? `❓ ${faq.question}` : `❓ سوال متداول`
    } catch {
      return `❓ سوال متداول`
    }
  }
  
  if (data.startsWith('cat_')) return `🏷️ انتخاب هشتگ: ${data.replace('cat_', '')}`
  if (data.startsWith('order_')) return `🛒 کلیک روی سفارش محصول`
  return `🔘 ${data}`
}

// ============ توابع state ============
async function saveUserState(chatId: number, state: string) {
  await prisma.settings.upsert({
    where: { key: `user_${chatId}_state` },
    update: { value: { state } },
    create: { key: `user_${chatId}_state`, value: { state } },
  })
}

async function getUserState(chatId: number): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: `user_${chatId}_state` },
  })
  return (setting?.value as any)?.state || null
}

async function clearUserState(chatId: number) {
  await prisma.settings.deleteMany({
    where: { key: `user_${chatId}_state` },
  })
}

// ============ منوی اصلی ============
const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '📦 پیگیری سفارش', callback_data: 'track_order' },
      { text: '🌸 راهنمای انتخاب', callback_data: 'selection_guide' }
    ],
    [
      { text: '📋 دسته‌بندی محصولات', callback_data: 'categories' },
      { text: '❓ سوالات متداول', callback_data: 'faq' }
    ]
  ]
}

export async function POST(request: NextRequest) {
  try {
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 Received webhook:', JSON.stringify(body).substring(0, 300))

    // ============ HANDLE CHANNEL POSTS ============
    if (body.channel_post) {
      console.log('📢 Channel post received')
      await saveChannelPost(body.channel_post)
      return NextResponse.json({ ok: true })
    }

    if (body.edited_channel_post) {
      console.log('📢 Edited channel post received')
      await saveChannelPost(body.edited_channel_post)
      return NextResponse.json({ ok: true })
    }

    // ============ HANDLE EXCEL FILE FROM ADMIN ============
    if (body.message?.document) {
      const document = body.message.document
      const fileName = document.file_name || ''
      const fileId = document.file_id
      const fromId = body.message.from?.id
      const chatId = body.message.chat.id
      
      if (ADMIN_TELEGRAM_IDS.includes(fromId)) {
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          await sendTelegramMessage(chatId, '📄 فایل Excel دریافت شد. در حال پردازش...')
          
          try {
            const result = await processExcelFile(fileId, fileName)
            await sendTelegramMessage(
              chatId,
              `✅ پردازش فایل کامل شد!\n\n📊 تعداد کل ردیف‌ها: ${result.totalRows}\n✅ ذخیره جدید: ${result.savedCount}\n🔄 به‌روزرسانی: ${result.skippedCount}`
            )
          } catch (error) {
            console.error('Error processing Excel:', error)
            await sendTelegramMessage(chatId, '❌ خطا در پردازش فایل.')
          }
        } else {
          await sendTelegramMessage(chatId, '⚠️ لطفاً فایل .xlsx ارسال کنید.')
        }
      } else {
        await sendTelegramMessage(chatId, '⛔ فقط ادمین مجاز به ارسال فایل است.')
      }
      
      return NextResponse.json({ ok: true })
    }

    // ============ HANDLE FORWARDED POSTS ============
    if (body.message && (
      body.message.forward_from_chat?.username === CHANNEL_USERNAME ||
      body.message.forward_from?.username === CHANNEL_USERNAME
    )) {
      console.log('📨 Forwarded post from channel detected')
      
      const forwardedPost = {
        message_id: body.message.forward_from_message_id || body.message.message_id,
        text: body.message.text,
        caption: body.message.caption,
        photo: body.message.photo,
        chat: {
          id: body.message.forward_from_chat?.id || body.message.chat.id,
          username: CHANNEL_USERNAME,
        },
      }
      
      console.log(`   Original message_id: ${body.message.forward_from_message_id}`)
      console.log(`   New message_id: ${body.message.message_id}`)
      console.log(`   Has text: ${!!body.message.text}`)
      console.log(`   Has caption: ${!!body.message.caption}`)
      console.log(`   Has photo: ${!!body.message.photo}`)
      
      // 🔴 بررسی نتیجه
      const savedPost = await saveChannelPost(forwardedPost)
      
      if (savedPost) {
        await sendTelegramMessage(body.message.chat.id, '✅ پست با موفقیت ذخیره شد!')
      } else {
        await sendTelegramMessage(body.message.chat.id, '⚠️ پست ذخیره نشد. متن معتبر ندارد.')
      }
      
      return NextResponse.json({ ok: true })
    }

    // ============ HANDLE CALLBACK QUERIES ============
    if (body.callback_query) {
      return await handleCallbackQuery(body.callback_query)
    }

    // ============ HANDLE REGULAR MESSAGES ============
    if (!body.message) {
      return NextResponse.json({ ok: true })
    }

    const { message } = body
    const { from, chat, text, photo, caption } = message

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { telegramId: BigInt(from.id) },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(from.id),
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
        },
      })
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: user.id },
        include: { messages: true },
      })
    }

    // ============ HANDLE /start ============
    if (text === '/start') {
      const welcomeMessage = `👋 سلام! به بات پشتیبانی ونسا خوش آمدید!\n\nلطفاً یکی از گزینه‌های زیر را انتخاب کنید: 🌸`
      await sendTelegramMessageWithKeyboard(chat.id, welcomeMessage, mainMenuKeyboard)
      return NextResponse.json({ ok: true })
    }

    // ============ HANDLE /help ============
    if (text === '/help') {
      const helpMessage = `📚 راهنمای بات پشتیبانی ونسا\n\nدستورات:\n• /start - نمایش منوی اصلی\n• /help - نمایش راهنما`
      await sendTelegramMessageWithKeyboard(chat.id, helpMessage, mainMenuKeyboard)
      return NextResponse.json({ ok: true })
    }

    // ============ CHECK USER STATE FOR TRACKING ============
    const userState = await getUserState(chat.id)
    
    if (userState && text && !text.startsWith('/')) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: text,
        },
      })
      
      let shipments: any[] = []
      let searchField = ''
      
      switch (userState) {
        case 'waiting_name':
          shipments = await searchShipment('name', text)
          searchField = 'نام'
          break
        case 'waiting_phone':
          shipments = await searchShipment('phone', text)
          searchField = 'شماره موبایل'
          break
        case 'waiting_postal':
          shipments = await searchShipment('postal', text)
          searchField = 'کد پستی'
          break
        case 'waiting_tracking':
          shipments = await searchShipment('tracking', text)
          searchField = 'کد رهگیری'
          break
      }
      
      await clearUserState(chat.id)
      
      if (shipments.length > 0) {
        await sendTelegramMessageWithKeyboard(
          chat.id,
          `🔍 ${shipments.length} مرسوله با ${searchField} "${text}" پیدا شد:`,
          mainMenuKeyboard
        )
        
        for (const shipment of shipments) {
          await sendTelegramMessageWithKeyboard(
            chat.id,
            formatShipmentMessage(shipment),
            mainMenuKeyboard
          )
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      } else {
        await sendTelegramMessageWithKeyboard(
          chat.id,
          `❌ مرسوله‌ای با ${searchField} "${text}" پیدا نشد.`,
          mainMenuKeyboard
        )
      }
      
      return NextResponse.json({ ok: true })
    }

    // ============ SAVE USER MESSAGE ============
    const userMessageContent = text || caption || 'Image message'
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: userMessageContent,
      },
    })

    // ============ GET HISTORY ============
    const history = conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // ============ PROCESS MESSAGE ============
    let response: string

    if (photo && photo.length > 0) {
      const photoFileId = photo[photo.length - 1].file_id
      const fileResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${photoFileId}`)
      const fileData = await fileResponse.json()
      const filePath = fileData.result.file_path
      const imageResponse = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`)
      const imageBuffer = await imageResponse.arrayBuffer()
      const imageBase64 = Buffer.from(imageBuffer).toString('base64')
      response = await getGapGPTResponseWithImage(imageBase64, caption)
      
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: response,
        },
      })
      
      await sendTelegramMessageWithKeyboard(chat.id, response, mainMenuKeyboard)
      return NextResponse.json({ ok: true })
    } else if (text) {
      if (text.includes('#')) {
        const hashtags = text.match(/#[\w\u0600-\u06FF]+/g) || []
        const posts = await searchPostsByHashtags(hashtags)
        
        if (posts.length > 0) {
          await sendTelegramMessageWithKeyboard(chat.id, `🔍 ${posts.length} محصول پیدا شد:`, mainMenuKeyboard)
          await sendPostsIndividually(chat.id, posts)
          return NextResponse.json({ ok: true })
        } else {
          response = `متاسفم، محصولی با این مشخصات پیدا نکردم.`
        }
      } else {
        response = await getGapGPTResponse(text, history)
      }
    } else {
      response = 'متاسفم، من فقط می‌تونم پیام‌های متنی و تصویری رو پردازش کنم.'
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
      },
    })

    await sendTelegramMessageWithKeyboard(chat.id, response, mainMenuKeyboard)

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============ ارسال تکی پست‌ها ============
async function sendPostsIndividually(chatId: number, posts: any[]) {
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const postText = post.text || post.caption || ''
    const postLink = post.link || getPostLink(post.messageId)
    
    const postKeyboard = {
      inline_keyboard: [
        [
          { text: '🔗 مشاهده در کانال', url: postLink },
          { text: '🛒 سفارش', callback_data: `order_${post.messageId}` }
        ],
        [
          { text: '🔙 بازگشت به منو', callback_data: 'back_to_main' }
        ]
      ]
    }
    
    const caption = `🌸 محصول ${i + 1}:\n\n${postText}`
    
    if (post.photoFileId) {
      try {
        await sendPhotoToUser(chatId, post.photoFileId, caption, postKeyboard)
      } catch {
        await sendTelegramMessageWithKeyboard(chatId, caption, postKeyboard)
      }
    } else {
      await sendTelegramMessageWithKeyboard(chatId, caption, postKeyboard)
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

// ============ HANDLE CALLBACK QUERIES ============
async function handleCallbackQuery(callbackQuery: any) {
  const { data, message, id, from } = callbackQuery
  const chatId = message.chat.id
  
  console.log('🔘 Button clicked:', data)

  try {
    if (from) {
      const user = await prisma.user.findFirst({
        where: { telegramId: BigInt(from.id) },
      })
      
      if (user) {
        const conversation = await prisma.conversation.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
        })
        
        if (conversation) {
          const buttonLabel = await getButtonLabel(data)
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'user',
              content: `🔘 ${buttonLabel}`,
            },
          })
        }
      }
    }
  } catch (error) {
    console.error('Error saving click:', error)
  }

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id }),
  })

  switch (data) {
    case 'track_order':
      const trackKeyboard = {
        inline_keyboard: [
          [
            { text: '👤 جستجو با نام', callback_data: 'track_name' },
            { text: '📱 جستجو با موبایل', callback_data: 'track_phone' }
          ],
          [
            { text: '📮 جستجو با کد پستی', callback_data: 'track_postal' },
            { text: '🔖 جستجو با کد رهگیری', callback_data: 'track_code' }
          ],
          [
            { text: '🔙 بازگشت به منو', callback_data: 'back_to_main' }
          ]
        ]
      }
      await sendTelegramMessageWithKeyboard(chatId, `📦 پیگیری سفارش\n\nلطفاً روش جستجو را انتخاب کنید:`, trackKeyboard)
      break

    case 'track_name':
      await saveUserState(chatId, 'waiting_name')
      await sendTelegramMessageWithKeyboard(chatId, `👤 لطفاً نام و نام خانوادگی خود را وارد کنید:`, mainMenuKeyboard)
      break

    case 'track_phone':
      await saveUserState(chatId, 'waiting_phone')
      await sendTelegramMessageWithKeyboard(chatId, `📱 لطفاً شماره موبایل خود را وارد کنید:\n\nمثال: 09397146867`, mainMenuKeyboard)
      break

    case 'track_postal':
      await saveUserState(chatId, 'waiting_postal')
      await sendTelegramMessageWithKeyboard(chatId, `📮 لطفاً کد پستی خود را وارد کنید:`, mainMenuKeyboard)
      break

    case 'track_code':
      await saveUserState(chatId, 'waiting_tracking')
      await sendTelegramMessageWithKeyboard(
        chatId, 
        `🔖 لطفاً کد مرسوله خود را وارد کنید:\n\nمثال: 3142920260915135914790`, 
        mainMenuKeyboard
      )
      break
      
    case 'selection_guide':
      const hashtagsData = await getAllHashtagsCategorized()
      const allHashtagsKeyboard = buildDynamicKeyboard(
        hashtagsData.all.slice(0, 50),
        'cat_',
        '🏷️',
        'back_to_main'
      )
      
      if (hashtagsData.all.length === 0) {
        await sendTelegramMessageWithKeyboard(chatId, `📋 هنوز هشتگی ثبت نشده!`, mainMenuKeyboard)
      } else {
        await sendTelegramMessageWithKeyboard(chatId, `🌸 راهنمای انتخاب\n\nروی هر هشتگ کلیک کنید:`, allHashtagsKeyboard)
      }
      break
      
    case 'categories':
      const hashtags = await getAllHashtagsCategorized()
      const categoryKeyboard = buildDynamicKeyboard(
        hashtags.all.slice(0, 50),
        'cat_',
        '🏷️',
        'back_to_main'
      )
      
      if (hashtags.all.length === 0) {
        await sendTelegramMessageWithKeyboard(chatId, `📋 هنوز هشتگی ثبت نشده!`, mainMenuKeyboard)
      } else {
        await sendTelegramMessageWithKeyboard(chatId, `📋 همه دسته‌بندی‌ها:\n\nروی هر هشتگ کلیک کنید:`, categoryKeyboard)
      }
      break
      
    case 'faq':
      const faqKeyboard = await buildFAQKeyboard()
      const faqs = await getFAQsFromDB()
      
      if (faqs.length === 0) {
        await sendTelegramMessageWithKeyboard(chatId, `❓ هنوز سوالی ثبت نشده!`, mainMenuKeyboard)
      } else {
        await sendTelegramMessageWithKeyboard(chatId, `❓ سوالات متداول:\n\nروی سوال مورد نظر کلیک کنید:`, faqKeyboard)
      }
      break

    case 'back_to_main':
      await sendTelegramMessageWithKeyboard(chatId, `🏠 منوی اصلی:`, mainMenuKeyboard)
      break
      
    default:
      if (data.startsWith('faq_')) {
        const faqId = data.replace('faq_', '')
        try {
          const faqItem = await prisma.fAQ.findUnique({
            where: { id: faqId },
          })
          
          if (faqItem) {
            await sendTelegramMessageWithKeyboard(chatId, faqItem.answer, mainMenuKeyboard)
          } else {
            await sendTelegramMessageWithKeyboard(chatId, `❌ سوال مورد نظر پیدا نشد.`, mainMenuKeyboard)
          }
        } catch (error) {
          console.error('Error fetching FAQ:', error)
          await sendTelegramMessageWithKeyboard(chatId, `❌ خطا در دریافت پاسخ.`, mainMenuKeyboard)
        }
      }
      else if (data.startsWith('cat_')) {
        const category = data.replace('cat_', '')
        const posts = await searchPostsByHashtag(category)
        
        if (posts.length > 0) {
          await sendTelegramMessageWithKeyboard(chatId, `🔍 ${posts.length} محصول پیدا شد:`, mainMenuKeyboard)
          await sendPostsIndividually(chatId, posts)
        } else {
          await sendTelegramMessageWithKeyboard(chatId, `متاسفم، محصولی پیدا نکردم.`, mainMenuKeyboard)
        }
      }
      else if (data.startsWith('order_')) {
        await sendTelegramMessageWithKeyboard(
          chatId,
          `🛒 برای سفارش این محصول، لطفاً به آیدی زیر پیام بدید:\n\n👤 ${ADMIN_USERNAME}\n\nhttps://t.me/${ADMIN_USERNAME.replace('@', '')}`,
          mainMenuKeyboard
        )
      } else {
        await sendTelegramMessageWithKeyboard(chatId, `لطفاً یکی از گزینه‌ها را انتخاب کنید.`, mainMenuKeyboard)
      }
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Webhook is active' })
}