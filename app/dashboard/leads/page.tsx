'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Calendar, User, Mail, Phone, Briefcase, DollarSign, MapPin, MessageSquare, Clock } from 'lucide-react'

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
}

interface User {
  id: string
  username: string
  role: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    setLoading(true)
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch('http://localhost:4000/api/leads', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:4000/api/users', {
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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const res = await fetch(`http://localhost:4000/api/leads/${leadId}/status`, {
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
      const res = await fetch(`http://localhost:4000/api/leads/${leadId}/assign`, {
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

  // Sort leads
  const sortedLeads = [...leads].sort((a, b) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading leads...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
              <p className="text-sm text-gray-600">Manage all loan applications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{leads.length}</span> applications
          </div>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications List</CardTitle>
            <CardDescription>View and manage loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            {currentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Loan Details</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{lead.fullName}</p>
                            {lead.occupation && (
                              <p className="text-xs text-gray-600">{lead.occupation}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{lead.phone}</p>
                            {lead.email && (
                              <p className="text-xs text-gray-600">{lead.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              RM {lead.loanAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {lead.loanType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(lead.status)}`}
                          >
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.assignedTo || ''}
                            onChange={(e) => handleAssignmentChange(lead.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.username}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => viewDetails(lead)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, leads.length)} of {leads.length} applications
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{selectedLead.fullName}</p>
                  </div>
                  {selectedLead.occupation && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Occupation</p>
                      <p className="font-medium text-gray-900">{selectedLead.occupation}</p>
                    </div>
                  )}
                  {selectedLead.monthlyIncome && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Monthly Income</p>
                      <p className="font-medium text-gray-900">
                        RM {selectedLead.monthlyIncome.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedLead.location && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Location</p>
                      <p className="font-medium text-gray-900">{selectedLead.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLead.phone}</p>
                  </div>
                  {selectedLead.email && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{selectedLead.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      RM {selectedLead.loanAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Loan Type</p>
                    <p className="font-medium text-gray-900">
                      {selectedLead.loanType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Message
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Status & Assignment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Management
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Status</p>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className={`w-full px-3 py-2 text-sm font-semibold rounded-lg ${getStatusColor(selectedLead.status)}`}
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Assigned To</p>
                    <select
                      value={selectedLead.assignedTo || ''}
                      onChange={(e) => handleAssignmentChange(selectedLead.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <Clock className="w-5 h-5" />
                  Timeline
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Application Submitted</p>
                  <p className="font-medium text-gray-900">{formatDateTime(new Date(selectedLead.createdAt))}</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
