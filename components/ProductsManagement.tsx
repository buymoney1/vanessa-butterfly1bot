'use client'

import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { 
  Package, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  code: string | null
  title: string
  description: string
  price: number
  shippingCost: number
  images: string[]
  category: string
  inStock: boolean
  stockQuantity: number
  minPrepDays: number
  hasUnlimitedStock: boolean
  channelPostId: string | null
  createdAt: string
  updatedAt: string
}

const toPersianNumbers = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

const formatPrice = (price: number): string => {
  const formatted = price.toLocaleString('fa-IR')
  return toPersianNumbers(formatted)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fa-IR')
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    shippingCost: '',
    category: '',
    inStock: true,
    stockQuantity: '',
    minPrepDays: '',
    hasUnlimitedStock: false,
    code: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // دریافت محصولات
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/products?limit=100')
      const data = await response.json()
      
      if (response.ok) {
        const productList = data.products || data || []
        setProducts(productList)
        setFilteredProducts(productList)
        
        // استخراج دسته‌بندی‌ها
        const cats = Array.from(new Set(productList.map((p: Product) => p.category)))
        setCategories(cats as string[])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('خطا در دریافت محصولات')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // فیلتر محصولات
  useEffect(() => {
    let result = [...products]
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.code && p.code.toLowerCase().includes(query)) ||
          p.category.toLowerCase().includes(query)
      )
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory)
    }
    
    setFilteredProducts(result)
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, products])

  // صفحه‌بندی
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // باز کردن مدال ویرایش
  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditForm({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      shippingCost: product.shippingCost.toString(),
      category: product.category,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity.toString(),
      minPrepDays: product.minPrepDays.toString(),
      hasUnlimitedStock: product.hasUnlimitedStock,
      code: product.code || '',
    })
    setIsEditing(true)
  }

  // ذخیره ویرایش
  const handleSave = async () => {
    if (!selectedProduct) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          price: parseFloat(editForm.price) || 0,
          shippingCost: parseFloat(editForm.shippingCost) || 0,
          category: editForm.category,
          inStock: editForm.inStock,
          stockQuantity: parseInt(editForm.stockQuantity) || 0,
          minPrepDays: parseInt(editForm.minPrepDays) || 1,
          hasUnlimitedStock: editForm.hasUnlimitedStock,
          code: editForm.code || null,
        }),
      })
      
      if (response.ok) {
        toast.success('✅ محصول با موفقیت ویرایش شد')
        setIsEditing(false)
        setSelectedProduct(null)
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'خطا در ویرایش محصول')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('خطا در ذخیره محصول')
    } finally {
      setIsSaving(false)
    }
  }

  // حذف محصول
  const handleDelete = async (product: Product) => {
    if (!confirm(`آیا از حذف "${product.title}" مطمئن هستید؟`)) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('🗑️ محصول حذف شد')
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'خطا در حذف محصول')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('خطا در حذف محصول')
    } finally {
      setIsDeleting(false)
    }
  }

  // مشاهده در سایت
  const handleView = (productId: string) => {
    window.open(`/products/${productId}`, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#e6b741] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-2.5">
            <Package className="h-5 w-5 text-[#0F1F18]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900">محصولات سایت</h2>
            <p className="text-xs text-stone-400">{products.length} محصول</p>
          </div>
        </div>
        
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در محصولات..."
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {currentProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Package className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">محصولی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized={product.images[0].startsWith('http')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-stone-300" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.inStock ? (
                    <span className="px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-full">
                      موجود
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded-full">
                      ناموجود
                    </span>
                  )}
                </div>
                
                {product.channelPostId && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-blue-500/90 text-white text-[10px] font-bold rounded-full">
                      از تلگرام
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-bold text-stone-900 line-clamp-1">
                  {product.title}
                </h3>
                
                <p className="text-xs text-stone-400 line-clamp-2">
                  {product.description || 'بدون توضیحات'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-[#0F1F18]">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-[10px] text-stone-400 mr-1">تومان</span>
                  </div>
                  <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1.5 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => handleView(product.id)}
                    className="flex-1 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    مشاهده
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={isDeleting}
                    className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <span className="text-xs text-stone-500 font-bold">
            {toPersianNumbers(currentPage)} / {toPersianNumbers(totalPages)}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-stone-900">ویرایش محصول</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">عنوان</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">توضیحات</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40 focus:ring-2 focus:ring-amber-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">قیمت (تومان)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">هزینه ارسال</label>
                  <input
                    type="number"
                    value={editForm.shippingCost}
                    onChange={(e) => setEditForm({ ...editForm, shippingCost: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">دسته‌بندی</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">کد محصول</label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">موجودی</label>
                  <input
                    type="number"
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">روز آماده‌سازی</label>
                  <input
                    type="number"
                    value={editForm.minPrepDays}
                    onChange={(e) => setEditForm({ ...editForm, minPrepDays: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#e6b741]/40"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.hasUnlimitedStock}
                      onChange={(e) => setEditForm({ ...editForm, hasUnlimitedStock: e.target.checked })}
                      className="w-4 h-4 accent-[#e6b741]"
                    />
                    <span className="text-xs font-bold text-stone-600">نامحدود</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.inStock}
                    onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-stone-600">محصول موجود است</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-stone-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-[#e6b741] hover:bg-[#d4a635] text-[#0F1F18] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    ذخیره تغییرات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}