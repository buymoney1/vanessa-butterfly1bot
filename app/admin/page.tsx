// src/app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import ContentForm from '@/components/admin/ContentForm'
import ContentList from '@/components/admin/ContentList'
import ConversationsList from '@/components/admin/ConversationsList'
import PostsManagement from '@/components/admin/PostsManagement'
import { Toaster } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/admin/ui/tabs'
import { MessageSquare, FileText, Image, Package } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('contents')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('vanca_admin_auth', 'true')
    } else {
      alert('رمز عبور اشتباه است')
    }
  }

  useEffect(() => {
    const auth = localStorage.getItem('vanca_admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 inline-block mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت ونسا</h1>
            <p className="text-gray-500 mt-2">لطفاً رمز عبور را وارد کنید</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="رمز عبور"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            ورود
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-1.5">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">پنل مدیریت ونسا</h1>
                <p className="text-xs text-gray-500 hidden sm:block">مدیریت محتوا، گفتگوها و پست‌ها</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('vanca_admin_auth')
                setIsAuthenticated(false)
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              خروج
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex flex-wrap gap-1">
            <TabsTrigger value="contents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">محتواها</span>
              <span className="sm:hidden">محتوا</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">پست‌های کانال</span>
              <span className="sm:hidden">پست‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">گفتگوها</span>
              <span className="sm:hidden">گفتگو</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contents">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ContentForm />
              <ContentList />
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="mt-6">
              <PostsManagement />
            </div>
          </TabsContent>

          <TabsContent value="conversations">
            <div className="mt-6">
              <ConversationsList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}