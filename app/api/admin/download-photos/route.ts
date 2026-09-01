// app/api/admin/download-photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { downloadAndUploadPhoto } from '@/lib/telegramChannel'

export async function POST(request: NextRequest) {
  try {
    // 🔴 همه پست‌هایی که photoFileId دارن - بدون فیلتر photoUrl
    const posts = await prisma.channelPost.findMany({
      where: {
        photoFileId: { not: null },
      },
    })
    
    console.log(`📊 Found ${posts.length} posts with photoFileId`)
    
    let uploadedCount = 0
    let failedCount = 0
    let skippedCount = 0
    
    for (const post of posts) {
      try {
        if (!post.photoFileId) {
          skippedCount++
          continue
        }
        
        console.log(`📥 Downloading photo for post ${post.messageId}...`)
        
        const photoUrl = await downloadAndUploadPhoto(post.photoFileId)
        
        if (photoUrl) {
          // آپدیت ChannelPost
          await prisma.channelPost.update({
            where: { id: post.id },
            data: { photoUrl },
          })
          
          // آپدیت Product اگه وجود داره
          const product = await prisma.product.findUnique({
            where: { channelPostId: post.id },
          })
          
          if (product) {
            await prisma.product.update({
              where: { id: product.id },
              data: { images: [photoUrl] },
            })
            console.log(`   ✅ Product images updated`)
          }
          
          uploadedCount++
          console.log(`   ✅ Photo uploaded: ${photoUrl}`)
        } else {
          failedCount++
          console.log(`   ❌ Failed to upload photo`)
        }
      } catch (error) {
        failedCount++
        console.error(`❌ Failed for post ${post.messageId}:`, error)
      }
    }
    
    console.log(`✅ Download complete! Uploaded: ${uploadedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`)
    
    return NextResponse.json({
      success: true,
      total: posts.length,
      uploaded: uploadedCount,
      failed: failedCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('Error downloading photos:', error)
    return NextResponse.json(
      { error: 'Failed to download photos' },
      { status: 500 }
    )
  }
}