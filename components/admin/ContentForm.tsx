// src/components/admin/ContentForm.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Upload, FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface ContentFormProps {
  onSuccess?: () => void
}

export default function ContentForm({ onSuccess }: ContentFormProps) {
  const [type, setType] = useState<'text' | 'image'>('text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData: any = {
        type,
        title,
        description,
        isActive: true,
      }

      if (type === 'text') {
        formData.text = text
        const response = await fetch('/api/admin/contents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success('محتوا با موفقیت اضافه شد ✅')
          setTitle('')
          setDescription('')
          setText('')
          onSuccess?.()
        } else {
          toast.error('خطا در افزودن محتوا')
        }
      } else if (type === 'image' && imageFile) {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = reader.result as string
          formData.imageData = base64.split(',')[1]
          formData.imageName = imageFile.name
          formData.imageType = imageFile.type

          const response = await fetch('/api/admin/contents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })

          if (response.ok) {
            toast.success('تصویر با موفقیت اضافه شد ✅')
            setTitle('')
            setDescription('')
            setImageFile(null)
            onSuccess?.()
          } else {
            toast.error('خطا در افزودن تصویر')
          }
        }
        reader.readAsDataURL(imageFile)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('خطا در ارسال فرم')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <Plus className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-gray-900">افزودن محتوای جدید</CardTitle>
            <p className="text-sm text-gray-500 mt-1">متن یا تصویر جدید اضافه کنید</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Content Type */}
          <div>
            <Label className="text-gray-700 mb-2 block">نوع محتوا</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  type === 'text'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">متن</span>
              </button>
              <button
                type="button"
                onClick={() => setType('image')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  type === 'image'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">تصویر</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-gray-700 mb-2 block">
              عنوان <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="مثلاً: جنس گل‌ها"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-gray-700 mb-2 block">
              توضیحات <span className="text-gray-400 text-xs">(اختیاری)</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه درباره محتوا"
              className="w-full"
            />
          </div>

          {/* Text or Image */}
          {type === 'text' ? (
            <div>
              <Label htmlFor="text" className="text-gray-700 mb-2 block">
                متن محتوا <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                placeholder="متن کامل را وارد کنید..."
                rows={6}
                className="w-full resize-y"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="image" className="text-gray-700 mb-2 block">
                فایل تصویر <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required
                  className="hidden"
                />
                <label htmlFor="image" className="cursor-pointer block">
                  {imageFile ? (
                    <div className="space-y-2">
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-green-700 font-medium text-sm">{imageFile.name}</p>
                        <p className="text-green-500 text-xs mt-1">
                          {(imageFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <p className="text-gray-400 text-xs">برای تغییر، دوباره کلیک کنید</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 text-gray-300 mx-auto" />
                      <p className="text-gray-500 text-sm">کلیک کنید یا تصویر را بکشید</p>
                      <p className="text-gray-400 text-xs">PNG, JPG تا 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال افزودن...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                افزودن محتوا
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}