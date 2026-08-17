// src/lib/telegramChannel.ts
import { prisma } from './prisma'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
export const CHANNEL_USERNAME = 'vanes_butterfly1'

// ============ استخراج هشتگ‌ها ============
export function extractHashtags(text: string): string[] {
  if (!text) return []
  const hashtags = text.match(/#[\w\u0600-\u06FF]+/g) || []
  return hashtags.map(tag => tag.replace('#', ''))
}

// ============ دریافت اطلاعات عکس ============
export async function getPhotoFileId(photo: any[]): Promise<string | null> {
  if (!photo || photo.length === 0) return null
  
  // بزرگترین عکس (آخرین آیتم)
  const largestPhoto = photo[photo.length - 1]
  return largestPhoto.file_id
}

// ============ ذخیره پست ============
export async function saveChannelPost(post: any) {
  try {
    const text = post.text || post.caption || ''
    const hashtags = extractHashtags(text)
    
    // دریافت file_id عکس
    let photoFileId = null
    let photoUrl = null
    
    if (post.photo && post.photo.length > 0) {
      photoFileId = post.photo[post.photo.length - 1].file_id
      photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photoFileId}`
    }
    
    const existingPost = await prisma.channelPost.findFirst({
      where: {
        OR: [
          { messageId: post.message_id },
          { text: text },
          { caption: text },
        ],
      },
    })

    if (existingPost) {
      return await prisma.channelPost.update({
        where: { id: existingPost.id },
        data: {
          messageId: post.message_id,
          text: post.text,
          caption: post.caption,
          hashtags,
          photoFileId,
          photoUrl,
          link: `https://t.me/${CHANNEL_USERNAME}/${post.message_id}`,
        },
      })
    }

    return await prisma.channelPost.create({
      data: {
        messageId: post.message_id,
        channelId: post.chat?.id?.toString() || '',
        text: post.text,
        caption: post.caption,
        hashtags,
        photoFileId,
        photoUrl,
        link: `https://t.me/${CHANNEL_USERNAME}/${post.message_id}`,
      },
    })
  } catch (error) {
    console.error('Error saving channel post:', error)
    throw error
  }
}

// ============ ارسال عکس به کاربر ============
export async function sendPhotoToUser(chatId: number, photoFileId: string, caption: string, keyboard?: any) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoFileId,
        caption: caption,
        reply_markup: keyboard,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram API error:', error)
      throw new Error(`Failed to send photo: ${error.description}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending photo:', error)
    throw error
  }
}

// ============ جستجو با حذف تکراری ============
export async function searchPostsByHashtag(hashtag: string) {
  try {
    const cleanHashtag = hashtag.replace('#', '')
    
    const posts = await prisma.channelPost.findMany({
      where: {
        hashtags: {
          has: cleanHashtag,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return removeDuplicates(posts)
  } catch (error) {
    console.error('Error searching posts:', error)
    return []
  }
}

// ============ جستجو با چند هشتگ ============
export async function searchPostsByHashtags(hashtags: string[]) {
  try {
    const cleanHashtags = hashtags.map(tag => tag.replace('#', ''))
    
    const posts = await prisma.channelPost.findMany({
      where: {
        hashtags: {
          hasSome: cleanHashtags,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return removeDuplicates(posts)
  } catch (error) {
    console.error('Error searching posts:', error)
    return []
  }
}

// ============ حذف تکراری‌ها ============
function removeDuplicates(posts: any[]) {
  const uniquePosts = []
  const seenTexts = new Set()

  for (const post of posts) {
    const text = (post.text || post.caption || '').trim()
    
    let isDuplicate = false
    for (const seenText of seenTexts) {
      if (isSimilar(text, seenText)) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      seenTexts.add(text)
      uniquePosts.push(post)
    }
  }

  return uniquePosts
}

// ============ بررسی شباهت ============
function isSimilar(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false
  if (text1 === text2) return true
  if (text1.includes(text2) || text2.includes(text1)) return true
  
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2))
  
  if (words1.size === 0 || words2.size === 0) return false
  
  const commonWords = [...words1].filter(word => words2.has(word))
  const similarity = commonWords.length / Math.max(words1.size, words2.size)
  
  return similarity > 0.8
}

// ============ دریافت همه پست‌ها ============
export async function getAllUniquePosts() {
  try {
    const posts = await prisma.channelPost.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return removeDuplicates(posts)
  } catch (error) {
    console.error('Error getting posts:', error)
    return []
  }
}

// ============ دریافت همه هشتگ‌ها ============
export async function getAllHashtagsCategorized() {
  try {
    const posts = await prisma.channelPost.findMany({
      select: { hashtags: true },
    })

    const hashtagCount = new Map<string, number>()
    
    posts.forEach(post => {
      post.hashtags.forEach(tag => {
        hashtagCount.set(tag, (hashtagCount.get(tag) || 0) + 1)
      })
    })

    const allHashtags = Array.from(hashtagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)

    const colors = [
      'آبی', 'قرمز', 'سفید', 'صورتی', 'بنفش', 'زرد', 
      'نارنجی', 'سبز', 'مشکی', 'طلایی', 'نقره‌ای', 'کرم',
      'قهوه‌ای', 'خاکستری', 'فیروزه‌ای', 'یاسی', 'گلبهی'
    ]

    const typeHashtags = allHashtags.filter(tag => 
      !tag.includes('-') && 
      !tag.includes('+') && 
      !colors.includes(tag) &&
      !['جدید', 'پرفروش', 'تخفیف', 'خاص', 'ویژه'].includes(tag)
    )

    const colorHashtags = allHashtags.filter(tag => colors.includes(tag))
    const priceHashtags = allHashtags.filter(tag => tag.includes('-') || tag.includes('+'))
    const otherHashtags = allHashtags.filter(tag => 
      !typeHashtags.includes(tag) && 
      !colorHashtags.includes(tag) && 
      !priceHashtags.includes(tag)
    )

    return {
      all: allHashtags,
      types: typeHashtags,
      colors: colorHashtags,
      prices: priceHashtags,
      others: otherHashtags,
    }
  } catch (error) {
    console.error('Error getting hashtags:', error)
    return { all: [], types: [], colors: [], prices: [], others: [] }
  }
}

// ============ ساخت دکمه‌های داینامیک ============
export function buildDynamicKeyboard(items: string[], prefix: string, emoji: string, backCallback: string) {
  const buttons = []
  
  for (let i = 0; i < items.length; i += 2) {
    const row = []
    row.push({
      text: `${emoji} ${items[i]}`,
      callback_data: `${prefix}${items[i]}`
    })
    
    if (items[i + 1]) {
      row.push({
        text: `${emoji} ${items[i + 1]}`,
        callback_data: `${prefix}${items[i + 1]}`
      })
    }
    
    buttons.push(row)
  }
  
  if (backCallback) {
    buttons.push([{ text: '🔙 بازگشت', callback_data: backCallback }])
  }
  
  return { inline_keyboard: buttons }
}

export function getPostLink(messageId: number) {
  return `https://t.me/${CHANNEL_USERNAME}/${messageId}`
}