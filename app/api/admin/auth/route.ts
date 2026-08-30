import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // رمز عبور از متغیر محیطی سمت سرور
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (password === adminPassword) {
      // ایجاد توکن ساده (در محیط واقعی از JWT استفاده کنید)
      const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
      
      return NextResponse.json({
        success: true,
        token,
        message: 'Authentication successful'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}