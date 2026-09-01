'use client'

import { useState, useEffect } from 'react'
import ContentForm from '@/components/admin/ContentForm'
import ContentList from '@/components/admin/ContentList'
import ConversationsList from '@/components/admin/ConversationsList'
import PostsManagement from '@/components/admin/PostsManagement'
import FAQManagement from '@/components/admin/FAQManagement'
import ProductsManagement from '@/components/ProductsManagement'
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
  Shield,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
  RefreshCw,
  ShoppingBag,
  Image as ImageIcon,
  Download
} from 'lucide-react'

// ==================== Decorative Elements ====================
function DecorativeCircle({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 3"
        className="opacity-40"
      />
      <circle
        cx="20"
        cy="20"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('contents')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false)

  // بررسی وضعیت احراز هویت
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('vanca_admin_token')
      const authTime = localStorage.getItem('vanca_admin_auth_time')
      
      if (authToken && authTime) {
        const timeDiff = Date.now() - parseInt(authTime)
        const maxAge = 24 * 60 * 60 * 1000
        
        if (timeDiff < maxAge) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('vanca_admin_token')
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
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setIsAuthenticated(true)
        localStorage.setItem('vanca_admin_token', data.token)
        localStorage.setItem('vanca_admin_auth_time', Date.now().toString())
        toast.success('خوش آمدید! 👋')
      } else {
        toast.error(data.error || 'رمز عبور اشتباه است')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setIsLoading(false)
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('vanca_admin_token')
    localStorage.removeItem('vanca_admin_auth_time')
    setIsAuthenticated(false)
    setActiveTab('contents')
    setIsMobileMenuOpen(false)
    toast.success('با موفقیت خارج شدید')
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setIsMobileMenuOpen(false)
  }

  // 🆕 تابع سینک محصولات (با گزینه force)
  const handleSyncProducts = async () => {
    if (isSyncing) return
    
    // تایید برای آپدیت اجباری
    const shouldForce = confirm(
      'گزینه‌های سینک:\n\n' +
      'OK = بروزرسانی همه محصولات (force)\n' +
      'Cancel = فقط محصولات جدید'
    )
    
    setIsSyncing(true)
    
    try {
      const response = await fetch('/api/admin/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: shouldForce }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        let message = '✅ سینک کامل شد!'
        if (data.created > 0) message += `\n🆕 ${data.created} محصول جدید`
        if (data.updated > 0) message += `\n🔄 ${data.updated} محصول بروزرسانی شد`
        if (data.skipped > 0) message += `\n⏭️ ${data.skipped} محصول از قبل وجود داشت`
        if (data.noText > 0) message += `\n📝 ${data.noText} پست بدون متن`
        if (data.noTitle > 0) message += `\n📝 ${data.noTitle} پست بدون عنوان`
        if (data.noDescription > 0) message += `\n📝 ${data.noDescription} پست بدون توضیحات`
        
        toast.success(message, { duration: 5000 })
        
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        toast.error(data.error || 'خطا در سینک محصولات')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setIsSyncing(false)
    }
  }

  // 🆕 تابع دانلود عکس‌های قدیمی
  const handleDownloadPhotos = async () => {
    if (isDownloadingPhotos) return
    
    if (!confirm('آیا می‌خواهید عکس‌های پست‌های قدیمی را دانلود و در S3 آپلود کنید؟')) return
    
    setIsDownloadingPhotos(true)
    
    try {
      const response = await fetch('/api/admin/download-photos', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(`✅ ${data.uploaded} عکس دانلود و آپلود شد!`)
        
        if (data.failed > 0) {
          toast.warning(`${data.failed} عکس خطا داشت`)
        }
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error(data.error || 'خطا در دانلود عکس‌ها')
      }
    } catch (error) {
      console.error('Download photos error:', error)
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setIsDownloadingPhotos(false)
    }
  }

  // لودینگ هنگام بررسی احراز هویت
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBF9] relative">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.01]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #b45309 1px, transparent 1px),
                            radial-gradient(circle at 80% 70%, #166534 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-[#e6b741]/[0.03] rounded-full blur-[150px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-[#2D6A4F]/[0.03] rounded-full blur-[130px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
        
        <div className="relative flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#e6b741] animate-spin" />
          <span className="text-sm text-stone-400 font-medium">در حال بررسی...</span>
        </div>
      </div>
    )
  }

  // صفحه ورود
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#FBFBF9] p-4 relative selection:bg-[#e6b741]/30 selection:text-[#0F1F18]"
        dir="rtl"
      >
        <Toaster position="top-right" richColors />
        
        {/* Background Texture */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.01]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #b45309 1px, transparent 1px),
                            radial-gradient(circle at 80% 70%, #166534 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        
        {/* Background Blurs */}
        <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-[#e6b741]/[0.03] rounded-full blur-[150px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-[#2D6A4F]/[0.03] rounded-full blur-[130px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
        
        <div className="relative bg-white/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-3xl shadow-xl shadow-stone-200/50 w-full max-w-md border border-stone-200/50">
          {/* Decorative top */}
          <div className="flex justify-center mb-6 sm:mb-8 relative">
            <DecorativeCircle size={50} className="text-[#e6b741]/20 absolute -top-3 -right-3" />
            <DecorativeCircle size={35} className="text-[#2D6A4F]/15 absolute -bottom-2 -left-2" />
            
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-100/50 relative">
              <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-[#0F1F18]" />
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#e6b741] absolute -top-1 -left-1" />
            </div>
          </div>
          
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mb-2">
              پنل مدیریت ونسا
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              برای دسترسی به پنل، رمز عبور را وارد کنید
            </p>
          </div>
          
          <div className="relative mb-4 sm:mb-5">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="رمز عبور"
              disabled={isLoading}
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-[#e6b741]/40 transition-all disabled:opacity-50 bg-white text-stone-800 placeholder:text-stone-300 font-medium text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-[#e6b741] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-[#e6b741] hover:bg-[#d4a635] text-[#0F1F18] py-3.5 sm:py-4 rounded-2xl font-bold transition-all shadow-[0_4px_15px_rgba(230,183,65,0.2)] hover:shadow-[0_6px_20px_rgba(230,183,65,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                در حال ورود...
              </>
            ) : (
              <>
                ورود به پنل
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </>
            )}
          </button>
          
          <div className="flex items-center gap-3 mt-5 sm:mt-6">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-[9px] sm:text-[10px] text-stone-300 font-medium">
              دسترسی فقط برای مدیران مجاز است
            </span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>
        </div>
      </div>
    )
  }

  // پنل اصلی
  return (
    <div 
      className="min-h-screen bg-[#FBFBF9] selection:bg-[#e6b741]/30 selection:text-[#0F1F18] relative"
      dir="rtl"
    >
      <Toaster position="top-right" richColors />
      
      {/* Background Texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.01]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #b45309 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, #166534 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      
      {/* Background Blurs */}
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-[#e6b741]/[0.02] rounded-full blur-[150px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-[#2D6A4F]/[0.02] rounded-full blur-[130px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
      
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 px-3 sm:px-4 py-3">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.03] rounded-2xl sm:rounded-full px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border border-stone-200/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-sm">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#0F1F18]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-stone-900">پنل مدیریت ونسا</h1>
              <p className="text-[10px] text-stone-400">
                مدیریت محتوا، گفتگوها، پست‌ها و سوالات متداول
              </p>
            </div>
            <h1 className="sm:hidden text-sm font-black text-stone-900">
              مدیریت ونسا
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* دکمه دانلود عکس‌ها */}
            <button
              onClick={handleDownloadPhotos}
              disabled={isDownloadingPhotos}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-full transition-colors text-xs font-bold border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="دانلود عکس‌های قدیمی"
            >
              {isDownloadingPhotos ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden lg:inline">
                {isDownloadingPhotos ? 'در حال دانلود...' : 'دانلود عکس‌ها'}
              </span>
            </button>
            
            {/* دکمه سینک محصولات */}
            <button
              onClick={handleSyncProducts}
              disabled={isSyncing}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#e6b741]/10 hover:bg-[#e6b741]/20 text-[#0F1F18] rounded-full transition-colors text-xs font-bold border border-[#e6b741]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="سینک پست‌ها با محصولات"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">
                {isSyncing ? 'در حال سینک...' : 'سینک محصولات'}
              </span>
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-stone-50 rounded-xl transition-colors text-stone-500"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-red-500 hover:bg-red-50 rounded-full transition-colors text-xs font-bold"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Desktop Tabs */}
          <TabsList className="hidden sm:flex bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/[0.03] border border-stone-200/50 p-1.5 gap-1 sticky top-20 z-10">
            <TabsTrigger 
              value="contents" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#e6b741] data-[state=active]:text-[#0F1F18] data-[state=active]:shadow-[0_4px_15px_rgba(230,183,65,0.2)] text-stone-400 hover:text-stone-600"
            >
              <FileText className="h-4 w-4" />
              محتواها
            </TabsTrigger>
            
            <TabsTrigger 
              value="posts" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#e6b741] data-[state=active]:text-[#0F1F18] data-[state=active]:shadow-[0_4px_15px_rgba(230,183,65,0.2)] text-stone-400 hover:text-stone-600"
            >
              <Package className="h-4 w-4" />
              پست‌های کانال
            </TabsTrigger>
            
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#e6b741] data-[state=active]:text-[#0F1F18] data-[state=active]:shadow-[0_4px_15px_rgba(230,183,65,0.2)] text-stone-400 hover:text-stone-600"
            >
              <ShoppingBag className="h-4 w-4" />
              محصولات سایت
            </TabsTrigger>
            
            <TabsTrigger 
              value="faq" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#e6b741] data-[state=active]:text-[#0F1F18] data-[state=active]:shadow-[0_4px_15px_rgba(230,183,65,0.2)] text-stone-400 hover:text-stone-600"
            >
              <HelpCircle className="h-4 w-4" />
              سوالات متداول
            </TabsTrigger>
            
            <TabsTrigger 
              value="conversations" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#e6b741] data-[state=active]:text-[#0F1F18] data-[state=active]:shadow-[0_4px_15px_rgba(230,183,65,0.2)] text-stone-400 hover:text-stone-600"
            >
              <MessageSquare className="h-4 w-4" />
              گفتگوها
            </TabsTrigger>
          </TabsList>

          {/* Mobile Tabs - Bottom Navigation */}
          <div className="sm:hidden fixed bottom-0 right-0 left-0 z-30 bg-white/95 backdrop-blur-xl border-t border-stone-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-5 gap-1 p-2">
              <button
                onClick={() => handleTabChange('contents')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === 'contents' 
                    ? 'bg-[#e6b741]/10 text-[#0F1F18]' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-[10px] font-bold">محتوا</span>
              </button>
              
              <button
                onClick={() => handleTabChange('posts')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === 'posts' 
                    ? 'bg-[#e6b741]/10 text-[#0F1F18]' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Package className="h-5 w-5" />
                <span className="text-[10px] font-bold">پست‌ها</span>
              </button>
              
              <button
                onClick={() => handleTabChange('products')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === 'products' 
                    ? 'bg-[#e6b741]/10 text-[#0F1F18]' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="text-[10px] font-bold">محصولات</span>
              </button>
              
              <button
                onClick={() => handleTabChange('faq')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === 'faq' 
                    ? 'bg-[#e6b741]/10 text-[#0F1F18]' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <HelpCircle className="h-5 w-5" />
                <span className="text-[10px] font-bold">FAQ</span>
              </button>
              
              <button
                onClick={() => handleTabChange('conversations')}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === 'conversations' 
                    ? 'bg-[#e6b741]/10 text-[#0F1F18]' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-[10px] font-bold">گفتگو</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="sm:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute top-20 right-3 left-3 bg-white rounded-2xl shadow-xl border border-stone-200/50 p-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDownloadPhotos}
                  disabled={isDownloadingPhotos}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-sm font-bold"
                >
                  {isDownloadingPhotos ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  {isDownloadingPhotos ? 'در حال دانلود...' : 'دانلود عکس‌ها'}
                </button>
                
                <button
                  onClick={handleSyncProducts}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[#0F1F18] hover:bg-amber-50 rounded-xl transition-colors text-sm font-bold"
                >
                  {isSyncing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  {isSyncing ? 'در حال سینک...' : 'سینک محصولات'}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
                >
                  <LogOut className="h-5 w-5" />
                  خروج از پنل
                </button>
              </div>
            </div>
          )}

          <TabsContent value="contents">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 mb-20 sm:mb-0">
              <ContentForm />
              <ContentList />
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="mt-4 sm:mt-6 mb-20 sm:mb-0">
              <PostsManagement />
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="mt-4 sm:mt-6 mb-20 sm:mb-0">
              <ProductsManagement />
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="mt-4 sm:mt-6 mb-20 sm:mb-0">
              <FAQManagement />
            </div>
          </TabsContent>

          <TabsContent value="conversations">
            <div className="mt-4 sm:mt-6 mb-20 sm:mb-0">
              <ConversationsList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}