'use client'
// Version: 2024-11-14-1800 - Added sidebar navigation

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Eye, User, Mail, Phone, Briefcase,
  DollarSign, MapPin, MessageSquare, Clock, Edit2, Trash2, Search, Download,
  Filter, TrendingUp, Users, FileText, CheckCircle, Calendar, FileDown, BarChart3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { exportLeadToPDF, exportLeadsToPDF } from '@/lib/pdfExport'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  username: string
  role: string
}

interface LeadStats {
  total: number
  submitted: number
  underReview: number
  approved: number
  rejected: number
  completed: number
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const itemsPerPage = 10

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData(token)
  }, [router])

  useEffect(() => {
    // Apply search and filter
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.fullName.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        (lead.email && lead.email.toLowerCase().includes(query))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.createdAt)
        leadDate.setHours(0, 0, 0, 0)
        return leadDate >= start
      })
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.createdAt)
        return leadDate <= end
      })
    }

    setFilteredLeads(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, statusFilter, startDate, endDate, leads])

  const fetchData = async (token: string) => {
    setLoading(true)
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/leads`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (leadsRes.ok && usersRes.ok) {
        const leadsData = await leadsRes.json()
        const usersData = await usersRes.json()
        setLeads(leadsData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (): LeadStats => {
    return {
      total: leads.length,
      submitted: leads.filter(l => l.status === 'SUBMITTED').length,
      underReview: leads.filter(l => l.status === 'UNDER_REVIEW').length,
      approved: leads.filter(l => l.status === 'APPROVED').length,
      rejected: leads.filter(l => l.status === 'REJECTED').length,
      completed: leads.filter(l => l.status === 'COMPLETED').length,
    }
  }

  const generateDailyStats = () => {
    // Get last 14 days
    const days = 14
    const data = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt)
        return leadDate >= date && leadDate < nextDate
      })

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: dayLeads.length,
        visits: Math.floor(dayLeads.length * (Math.random() * 3 + 2)) // Mock visits data (2-5x leads)
      })
    }

    return data
  }

  const handlePDFExport = () => {
    exportLeadsToPDF(filteredLeads)
  }

  const exportToCSV = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Occupation', 'Monthly Income', 'Loan Amount', 'Loan Type', 'Location', 'Status', 'Assigned To', 'Created At']
    const csvData = filteredLeads.map(lead => [
      lead.fullName,
      lead.phone,
      lead.email || '',
      lead.occupation || '',
      lead.monthlyIncome || '',
      lead.loanAmount,
      lead.loanType.replace(/_/g, ' '),
      lead.location || '',
      lead.status,
      lead.assignedTo ? users.find(u => u.id === lead.assignedTo)?.username || 'Unknown' : 'Unassigned',
      new Date(lead.createdAt).toLocaleString()
    ])

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        setLeads(leads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ))
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAssignmentChange = async (leadId: string, userId: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId || null })
      })

      if (res.ok) {
        setLeads(leads.map(lead =>
          lead.id === leadId ? { ...lead, assignedTo: userId || undefined } : lead
        ))
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, assignedTo: userId || undefined })
        }
      }
    } catch (error) {
      console.error('Failed to assign lead:', error)
    }
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead({ ...lead })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingLead) return
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/leads/${editingLead.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingLead)
      })

      if (res.ok) {
        setLeads(leads.map(lead =>
          lead.id === editingLead.id ? editingLead : lead
        ))
        setShowEditModal(false)
        setEditingLead(null)
        alert('Lead updated successfully!')
      } else {
        alert('Failed to update lead')
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
      alert('Failed to update lead')
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        setLeads(leads.filter(lead => lead.id !== leadId))
        if (showDetailModal && selectedLead?.id === leadId) {
          setShowDetailModal(false)
        }
        alert('Application deleted successfully')
      } else {
        alert('Failed to delete application')
      }
    } catch (error) {
      console.error('Failed to delete lead:', error)
      alert('Failed to delete application')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SUBMITTED': 'bg-blue-100 text-blue-800 border-blue-200',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLeads = sortedLeads.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const viewDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-600 font-medium">Loading leads...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
              <p className="text-sm text-gray-600">Manage and track all loan applications</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handlePDFExport}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Submitted</p>
                  <p className="text-3xl font-bold mt-1">{stats.submitted}</p>
                </div>
                <FileText className="w-10 h-10 text-amber-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Under Review</p>
                  <p className="text-3xl font-bold mt-1">{stats.underReview}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold mt-1">{stats.approved}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
                </div>
                <Trash2 className="w-10 h-10 text-red-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold mt-1">{stats.completed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-gray-200 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Statistics Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Last 14 Days Performance
                </CardTitle>
                <CardDescription>Daily leads and visits tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateDailyStats()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Visits"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Leads"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* First Row: Search, Status, Sort */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sort:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Second Row: Date Range Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Showing {filteredLeads.length} of {leads.length} applications</span>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads Table/Cards */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Applications List</CardTitle>
            <CardDescription>View and manage all loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {currentLeads.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No applications found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Customer</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Contact</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Income</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Loan Details</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Location</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Assigned</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{lead.fullName}</p>
                              {lead.occupation && (
                                <p className="text-xs text-gray-600 mt-0.5">{lead.occupation}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm space-y-1">
                              <p className="text-gray-900 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </p>
                              {lead.email && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {lead.monthlyIncome ? (
                              <p className="text-sm font-medium text-gray-900">
                                RM {lead.monthlyIncome.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">Not provided</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                RM {lead.loanAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {lead.loanType.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {lead.location ? (
                              <p className="text-sm text-gray-900">{lead.location}</p>
                            ) : (
                              <p className="text-sm text-gray-400">Not provided</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${getStatusColor(lead.status)}`}
                            >
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="REJECTED">REJECTED</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={lead.assignedTo || ''}
                              onChange={(e) => handleAssignmentChange(lead.id, e.target.value)}
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.username}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-gray-900">{new Date(lead.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewDetails(lead)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(lead)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(lead.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {currentLeads.map((lead) => (
                    <Card key={lead.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{lead.fullName}</h3>
                            {lead.occupation && (
                              <p className="text-sm text-gray-600">{lead.occupation}</p>
                            )}
                          </div>
                          {getStatusBadge(lead.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Phone</p>
                            <p className="font-medium text-gray-900">{lead.phone}</p>
                          </div>
                          {lead.email && (
                            <div>
                              <p className="text-gray-500 text-xs">Email</p>
                              <p className="font-medium text-gray-900 text-xs">{lead.email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 text-xs">Loan Amount</p>
                            <p className="font-semibold text-gray-900">RM {lead.loanAmount.toLocaleString()}</p>
                          </div>
                          {lead.monthlyIncome && (
                            <div>
                              <p className="text-gray-500 text-xs">Income</p>
                              <p className="font-medium text-gray-900">RM {lead.monthlyIncome.toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => viewDetails(lead)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(lead)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} applications
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500 mt-1">Complete customer information</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                    Additional Message
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Application Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Application Status</p>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className={`w-full px-3 py-2.5 text-sm font-semibold rounded-lg border-2 cursor-pointer ${getStatusColor(selectedLead.status)}`}
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Assigned To</p>
                    <select
                      value={selectedLead.assignedTo || ''}
                      onChange={(e) => handleAssignmentChange(selectedLead.id, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  Timeline
                </h3>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-xl border border-rose-200 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Application Submitted</p>
                    <p className="font-semibold text-gray-900">{formatDateTime(new Date(selectedLead.createdAt))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">Last Updated</p>
                    <p className="font-semibold text-gray-900">{formatDateTime(new Date(selectedLead.updatedAt))}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => exportLeadToPDF(selectedLead)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  handleEdit(selectedLead)
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Edit Application
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Application</h2>
                  <p className="text-sm text-gray-500 mt-1">Update customer information</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={editingLead.fullName}
                    onChange={(e) => setEditingLead({ ...editingLead, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="text"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation</label>
                  <input
                    type="text"
                    value={editingLead.occupation || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, occupation: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Income (RM)</label>
                  <input
                    type="number"
                    value={editingLead.monthlyIncome || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Amount (RM) *</label>
                  <input
                    type="number"
                    value={editingLead.loanAmount}
                    onChange={(e) => setEditingLead({ ...editingLead, loanAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Type *</label>
                  <select
                    value={editingLead.loanType}
                    onChange={(e) => setEditingLead({ ...editingLead, loanType: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PERSONAL_USE">Personal Use</option>
                    <option value="BUSINESS_EXPANSION">Business Expansion</option>
                    <option value="EQUIPMENT_FINANCING">Equipment Financing</option>
                    <option value="WORKING_CAPITAL">Working Capital</option>
                    <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editingLead.location || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, location: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Message</label>
                <textarea
                  value={editingLead.message || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional information..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
