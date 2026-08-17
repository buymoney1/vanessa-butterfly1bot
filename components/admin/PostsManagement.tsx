// src/components/admin/PostsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  Package, Search, Trash2, RefreshCw, ExternalLink, 
  Hash, Image as ImageIcon, FileText
} from 'lucide-react'

interface ChannelPost {
  id: string
  messageId: number
  text?: string
  caption?: string
  hashtags: string[]
  link: string
  photoFileId?: string
  photoUrl?: string
  createdAt: string
}

export default function PostsManagement() {
  const [posts, setPosts] = useState<ChannelPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHashtag, setSelectedHashtag] = useState('')
  const [allHashtags, setAllHashtags] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
    fetchHashtags()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('خطا در بارگذاری پست‌ها')
    } finally {
      setLoading(false)
    }
  }

  const fetchHashtags = async () => {
    try {
      const response = await fetch('/api/admin/posts?action=hashtags')
      if (response.ok) {
        const data = await response.json()
        setAllHashtags(data)
      }
    } catch (error) {
      console.error('Error fetching hashtags:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پست مطمئن هستید؟')) return

    try {
      setDeletingId(id)
      const response = await fetch(`/api/admin/posts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('پست حذف شد ✅')
        fetchPosts()
      } else {
        toast.error('خطا در حذف پست')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('خطا در حذف پست')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return date
    }
  }

  const filteredPosts = posts.filter(post => {
    const text = (post.text || post.caption || '').toLowerCase()
    const matchesSearch = text.includes(searchTerm.toLowerCase()) ||
      post.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesHashtag = selectedHashtag === '' || post.hashtags.includes(selectedHashtag)
    
    return matchesSearch && matchesHashtag
  })

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">در حال بارگذاری پست‌ها...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-xl p-2 shadow-sm">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-gray-900">پست‌های کانال</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {posts.length} پست ثبت شده
              </p>
            </div>
          </div>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors border border-gray-200 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            بروزرسانی
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در پست‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          
          <select
            value={selectedHashtag}
            onChange={(e) => setSelectedHashtag(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">همه هشتگ‌ها</option>
            {allHashtags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>
        </div>

        {/* Posts list */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400">پستی یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Post content */}
                    <div className="flex items-start gap-2 mb-2">
                      {post.photoFileId ? (
                        <ImageIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {post.text || post.caption || 'بدون متن'}
                      </p>
                    </div>

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.hashtags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                          >
                            <Hash className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <p className="text-xs text-gray-400">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={post.link}
                      target="_blank"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="مشاهده در کانال"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </a>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف پست"
                    >
                      {deletingId === post.id ? (
                        <RefreshCw className="h-4 w-4 text-red-400 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}