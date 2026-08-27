// src/app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import ContentForm from '@/components/admin/ContentForm'
import ContentList from '@/components/admin/ContentList'
import ConversationsList from '@/components/admin/ConversationsList'
import PostsManagement from '@/components/admin/PostsManagement'
import FAQManagement from '@/components/admin/FAQManagement'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/admin/ui/tabs'
import { 
  MessageSquare, 
  FileText, 
  Package, 
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  Shield
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('contents')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // بررسی وضعیت احراز هویت
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('vanca_admin_auth')
      const authTime = localStorage.getItem('vanca_admin_auth_time')
      
      if (auth === 'true' && authTime) {
        // بررسی انقضای session (مثلاً 24 ساعت)
        const timeDiff = Date.now() - parseInt(authTime)
        const maxAge = 24 * 60 * 60 * 1000 // 24 ساعت
        
        if (timeDiff < maxAge) {
          setIsAuthenticated(true)
        } else {
          // پاک کردن session منقضی شده
          localStorage.removeItem('vanca_admin_auth')
          localStorage.removeItem('vanca_admin_auth_time')
        }
      }
      
      setIsCheckingAuth(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = async () => {
    if (!password) {
      toast.error('لطفاً رمز عبور را وارد کنید')
      return
    }

    setIsLoading(true)
    
    try {
      // شبیه‌سازی تاخیر برای UX بهتر
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        setIsAuthenticated(true)
        localStorage.setItem('vanca_admin_auth', 'true')
        localStorage.setItem('vanca_admin_auth_time', Date.now().toString())
        toast.success('خوش آمدید! 👋')
      } else {
        toast.error('رمز عبور اشتباه است')
      }
    } catch (error) {
      toast.error('خطا در ورود به سیستم')
    } finally {
      setIsLoading(false)
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('vanca_admin_auth')
    localStorage.removeItem('vanca_admin_auth_time')
    setIsAuthenticated(false)
    setActiveTab('contents')
    toast.success('با موفقیت خارج شدید')
  }

  // نمایش لودینگ هنگام بررسی احراز هویت
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  // صفحه ورود
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Toaster position="top-right" />
        
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 inline-block mb-4 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت ونسا</h1>
            <p className="text-gray-500 mt-2 text-sm">برای دسترسی به پنل، رمز عبور را وارد کنید</p>
          </div>
          
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="رمز عبور"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                در حال ورود...
              </>
            ) : (
              'ورود به پنل'
            )}
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            دسترسی فقط برای مدیران مجاز است
          </p>
        </div>
      </div>
    )
  }

  // پنل اصلی
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">پنل مدیریت ونسا</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  مدیریت محتوا، گفتگوها، پست‌ها و سوالات متداول
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex flex-wrap gap-1 sticky top-16 z-10">
            <TabsTrigger 
              value="contents" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">محتواها</span>
              <span className="sm:hidden">محتوا</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="posts" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">پست‌های کانال</span>
              <span className="sm:hidden">پست‌ها</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="faq" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">سوالات متداول</span>
              <span className="sm:hidden">FAQ</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="conversations" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
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

          <TabsContent value="faq">
            <div className="mt-6">
              <FAQManagement />
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