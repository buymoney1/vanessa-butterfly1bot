'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { User, Bot, MessageSquare, Search, ChevronDown, ChevronUp, Clock } from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface UserData {
  telegramId: number
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

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/conversations')
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch')
      }
      
      const data = await response.json()
      console.log('📊 Conversations data:', data)
      
      setConversations(data)
    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">در حال بارگذاری گفتگوها...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">خطا در بارگذاری گفتگوها</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={fetchConversations}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 rounded-xl p-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">گفتگوها</h2>
              <p className="text-sm text-gray-500">{conversations.length} گفتگو ثبت شده</p>
            </div>
          </div>
          <button
            onClick={fetchConversations}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
          >
            🔄 بروزرسانی
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400">هنوز گفتگویی ثبت نشده است</p>
            <p className="text-gray-300 text-sm mt-2">با بات چت کنید تا گفتگوها اینجا نمایش داده شوند</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div key={conversation.id} className="group">
              <div 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {(conversation.user?.firstName?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {conversation.user?.firstName || 'Unknown'} {conversation.user?.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.user?.username 
                          ? `@${conversation.user.username}` 
                          : `ID: ${conversation.user?.telegramId || 'N/A'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {conversation.messages?.length || 0} پیام
                    </span>
                    <span className="text-xs text-gray-400 flex items-center">
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

              {expandedChat === conversation.id && (
                <div className="bg-gray-50/50 px-4 pb-4">
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pt-4">
                    {conversation.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p className={`text-[10px] mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}