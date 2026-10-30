import AccountDetailsCard from './components/AccountDetailsCard'
import ChangePasswordModal from './modals/ChangePasswordModal'
import GoogleSecurityCard from './components/GoogleSecurityCard'
import ProfileHeader from './components/ProfileHeader'
import ProfileInformationForm from './components/ProfileInformationForm'
import ProfileSecuritySection from './components/ProfileSecuritySection'
import defaultAvatar from '../../assets/images/avatar_default.png'
import useAccountProfile from './hooks/useAccountProfile'

export default function AccountProfilePage({ student = false }) {
  const profile = useAccountProfile(student)

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-5">
      {profile.profileError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {profile.profileError}
        </p>
      )}

      <ProfileHeader
        user={profile.user}
        roleLabel={profile.roleLabel}
        avatarPreview={profile.avatarPreview}
        avatarInputRef={profile.avatarInputRef}
        uploadingAvatar={profile.uploadingAvatar}
        deletingAvatar={profile.deletingAvatar}
        onAvatarError={() => profile.setAvatarPreview(defaultAvatar)}
        onAvatarChange={profile.handleAvatarChange}
        onChooseAvatar={() => profile.avatarInputRef.current?.click()}
        onDeleteAvatar={profile.handleDeleteAvatar}
      />

      <GoogleSecurityCard student={student} />

      {profile.avatarError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {profile.avatarError}
        </div>
      )}
      {profile.avatarSuccess && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {profile.avatarSuccess}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <ProfileInformationForm
            form={profile.form}
            fieldErrors={profile.fieldErrors}
            formError={profile.formError}
            formSuccess={profile.formSuccess}
            fullNameInputRef={profile.fullNameInputRef}
            emailInputRef={profile.emailInputRef}
            phoneInputRef={profile.phoneInputRef}
            saving={profile.saving}
            onChange={profile.handleChange}
            onSubmit={profile.handleSubmit}
            onReturn={() => profile.navigate(profile.homePath)}
          />

          <ProfileSecuritySection
            googleLinkedQuery={profile.googleLinkedQuery}
            passwordSuccess={profile.passwordSuccess}
            onOpenPasswordModal={profile.openPasswordModal}
          />
        </div>

        <AccountDetailsCard
          user={profile.user}
          student={student}
          roleLabel={profile.roleLabel}
          activity={profile.activity}
          examCount={profile.examCount}
        />
      </div>

      <ChangePasswordModal
        open={profile.isPasswordModalOpen}
        googleLinked={profile.googleLinkedQuery.data === true}
        passwordForm={profile.passwordForm}
        passwordError={profile.passwordError}
        changingPassword={profile.changingPassword}
        onClose={profile.closePasswordModal}
        onChange={profile.handlePasswordChange}
        onSubmit={profile.handleChangePassword}
      />
    </div>
  )
}
