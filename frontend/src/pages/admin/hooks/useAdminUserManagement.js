import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import adminService from '../../../services/adminService'
import useAuthStore from '../../../stores/authStore'
import { getAdminErrorMessage } from '../helpers/adminHelpers'
import { createUserForm, emptyUserForm, filterUsers } from '../helpers/userManagementHelpers'

export default function useAdminUserManagement() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const startImpersonation = useAuthStore((state) => state.startImpersonation)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalMode, setModalMode] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [impersonationReason, setImpersonationReason] = useState('')
  const [form, setForm] = useState(emptyUserForm)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState(null)
  const { data: users = [], isPending, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: adminService.getUsers,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: refreshAdminData,
  })
  const updateMutation = useMutation({
    mutationFn: ({ userId, user }) => adminService.updateUser(userId, user),
    onSuccess: async () => {
      await refreshAdminData()
      setToast({ type: 'success', message: 'Cập nhật tài khoản thành công.' })
    },
  })
  const approveMutation = useMutation({
    mutationFn: adminService.approveUser,
    onSuccess: async () => {
      await refreshAdminData()
      setToast({ type: 'success', message: 'Duyệt tài khoản thành công.' })
    },
    onError: (mutationError) => {
      window.alert(getAdminErrorMessage(mutationError, 'Không thể duyệt tài khoản. Vui lòng thử lại.'))
    },
  })
  const blockMutation = useMutation({
    mutationFn: ({ userId, blocked }) => (
      blocked ? adminService.blockUser(userId) : adminService.unblockUser(userId)
    ),
    onSuccess: async (_data, variables) => {
      await refreshAdminData()
      setToast({
        type: 'success',
        message: variables.blocked
          ? 'Khóa tài khoản thành công.'
          : 'Mở khóa tài khoản thành công.',
      })
    },
    onError: (mutationError) => {
      window.alert(getAdminErrorMessage(mutationError, 'Không thể cập nhật trạng thái khóa tài khoản. Vui lòng thử lại.'))
    },
  })
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: async () => {
      await refreshAdminData()
      setToast({ type: 'success', message: 'Xóa tài khoản thành công.' })
    },
  })
  const impersonationMutation = useMutation({
    mutationFn: adminService.startImpersonation,
    onSuccess: (targetUser) => {
      startImpersonation(targetUser)
      navigate(targetUser.role === 'TEACHER' ? '/teacher' : '/student', { replace: true })
    },
    onError: (mutationError) => {
      window.alert(getAdminErrorMessage(
        mutationError,
        'Không thể đăng nhập với tư cách tài khoản này. Vui lòng thử lại.',
      ))
      setPendingAction(null)
      setImpersonationReason('')
    },
  })

  const filteredUsers = useMemo(
    () => filterUsers(users, keyword, roleFilter, statusFilter),
    [users, keyword, roleFilter, statusFilter],
  )
  const studentCount = users.filter((user) => user.role === 'STUDENT').length
  const teacherCount = users.filter((user) => user.role === 'TEACHER').length
  const saving = createMutation.isPending || updateMutation.isPending

  function openCreateModal() {
    setSelectedUser(null)
    setForm({ ...emptyUserForm })
    setFormError('')
    setModalMode('create')
  }

  function openUserModal(user, mode) {
    setSelectedUser(user)
    setForm(createUserForm(user))
    setFormError('')
    setModalMode(mode)
  }

  function closeModal() {
    setModalMode(null)
    setSelectedUser(null)
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password || null,
    }
    const request = modalMode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation.mutateAsync({ userId: selectedUser.id, user: payload })

    request.then(closeModal).catch((mutationError) => {
      setFormError(getAdminErrorMessage(mutationError, 'Không thể lưu tài khoản. Vui lòng thử lại.'))
    })
  }

  function handleApprove(user) {
    if (user.status !== 'PENDING') return

    approveMutation.mutate(user.id)
  }

  function handleToggleBlocked(user) {
    if (user.status !== 'ACTIVE' && user.status !== 'BANNED') return

    blockMutation.mutate({
      userId: user.id,
      blocked: user.status === 'ACTIVE',
    })
  }

  function handleDelete(user) {
    setPendingAction({ type: 'delete', user })
  }

  function handleImpersonate(user) {
    if (user.status !== 'ACTIVE' || !['STUDENT', 'TEACHER'].includes(user.role)) return
    setImpersonationReason('')
    setPendingAction({ type: 'impersonate', user })
  }

  function closePendingAction() {
    if (deleteMutation.isPending || impersonationMutation.isPending) return
    setPendingAction(null)
    setImpersonationReason('')
  }

  function confirmPendingAction() {
    if (!pendingAction) return

    const { type, user } = pendingAction
    if (type === 'delete') {
      deleteMutation.mutate(user.id, {
        onSuccess: () => setPendingAction(null),
        onError: (mutationError) => {
          window.alert(getAdminErrorMessage(mutationError, 'Không thể xóa tài khoản. Vui lòng thử lại.'))
        },
      })
      return
    }

    impersonationMutation.mutate({
      userId: user.id,
      reason: impersonationReason.trim(),
    })
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  return {
    approveMutation,
    blockMutation,
    closeModal,
    closePendingAction,
    confirmPendingAction,
    createMutation,
    deleteMutation,
    error,
    filteredUsers,
    form,
    formError,
    handleApprove,
    handleDelete,
    handleFormChange,
    handleImpersonate,
    handleSubmit,
    handleToggleBlocked,
    impersonationMutation,
    impersonationReason,
    isPending,
    keyword,
    modalMode,
    openCreateModal,
    openUserModal,
    pendingAction,
    roleFilter,
    saving,
    selectedUser,
    setImpersonationReason,
    setKeyword,
    setRoleFilter,
    setStatusFilter,
    statusFilter,
    studentCount,
    teacherCount,
    toast,
    users,
    setToast,
  }
}
