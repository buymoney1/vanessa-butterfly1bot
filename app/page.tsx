'use client'

import { useState, useEffect } from 'react'
import { Bot, Database, Cpu, CheckCircle, XCircle, Loader2, MessageSquare, Image, Settings } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking'
  icon: React.ReactNode
  description: string
}

export default function Home() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Telegram Bot',
      status: 'checking',
      icon: <Bot className="h-6 w-6" />,
      description: 'اتصال به بات تلگرام'
    },
    {
      name: 'MongoDB Atlas',
      status: 'checking',
      icon: <Database className="h-6 w-6" />,
      description: 'اتصال به دیتابیس'
    },
    {
      name: 'GapGPT AI',
      status: 'checking',
      icon: <Cpu className="h-6 w-6" />,
      description: 'اتصال به هوش مصنوعی'
    },
    {
      name: 'Webhook',
      status: 'checking',
      icon: <Settings className="h-6 w-6" />,
      description: 'تنظیمات وب‌هوک'
    }
  ])

  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalContents: 0,
    activeUsers: 0
  })

  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkServices()
    fetchStats()
  }, [])

  const checkServices = async () => {
    // Check Telegram Bot
    try {
      const telegramResponse = await fetch('/api/health/telegram')
      const telegramData = await telegramResponse.json()
      
      updateServiceStatus('Telegram Bot', telegramData.status === 'ok' ? 'online' : 'offline')
    } catch (error) {
      updateServiceStatus('Telegram Bot', 'offline')
    }

    // Check Database
    try {
      const dbResponse = await fetch('/api/health/database')
      const dbData = await dbResponse.json()
      
      updateServiceStatus('MongoDB Atlas', dbData.status === 'ok' ? 'online' : 'offline')
    } catch (error) {
      updateServiceStatus('MongoDB Atlas', 'offline')
    }

    // Check GapGPT
    try {
      const aiResponse = await fetch('/api/health/gapgpt')
      const aiData = await aiResponse.json()
      
      updateServiceStatus('GapGPT AI', aiData.status === 'ok' ? 'online' : 'offline')
    } catch (error) {
      updateServiceStatus('GapGPT AI', 'offline')
    }

    // Check Webhook
    try {
      const webhookResponse = await fetch('/api/health/webhook')
      const webhookData = await webhookResponse.json()
      
      updateServiceStatus('Webhook', webhookData.status === 'ok' ? 'online' : 'offline')
    } catch (error) {
      updateServiceStatus('Webhook', 'offline')
    }
  }

  const updateServiceStatus = (name: string, status: 'online' | 'offline') => {
    setServices(prev => 
      prev.map(service => 
        service.name === name ? { ...service, status } : service
      )
    )
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      setStats({
        totalConversations: data.totalConversations || 0,
        totalMessages: data.totalMessages || 0,
        totalContents: data.totalContents || 0,
        activeUsers: data.activeUsers || 0
      })

      setRecentMessages(data.recentMessages || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'checking':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200'
      case 'offline':
        return 'bg-red-50 border-red-200'
      case 'checking':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'فعال'
      case 'offline':
        return 'غیرفعال'
      case 'checking':
        return 'در حال بررسی'
      default:
        return 'نامشخص'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Vanca Support Bot
                </h1>
                <p className="text-gray-600 mt-1">
                  سیستم پشتیبانی هوشمند با قدرت GapGPT
                </p>
              </div>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              پنل مدیریت
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Cards */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            وضعیت سرویس‌ها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={`border rounded-xl p-6 transition-all duration-300 ${getStatusColor(service.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-700">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusIcon(service.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    service.status === 'online' ? 'text-green-700' :
                    service.status === 'offline' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {getStatusText(service.status)}
                  </span>
                  {service.status === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            آمار کلی
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">گفتگوها</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loading ? '...' : stats.totalConversations}
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">پیام‌ها</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loading ? '...' : stats.totalMessages}
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">محتواها</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loading ? '...' : stats.totalContents}
                  </p>
                </div>
                <Image className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کاربران فعال</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loading ? '...' : stats.activeUsers}
                  </p>
                </div>
                <Bot className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Recent Messages */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            آخرین پیام‌ها
          </h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                هنوز پیامی ثبت نشده است
              </div>
            ) : (
              <div className="divide-y">
                {recentMessages.map((message: any) => (
                  <div key={message.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {message.role === 'user' ? (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {message.role === 'user' ? 'کاربر' : 'ربات'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString('fa-IR')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            دسترسی سریع
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin"
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <Settings className="h-8 w-8 text-blue-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                پنل مدیریت
              </h3>
              <p className="text-sm text-gray-600">
                مدیریت محتوا، مشاهده گفتگوها و تنظیمات سیستم
              </p>
            </a>

            <a
              href="https://t.me/your_bot_username"
              target="_blank"
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <Bot className="h-8 w-8 text-green-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                تست بات تلگرام
              </h3>
              <p className="text-sm text-gray-600">
                باز کردن بات در تلگرام و شروع گفتگو
              </p>
            </a>

            <a
              href="/api/health"
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <CheckCircle className="h-8 w-8 text-purple-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                بررسی سلامت
              </h3>
              <p className="text-sm text-gray-600">
                بررسی وضعیت API و سرویس‌ها
              </p>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              © 2024 Vanca Support Bot - Powered by GapGPT
            </p>
            <p className="text-sm text-gray-500">
              نسخه 0.1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}