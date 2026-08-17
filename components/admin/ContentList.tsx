// src/components/admin/ConversationsList.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  User, Bot, MessageSquare, Search, ChevronDown, ChevronUp, 
  Clock, MousePointerClick, RefreshCw, Inbox
} from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface UserData {
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
}

interface Conversation {
  id: string
  user: UserData
  messages: Message[]
  updatedAt: string
}

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedChat, setExpandedChat] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/conversations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedChat(expandedChat === id ? null : id)
  }

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return date
    }
  }

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return date
    }
  }

  const getMessageStyle = (content: string, role: string) => {
    if (content.startsWith('🔘')) {
      return {
        bg: 'bg-amber-50 border border-amber-200',
        text: 'text-amber-800',
        icon: <MousePointerClick className="h-4 w-4 text-amber-500" />,
        label: 'کلیک روی دکمه',
        dotColor: 'bg-amber-500'
      }
    }
    
    if (role === 'user') {
      return {
        bg: 'bg-blue-50 border border-blue-200',
        text: 'text-blue-800',
        icon: <User className="h-4 w-4 text-blue-500" />,
        label: 'کاربر',
        dotColor: 'bg-blue-500'
      }
    }
    
    return {
      bg: 'bg-gray-50 border border-gray-200',
      text: 'text-gray-800',
      icon: <Bot className="h-4 w-4 text-green-500" />,
      label: 'ربات',
      dotColor: 'bg-green-500'
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const userName = `${conv.user?.firstName || ''} ${conv.user?.lastName || ''} ${conv.user?.username || ''}`.toLowerCase()
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) ||
      conv.messages?.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">در حال بارگذاری گفتگوها...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <div className="text-center">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Inbox className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-500 mb-2 font-medium">خطا در بارگذاری</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 rounded-xl p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">گفتگوها</h2>
              <p className="text-sm text-gray-500">
                {conversations.length} گفتگو ثبت شده
              </p>
            </div>
          </div>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            بروزرسانی
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو در گفتگوها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="divide-y divide-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400">گفتگویی یافت نشد</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div key={conversation.id} className="group">
              {/* Conversation header */}
              <div 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(conversation.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">
                        {(conversation.user?.firstName?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    
                    {/* User info */}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {conversation.user?.firstName || 'Unknown'} {conversation.user?.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.user?.username 
                          ? `@${conversation.user.username}` 
                          : `ID: ${conversation.user?.telegramId || 'N/A'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="hidden sm:inline-block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {conversation.messages?.length || 0} رویداد
                    </span>
                    <span className="hidden md:flex text-xs text-gray-400 items-center">
                      <Clock className="h-3 w-3 ml-1" />
                      {formatDate(conversation.updatedAt)}
                    </span>
                    {expandedChat === conversation.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {expandedChat === conversation.id && (
                <div className="bg-gray-50/50 px-3 sm:px-4 pb-4">
                  <div className="space-y-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto pt-4">
                    {conversation.messages?.map((message, index) => {
                      const style = getMessageStyle(message.content, message.role)
                      
                      return (
                        <div key={message.id} className="flex items-start gap-2 sm:gap-3">
                          {/* Time - hidden on mobile */}
                          <span className="hidden sm:block text-[10px] text-gray-400 mt-1.5 w-20 flex-shrink-0 text-left">
                            {formatTime(message.createdAt)}
                          </span>
                          
                          {/* Icon */}
                          <div className={`flex-shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center ${style.bg}`}>
                            {style.icon}
                          </div>
                          
                          {/* Message content */}
                          <div className={`flex-1 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 ${style.bg}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-medium flex items-center gap-1 ${style.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`}></span>
                                {style.label}
                              </span>
                              {/* Time on mobile */}
                              <span className="sm:hidden text-[9px] text-gray-400">
                                {formatTime(message.createdAt)}
                              </span>
                              {index === conversation.messages.length - 1 && (
                                <span className="hidden sm:inline-block text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                                  آخرین
                                </span>
                              )}
                            </div>
                            <p className={`text-xs sm:text-sm whitespace-pre-wrap ${style.text}`}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-400 text-center">
          {filteredConversations.length} از {conversations.length} گفتگو نمایش داده می‌شود
        </p>
      </div>
    </div>
  )
}