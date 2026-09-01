// src/lib/productSync.ts
import { prisma } from './prisma'

/**
 * تبدیل قیمت متنی به عدد
 */
export function parsePrice(priceText: string): number {
  if (!priceText) return 0
  
  priceText = priceText.trim().toLowerCase()
  priceText = priceText.replace(/\s*t\s*$|تومان\s*$/g, '').trim()
  priceText = priceText.replace(/\s*\/\s*/g, '/')
  
  if (priceText.includes('/')) {
    const [millions, thousands] = priceText.split('/')
    const mil = parseInt(millions) || 0
    const thou = parseInt(thousands) || 0
    return (mil * 1000000) + (thou * 1000)
  }
  
  const num = parseInt(priceText)
  if (!isNaN(num)) {
    if (num < 100) {
      return num * 1000000
    } else if (num < 1000) {
      return num * 1000
    } else if (num < 10000) {
      return num * 1000
    } else {
      return num
    }
  }
  
  return 0
}

/**
 * استخراج دسته‌بندی از هشتگ‌ها
 */
export function extractCategory(hashtags: string[]): string {
  if (!hashtags || hashtags.length === 0) return 'عمومی'
  
  const cleanHashtags = hashtags.map(tag => tag.replace('#', '').trim())
  
  const nonCategoryTags = [
    'جدید', 'پرفروش', 'تخفیف', 'خاص', 'ویژه', 
    'وانسا', 'گل', 'کادو', 'هدیه', 'گل_جاودان',
    'گل_طبیعی', 'رز_جاودان', 'گل_کادویی',
    '1000t', '2000t', '3000t', '4000t', '5000t',
    'ارسال_رایگان', 'ارسال_فوری', 'موجود', 'ناموجود'
  ]
  
  const category = cleanHashtags.find(tag => !nonCategoryTags.includes(tag))
  
  return category || 'عمومی'
}

/**
 * استخراج قیمت از متن پست
 */
export function extractPriceFromText(text: string): number {
  if (!text) return 0
  
  const tPatterns = [
    /(\d+)\s*\/\s*(\d+)\s*t\b/i,
    /(\d+)\s*t\b/i,
  ]
  
  for (const pattern of tPatterns) {
    const match = text.match(pattern)
    if (match) {
      return parsePrice(match[0])
    }
  }
  
  const otherPatterns = [
    /(\d+)\s*\/\s*(\d+)\s*تومان/i,
    /(\d+)\s*\/\s*(\d+)\s*میلیون/i,
    /(\d+)\s*تومان/i,
    /(\d+)\s*میلیون/i,
    /(\d+)\s*هزار\s*تومان/i,
  ]
  
  for (const pattern of otherPatterns) {
    const match = text.match(pattern)
    if (match) {
      return parsePrice(match[0])
    }
  }
  
  return 0
}

/**
 * استخراج عنوان و توضیحات از متن پست
 */
export function extractTitleAndDescription(text: string): { title: string; description: string } {
  if (!text) return { title: '', description: '' }
  
  const lines = text.split('\n')
  
  if (lines.length === 0) {
    return { title: '', description: '' }
  }
  
  const title = lines[0].trim()
  const description = lines.slice(1).join('\n').trim()
  
  return { title, description }
}

/**
 * بررسی اینکه آیا متن پست یک محصول واقعی هست یا نه
 */
export function isValidProductText(text: string): boolean {
  if (!text || text.trim() === '') return false
  
  const { title, description } = extractTitleAndDescription(text)
  
  // باید عنوان داشته باشه
  if (!title || title.trim() === '') return false
  
  // باید توضیحات داشته باشه
  if (!description || description.trim() === '') return false
  
  // عنوان نباید فقط هشتگ باشه
  if (title.startsWith('#')) return false
  
  // عنوان نباید فقط "Code" باشه
  if (title.toLowerCase().startsWith('code')) return false
  
  return true
}

/**
 * ساخت Product از ChannelPost
 */
export async function createProductFromChannelPost(channelPost: any): Promise<any | null> {
  try {
    if (channelPost.product) {
      return channelPost.product
    }
    
    const existingProduct = await prisma.product.findUnique({
      where: { channelPostId: channelPost.id },
    })
    
    if (existingProduct) {
      return existingProduct
    }
    
    const fullText = channelPost.text || channelPost.caption || ''
    
    // 🔴 بررسی معتبر بودن متن
    if (!isValidProductText(fullText)) {
      console.log(`⏭️ Post ${channelPost.messageId} is not a valid product, skipping`)
      return null
    }
    
    const { title, description } = extractTitleAndDescription(fullText)
    const category = extractCategory(channelPost.hashtags)
    const price = extractPriceFromText(fullText)
    const images = channelPost.photoUrl ? [channelPost.photoUrl] : ['/placeholder.svg']
    const code = `TG-${channelPost.messageId}`
    
    const product = await prisma.product.create({
      data: {
        code,
        title,
        description,
        price,
        shippingCost: 0,
        images,
        category,
        inStock: true,
        stockQuantity: 0,
        minPrepDays: 1,
        hasUnlimitedStock: true,
        channelPostId: channelPost.id,
      },
    })
    
    console.log(`✅ Product created: ${title} | Price: ${price}`)
    
    return product
  } catch (error) {
    console.error('Error creating product:', error)
    return null
  }
}

/**
 * آپدیت Product از ChannelPost
 */
export async function updateProductFromChannelPost(channelPost: any): Promise<any | null> {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { channelPostId: channelPost.id },
    })
    
    if (!existingProduct) {
      return await createProductFromChannelPost(channelPost)
    }
    
    const fullText = channelPost.text || channelPost.caption || ''
    
    // 🔴 اگه متن معتبر نیست، محصول رو غیرفعال کن (inStock = false)
    if (!isValidProductText(fullText)) {
      console.log(`⏭️ Post ${channelPost.messageId} is not valid, setting inStock=false`)
      
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: { inStock: false },
      })
      
      return existingProduct
    }
    
    const { title, description } = extractTitleAndDescription(fullText)
    const category = extractCategory(channelPost.hashtags)
    const price = extractPriceFromText(fullText)
    
    const images = channelPost.photoUrl 
      ? [channelPost.photoUrl] 
      : existingProduct.images
    
    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        title,
        description,
        price,
        category,
        images,
        inStock: true,  // ✅ معتبره پس موجوده
      },
    })
    
    console.log(`✅ Product updated: ${title} | Price: ${price}`)
    
    return updatedProduct
  } catch (error) {
    console.error('Error updating product:', error)
    return null
  }
}

/**
 * همگام‌سازی همه ChannelPost ها با Product
 */
export async function syncAllChannelPostsToProducts(forceUpdate: boolean = false) {
  try {
    console.log(`🔄 Starting sync... (force: ${forceUpdate})`)
    
    const posts = await prisma.channelPost.findMany({
      orderBy: { createdAt: 'asc' },
    })
    
    console.log(`📊 Found ${posts.length} channel posts`)
    
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0
    let invalidCount = 0
    
    for (const post of posts) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { channelPostId: post.id },
        })
        
        // 🔴 اگه متن معتبر نیست
        const fullText = post.text || post.caption || ''
        if (!isValidProductText(fullText)) {
          invalidCount++
          
          // اگه Product از قبل وجود داره، غیرفعالش کن
          if (existingProduct && existingProduct.inStock) {
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: { inStock: false },
            })
            console.log(`⏭️ Post ${post.messageId} invalid, product disabled`)
          }
          continue
        }
        
        if (existingProduct && !forceUpdate) {
          skippedCount++
          continue
        }
        
        if (existingProduct && forceUpdate) {
          const result = await updateProductFromChannelPost(post)
          if (result) {
            updatedCount++
          } else {
            failedCount++
          }
          continue
        }
        
        const product = await createProductFromChannelPost(post)
        if (product) {
          createdCount++
        } else {
          failedCount++
        }
      } catch (error) {
        failedCount++
        console.error(`❌ Failed for post ${post.messageId}:`, error)
      }
    }
    
    console.log(`✅ Sync complete!`)
    console.log(`   Created: ${createdCount}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Skipped: ${skippedCount}`)
    console.log(`   Invalid: ${invalidCount}`)
    console.log(`   Failed: ${failedCount}`)
    
    return { 
      total: posts.length, 
      created: createdCount, 
      updated: updatedCount,
      skipped: skippedCount, 
      invalid: invalidCount,
      failed: failedCount,
    }
  } catch (error) {
    console.error('Error syncing:', error)
    return { total: 0, created: 0, updated: 0, skipped: 0, invalid: 0, failed: 0 }
  }
}