'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { RefreshCw, Users, TrendingUp, FileText, Calendar, Settings, User, Phone, Mail, Briefcase, DollarSign, MapPin, MessageSquare, Eye } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { api, getUserData, clearAuth } from '@/lib/api-client'

interface DashboardStats {
  totalLeads: number
  todayLeads: number
  totalUsers: number
  pendingTestimonials: number
  recentLeads: Lead[]
  totalViews: number
  todayViews: number
  uniqueVisitors: number
}

interface Lead {
  id: string
  fullName: string
  email?: string
  phone: string
  occupation?: string
  monthlyIncome?: number
  loanAmount: number
  loanType: string
  location?: string
  message?: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todayLeads: 0,
    totalUsers: 0,
    pendingTestimonials: 0,
    recentLeads: [],
    totalViews: 0,
    todayViews: 0,
    uniqueVisitors: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    // Safe JSON parse with error handling
    let userData = getUserData()

    // If localStorage fails, try sessionStorage backup
    if (!userData && typeof window !== 'undefined') {
      const backupUser = sessionStorage.getItem('admin_backup_user')
      if (backupUser) {
        try {
          userData = JSON.parse(backupUser)
          console.log('Restored user data from sessionStorage backup')
        } catch (e) {
          console.error('Failed to parse backup user data')
        }
      }
    }

    if (!userData) {
      // Add small delay to prevent race condition with localStorage
      const timeoutId = setTimeout(() => {
        let retryUserData = getUserData()

        // Try sessionStorage again on retry
        if (!retryUserData && typeof window !== 'undefined') {
          const backupUser = sessionStorage.getItem('admin_backup_user')
          if (backupUser) {
            try {
              retryUserData = JSON.parse(backupUser)
            } catch (e) {
              console.error('Failed to parse backup user data on retry')
            }
          }
        }

        if (!retryUserData) {
          router.push('/login')
        } else {
          setUser(retryUserData)
          fetchDashboardData()
        }
      }, 150)

      return () => clearTimeout(timeoutId)
    } else {
      setUser(userData)
      fetchDashboardData()
    }
  }, [router])

  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      // Parallel API calls with the new client - now including analytics
      const [leads, users, testimonials, analytics] = await Promise.all([
        api.get(API_ENDPOINTS.LEADS.LIST),
        api.get(API_ENDPOINTS.USERS.LIST),
        api.get(API_ENDPOINTS.TESTIMONIALS.MODERATION),
        api.get(API_ENDPOINTS.ANALYTICS.OVERVIEW),
      ])

      // Calculate today's leads
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayLeads = leads.filter((lead: Lead) => {
        const leadDate = new Date(lead.createdAt)
        leadDate.setHours(0, 0, 0, 0)
        return leadDate.getTime() === today.getTime()
      }).length

      // Get recent leads (last 5)
      const sortedLeads = [...leads].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setStats({
        totalLeads: leads.length,
        todayLeads,
        totalUsers: users.length,
        pendingTestimonials: testimonials.filter((t: any) => t.status === 'PENDING').length,
        recentLeads: sortedLeads.slice(0, 5),
        // Analytics data from API
        totalViews: analytics.totalViews || 0,
        todayViews: analytics.todayViews || 0,
        uniqueVisitors: analytics.uniqueVisitors || 0
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // API client already handles 401 redirects
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600">MyPinjam Credit Admin</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {formatDateTime(lastUpdate)}</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-gray-600 mt-1">All loan applications</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Today's New Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.todayLeads}</div>
              <p className="text-xs text-blue-700 mt-1">Applications today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">Admin users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTestimonials}</div>
              <p className="text-xs text-gray-600 mt-1">Testimonials to review</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest 5 loan applications with detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications yet
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stats.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {lead.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{lead.fullName}</h3>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowDetailModal(true)
                        }}
                        className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>

                    {/* Information Grid */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <Phone className="w-3 h-3" />
                            <span>Phone</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{lead.phone}</p>
                        </div>

                        {lead.email && (
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">{lead.email}</p>
                          </div>
                        )}
                      </div>

                      {lead.occupation && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <Briefcase className="w-3 h-3" />
                            <span>Occupation</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{lead.occupation}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Loan Amount</span>
                          </div>
                          <p className="text-sm font-bold text-blue-600">RM {lead.loanAmount.toLocaleString()}</p>
                        </div>

                        {lead.monthlyIncome && (
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>Monthly Income</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">RM {lead.monthlyIncome.toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <FileText className="w-3 h-3" />
                          <span>Loan Type</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{lead.loanType.replace(/_/g, ' ')}</p>
                      </div>

                      {lead.location && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>Location</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{lead.location}</p>
                        </div>
                      )}

                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(new Date(lead.createdAt))}</p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        setSelectedLead(lead)
                        setShowDetailModal(true)
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/leads')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Applications</h3>
            <p className="text-sm text-gray-600">View and manage all loan applications</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/users')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-sm text-gray-600">Manage admin users and permissions</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/testimonials')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Review Testimonials</h3>
            <p className="text-sm text-gray-600">Approve or reject customer testimonials</p>
          </button>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Application Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Complete customer information</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-5 rounded-xl border border-blue-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Full Name</p>
                    <p className="font-semibold text-gray-900">{selectedLead.fullName}</p>
                  </div>
                  {selectedLead.occupation && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Occupation</p>
                      <p className="font-semibold text-gray-900">{selectedLead.occupation}</p>
                    </div>
                  )}
                  {selectedLead.monthlyIncome && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Monthly Income</p>
                      <p className="font-semibold text-gray-900">
                        RM {selectedLead.monthlyIncome.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedLead.location && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Location</p>
                      <p className="font-semibold text-gray-900">{selectedLead.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-5 rounded-xl border border-green-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Phone Number</p>
                    <p className="font-semibold text-gray-900">{selectedLead.phone}</p>
                  </div>
                  {selectedLead.email && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Email Address</p>
                      <p className="font-semibold text-gray-900">{selectedLead.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-5 rounded-xl border border-purple-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Loan Amount Requested</p>
                    <p className="font-bold text-gray-900 text-xl">
                      RM {selectedLead.loanAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Loan Purpose</p>
                    <p className="font-semibold text-gray-900">
                      {selectedLead.loanType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    Additional Message
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-5 rounded-xl border border-amber-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Status & Timeline */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                  Status & Timeline
                </h3>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-3 sm:p-5 rounded-xl border border-rose-200 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Submitted</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(new Date(selectedLead.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/dashboard/leads')}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
              >
                Go to All Applications
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
