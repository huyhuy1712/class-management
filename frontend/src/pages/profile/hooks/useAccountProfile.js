import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import useAuthStore from '../../../stores/authStore'
import userService from '../../../services/userService'
import defaultAvatar from '../../../assets/images/avatar_default.png'
import useProfileActivity from './useProfileActivity'
import useProfileSync from './useProfileSync'
import useTeacherExamCount from '../../teacher/hooks/useTeacherExamCount'
import { optimizeAvatar } from '../../teacher/helpers/avatarImageUtils'

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function useAccountProfile(student) {
  const profile = useProfileSync()
  const dirty = useRef(false)
  const avatarInputRef = useRef(null)
  const fullNameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const phoneInputRef = useRef(null)
  const avatarPreviewUrlRef = useRef(null)
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const navigate = useNavigate()
  const activity = useProfileActivity(student)
  const teacherExamCount = useTeacherExamCount(!student)
  const examCount = student
    ? (activity.examCountError ? 0 : activity.completedExamCount ?? 0)
    : teacherExamCount

  const avatarMutation = useMutation({
    mutationFn: async (file) => userService.uploadAvatar(await optimizeAvatar(file)),
  })
  const deleteAvatarMutation = useMutation({ mutationFn: userService.deleteAvatar })
  const profileMutation = useMutation({ mutationFn: userService.updateProfile })
  const passwordMutation = useMutation({
    mutationFn: ([currentPassword, newPassword]) => userService.changePassword(currentPassword, newPassword),
  })
  const googleLinkedQuery = useQuery({
    queryKey: ['auth', 'googleLinked', user?.id],
    queryFn: userService.isGoogleLinked,
    enabled: Boolean(user?.id),
  })

  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar && user.avatar !== 'avatar' ? user.avatar : defaultAvatar,
  )
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const uploadingAvatar = avatarMutation.isPending
  const deletingAvatar = deleteAvatarMutation.isPending
  const saving = profileMutation.isPending
  const changingPassword = passwordMutation.isPending
  const homePath = student ? '/student' : '/teacher'
  const roleLabel = student ? 'Học sinh' : 'Giáo viên'

  useEffect(() => {
    setAvatarPreview(user?.avatar && user.avatar !== 'avatar' ? user.avatar : defaultAvatar)
  }, [user?.avatar])

  useEffect(() => {
    if (dirty.current) return
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    })
  }, [user?.fullName, user?.email, user?.phone])

  function handleChange(event) {
    dirty.current = true
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file || uploadingAvatar || deletingAvatar) return

    setAvatarError('')
    setAvatarSuccess('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Dung lượng ảnh không được vượt quá 2 MB.')
      event.target.value = ''
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current)
    avatarPreviewUrlRef.current = localPreviewUrl
    setAvatarPreview(localPreviewUrl)

    try {
      const data = await avatarMutation.mutateAsync(file)
      profile.setData((current) => ({ ...current, id: user.id, avatar: data.avatar }))
      updateUser({ avatar: data.avatar })
      URL.revokeObjectURL(avatarPreviewUrlRef.current)
      avatarPreviewUrlRef.current = null
      setAvatarPreview(data.avatar)
      setAvatarSuccess('Cập nhật ảnh đại diện thành công.')
    } catch (error) {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current)
        avatarPreviewUrlRef.current = null
      }
      setAvatarPreview(user?.avatar && user.avatar !== 'avatar' ? user.avatar : defaultAvatar)
      setAvatarError(error.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleDeleteAvatar() {
    if (!user?.avatar || uploadingAvatar || deletingAvatar) return

    setAvatarError('')
    setAvatarSuccess('')
    try {
      await deleteAvatarMutation.mutateAsync()
      profile.setData((current) => ({ ...current, id: user.id, avatar: null }))
      updateUser({ avatar: null })
      setAvatarPreview(defaultAvatar)
      setAvatarSuccess('Đã gỡ ảnh đại diện thành công.')
    } catch (error) {
      setAvatarError(error.response?.data?.message || 'Không thể gỡ ảnh đại diện.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    setFormError('')
    setFormSuccess('')
    setFieldErrors({})

    const fullName = form.fullName.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (fullName.length < 2 || fullName.length > 100) {
      setFormError('Họ và tên phải có từ 2 đến 100 ký tự.')
      return
    }
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Email không hợp lệ hoặc vượt quá 255 ký tự.')
      return
    }
    if (phone && !/^(0|\+84)[0-9]{9}$/.test(phone)) {
      setFormError('Số điện thoại Việt Nam không hợp lệ.')
      return
    }

    try {
      const updatedUser = await profileMutation.mutateAsync({ fullName, email, phone })
      dirty.current = false
      profile.setData(updatedUser)
      updateUser(updatedUser)
      setFormSuccess('Cập nhật thông tin cá nhân thành công.')
    } catch (error) {
      const responseData = error.response?.data
      const validationErrors = responseData?.validationErrors || {}
      const firstErrorField = ['fullName', 'email', 'phone'].find((field) => validationErrors[field])

      if (firstErrorField) {
        setFieldErrors(validationErrors)
        if (firstErrorField === 'fullName') fullNameInputRef.current?.focus()
        if (firstErrorField === 'email') emailInputRef.current?.focus()
        if (firstErrorField === 'phone') phoneInputRef.current?.focus()
      } else {
        setFormError(responseData?.message || 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại.')
      }
    }
  }

  function openPasswordModal() {
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswordModal(true)
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target
    setPasswordForm((previous) => ({ ...previous, [name]: value }))
    setPasswordError('')
  }

  function closePasswordModal() {
    if (changingPassword) return
    setShowPasswordModal(false)
    setPasswordError('')
    setPasswordForm(emptyPasswordForm)
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    if (changingPassword) return
    setPasswordError('')
    setPasswordSuccess('')

    const { currentPassword, newPassword, confirmPassword } = passwordForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 100) {
      setPasswordError('Mật khẩu mới phải từ 8 đến 100 ký tự.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.')
      return
    }

    try {
      await passwordMutation.mutateAsync([currentPassword, newPassword])
      setShowPasswordModal(false)
      setPasswordForm(emptyPasswordForm)
      setPasswordSuccess('Đổi mật khẩu thành công.')
    } catch (error) {
      console.error('Change password error:', error)
      const message = error.response?.data?.message || error.response?.data?.error
      if (error.response?.status === 400) {
        setPasswordError(message || 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.')
      } else if (error.response?.status === 401) {
        setPasswordError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
      } else {
        setPasswordError(message || 'Không thể đổi mật khẩu. Vui lòng thử lại.')
      }
    }
  }

  return {
    activity,
    avatarError,
    avatarInputRef,
    avatarPreview,
    avatarSuccess,
    changingPassword,
    closePasswordModal,
    deletingAvatar,
    examCount,
    fieldErrors,
    form,
    formError,
    formSuccess,
    fullNameInputRef,
    googleLinkedQuery,
    handleAvatarChange,
    handleChange,
    handleChangePassword,
    handleDeleteAvatar,
    handlePasswordChange,
    handleSubmit,
    homePath,
    isPasswordModalOpen: showPasswordModal,
    navigate,
    openPasswordModal,
    passwordError,
    passwordForm,
    passwordSuccess,
    phoneInputRef,
    profileError: profile.errorMessage,
    roleLabel,
    saving,
    setAvatarPreview,
    uploadingAvatar,
    user,
    emailInputRef,
  }
}
