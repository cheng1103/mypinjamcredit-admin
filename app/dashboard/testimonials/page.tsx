'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle, Star, User, MessageSquare, Calendar, Eye } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  rating: number
  message: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  moderatedAt?: string
  moderatedBy?: string
}

export default function TestimonialsPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTestimonials(token)
  }, [router])

  const fetchTestimonials = async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/testimonials/moderation', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setTestimonials(data)
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`http://localhost:4000/api/testimonials/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const updated = await res.json()
        setTestimonials(testimonials.map(t => t.id === id ? updated : t))
        if (selectedTestimonial?.id === id) {
          setSelectedTestimonial(updated)
        }
        setSuccess('Testimonial approved successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Failed to approve testimonial:', error)
    }
  }

  const handleReject = async (id: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`http://localhost:4000/api/testimonials/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const updated = await res.json()
        setTestimonials(testimonials.map(t => t.id === id ? updated : t))
        if (selectedTestimonial?.id === id) {
          setSelectedTestimonial(updated)
        }
        setSuccess('Testimonial rejected successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Failed to reject testimonial:', error)
    }
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`http://localhost:4000/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setTestimonials(testimonials.filter(t => t.id !== id))
        if (selectedTestimonial?.id === id) {
          setShowDetailModal(false)
          setSelectedTestimonial(null)
        }
        setSuccess('Testimonial deleted successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('Failed to delete testimonial:', error)
    }
  }

  const viewDetails = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setShowDetailModal(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Filter testimonials
  const filteredTestimonials = filter === 'ALL'
    ? testimonials
    : testimonials.filter(t => t.status === filter)

  // Sort by date (pending first, then by creation date)
  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => t.status === 'PENDING').length,
    approved: testimonials.filter(t => t.status === 'APPROVED').length,
    rejected: testimonials.filter(t => t.status === 'REJECTED').length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading testimonials...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Testimonial Management</h1>
              <p className="text-sm text-gray-600">Review and moderate customer testimonials</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('ALL')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50" onClick={() => setFilter('PENDING')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('APPROVED')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('REJECTED')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'PENDING'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'REJECTED'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Testimonials List */}
        <Card>
          <CardHeader>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>
              Showing {sortedTestimonials.length} {filter === 'ALL' ? 'total' : filter.toLowerCase()} testimonial{sortedTestimonials.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedTestimonials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No testimonials found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTestimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                          {renderStars(testimonial.rating)}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(testimonial.status)}`}>
                        {testimonial.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{testimonial.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(testimonial.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(testimonial)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>

                        {testimonial.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(testimonial.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(testimonial.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}

                        {testimonial.status !== 'PENDING' && (
                          <button
                            onClick={() => handleDelete(testimonial.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Testimonial Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedTestimonial.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedTestimonial.name}</p>
                      {renderStars(selectedTestimonial.rating)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial Message */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Testimonial Message
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTestimonial.message}</p>
                </div>
              </div>

              {/* Status & Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Status & Timeline
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedTestimonial.status)}`}>
                      {selectedTestimonial.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Submitted</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(new Date(selectedTestimonial.createdAt))}
                    </span>
                  </div>
                  {selectedTestimonial.moderatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Moderated</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateTime(new Date(selectedTestimonial.moderatedAt))}
                      </span>
                    </div>
                  )}
                  {selectedTestimonial.moderatedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Moderated By</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTestimonial.moderatedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              {selectedTestimonial.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedTestimonial.id)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedTestimonial.id)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
