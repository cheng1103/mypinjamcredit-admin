'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { RefreshCw, Users, TrendingUp, FileText, Calendar } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { api, getUserData, clearAuth } from '@/lib/api-client'

interface DashboardStats {
  totalLeads: number
  todayLeads: number
  totalUsers: number
  pendingTestimonials: number
  recentLeads: Lead[]
}

interface Lead {
  id: string
  fullName: string
  email?: string
  phone: string
  loanAmount: number
  loanType: string
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
    recentLeads: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Safe JSON parse with error handling
    const userData = getUserData()

    if (!userData) {
      router.push('/login')
      return
    }

    setUser(userData)
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    setRefreshing(true)
    try {
      // Parallel API calls with the new client
      const [leads, users, testimonials] = await Promise.all([
        api.get(API_ENDPOINTS.LEADS.LIST),
        api.get(API_ENDPOINTS.USERS.LIST),
        api.get(API_ENDPOINTS.TESTIMONIALS.MODERATION),
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
        recentLeads: sortedLeads.slice(0, 5)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">MyPinjam Credit Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
            <CardDescription>Latest 5 loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications yet
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{lead.fullName}</p>
                          <p className="text-sm text-gray-600">{lead.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          RM {lead.loanAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">{lead.loanType.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
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
    </div>
  )
}
