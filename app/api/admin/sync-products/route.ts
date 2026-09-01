// app/api/admin/sync-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { syncAllChannelPostsToProducts } from '@/lib/productSync'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const forceUpdate = body.force === true || body.force === 'true'
    
    const result = await syncAllChannelPostsToProducts(forceUpdate)
    
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error syncing products:', error)
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    const result = await syncAllChannelPostsToProducts(force)
    
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error syncing products:', error)
    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    )
  }
}