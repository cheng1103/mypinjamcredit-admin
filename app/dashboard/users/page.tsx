'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Edit2, Trash2, User, Mail, Calendar, Eye, EyeOff } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { api, getUserData } from '@/lib/api-client'

interface User {
  id: string
  username: string
  email?: string
  role: string
  createdAt: string
}

interface NewUserForm {
  username: string
  email: string
  password: string
  role: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<NewUserForm>({
    username: '',
    email: '',
    password: '',
    role: 'ADMIN'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUserData, setCurrentUserData] = useState<any>(null)

  useEffect(() => {
    const userData = getUserData()
    if (!userData) {
      router.push('/login')
      return
    }
    setCurrentUserData(userData)
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.get(API_ENDPOINTS.USERS.LIST)
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    setError('')
    setSuccess('')

    if (!formData.username || !formData.password) {
      setError('Username and password are required')
      return
    }

    try {
      const newUser = await api.post(API_ENDPOINTS.USERS.CREATE, formData)
      setUsers([...users, newUser])
      setSuccess('User created successfully')
      setFormData({ username: '', email: '', password: '', role: 'ADMIN' })
      setTimeout(() => {
        setShowAddModal(false)
        setSuccess('')
      }, 1500)
    } catch (error: any) {
      setError(error.data?.message || 'Failed to create user')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setError('')
    setSuccess('')

    try {
      const updateData: any = {
        role: formData.role
      }

      if (formData.email) {
        updateData.email = formData.email
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const updatedUser = await api.patch(API_ENDPOINTS.USERS.UPDATE(selectedUser.id), updateData)
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u))
      setSuccess('User updated successfully')
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedUser(null)
        setSuccess('')
        setFormData({ username: '', email: '', password: '', role: 'ADMIN' })
      }, 1500)
    } catch (error: any) {
      setError(error.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await api.delete(API_ENDPOINTS.USERS.DELETE(selectedUser.id))
      setUsers(users.filter(u => u.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
      setSuccess('User deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.data?.message || 'Failed to delete user')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role
    })
    setError('')
    setSuccess('')
    setShowEditModal(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setError('')
    setShowDeleteModal(true)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPERADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'ADMIN': 'bg-blue-100 text-blue-800 border-blue-200',
      'AGENT': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600">Manage admin users and permissions</p>
            </div>
            {currentUserData?.role === 'SUPERADMIN' && (
              <button
                onClick={() => {
                  setFormData({ username: '', email: '', password: '', role: 'ADMIN' })
                  setError('')
                  setSuccess('')
                  setShowAddModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
            )}
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

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Total: {users.length} users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {user.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({ username: '', email: '', password: '', role: 'ADMIN' })
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setFormData({ username: '', email: '', password: '', role: 'ADMIN' })
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">Delete User</h2>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <p className="text-gray-700">
                Are you sure you want to delete user <span className="font-semibold">{selectedUser.username}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
