// src/components/admin/FAQManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  order: number
  isActive: boolean
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // فرم جدید
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  
  // فرم ویرایش
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faq')
      const data = await response.json()
      setFaqs(data)
    } catch (error) {
      toast.error('خطا در دریافت سوالات')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newQuestion || !newAnswer) {
      toast.error('لطفاً سوال و جواب را وارد کنید')
      return
    }

    try {
      const response = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      })
      
      if (response.ok) {
        toast.success('سوال جدید اضافه شد')
        setNewQuestion('')
        setNewAnswer('')
        setShowForm(false)
        fetchFAQs()
      }
    } catch (error) {
      toast.error('خطا در اضافه کردن سوال')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editQuestion || !editAnswer) {
      toast.error('لطفاً سوال و جواب را وارد کنید')
      return
    }

    try {
      const response = await fetch('/api/admin/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          question: editQuestion,
          answer: editAnswer,
        }),
      })
      
      if (response.ok) {
        toast.success('سوال ویرایش شد')
        setEditingId(null)
        fetchFAQs()
      }
    } catch (error) {
      toast.error('خطا در ویرایش سوال')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این سوال مطمئن هستید؟')) return

    try {
      const response = await fetch('/api/admin/faq', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      
      if (response.ok) {
        toast.success('سوال حذف شد')
        fetchFAQs()
      }
    } catch (error) {
      toast.error('خطا در حذف سوال')
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = faqs.findIndex(f => f.id === id)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= faqs.length) return
    
    const newFaqs = [...faqs]
    ;[newFaqs[index], newFaqs[newIndex]] = [newFaqs[newIndex], newFaqs[index]]
    
    // به‌روزرسانی order
    const updatedFaqs = newFaqs.map((faq, i) => ({ ...faq, order: i }))
    setFaqs(updatedFaqs)
    
    // ذخیره در دیتابیس
    try {
      await fetch('/api/admin/faq/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqs: updatedFaqs.map(f => ({ id: f.id, order: f.order })) }),
      })
    } catch (error) {
      toast.error('خطا در تغییر ترتیب')
    }
  }

  if (loading) {
    return <div className="text-center py-8">در حال بارگذاری...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          مدیریت سوالات متداول
          <span className="text-sm text-gray-500 mr-2">({faqs.length} سوال)</span>
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن سوال
        </button>
      </div>

      {/* فرم افزودن */}
      {showForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">سوال جدید</h3>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="سوال..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="پاسخ..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              ذخیره
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              <X className="h-4 w-4" />
              لغو
            </button>
          </div>
        </div>
      )}

      {/* لیست سوالات */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
            {editingId === faq.id ? (
              // حالت ویرایش
              <div>
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(faq.id)}
                    className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 text-sm"
                  >
                    <Save className="h-3 w-3" />
                    ذخیره
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    <X className="h-3 w-3" />
                    لغو
                  </button>
                </div>
              </div>
            ) : (
              // حالت نمایش
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {index + 1}. {faq.question}
                    </p>
                    <p className="text-gray-600 text-sm whitespace-pre-line">{faq.answer}</p>
                  </div>
                  <div className="flex flex-col gap-1 mr-3">
                    <button
                      onClick={() => {
                        setEditingId(faq.id)
                        setEditQuestion(faq.question)
                        setEditAnswer(faq.answer)
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMove(faq.id, 'up')}
                      className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                      title="انتقال به بالا"
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMove(faq.id, 'down')}
                      className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                      title="انتقال به پایین"
                      disabled={index === faqs.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}