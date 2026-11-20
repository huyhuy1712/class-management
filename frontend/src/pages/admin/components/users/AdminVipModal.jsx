import { useState } from 'react'
import { Gem } from 'lucide-react'
import FrogLoading from '../../../../utils/FrogLoading'

const vipTiers = [
  { value: 'PERSONAL', label: 'VIP Cá nhân', devices: 1 },
  { value: 'FIVE_DEVICES', label: 'VIP 5 thiết bị', devices: 5 },
  { value: 'TEN_DEVICES', label: 'VIP 10 thiết bị', devices: 10 },
]

export default function AdminVipModal({
  user,
  grantPending,
  removePending,
  onClose,
  onGrant,
  onRemove,
}) {
  const [vipTier, setVipTier] = useState(user?.vipTier || 'PERSONAL')
  const [durationMonths, setDurationMonths] = useState('1')
  const [permanent, setPermanent] = useState(Boolean(user?.vipPermanent))
  const [confirmRemove, setConfirmRemove] = useState(false)

  if (!user) return null
  const isPending = grantPending || removePending

  function submitGrant(event) {
    event.preventDefault()
    onGrant({
      vipTier,
      durationMonths: Number(durationMonths),
      permanent,
    })
  }

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose()
      }}
    >
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-vip-title"
      >
        <div className="admin-modal__header">
          <div>
            <span className="admin-eyebrow">TEACHER VIP</span>
            <h2 id="admin-vip-title">Quản lý VIP</h2>
            <p>Tài khoản: <strong>{user.name}</strong></p>
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} disabled={isPending} aria-label="Đóng">
            ×
          </button>
        </div>

        <form onSubmit={submitGrant}>
          <div className="admin-modal__body">
            <div className="admin-form-field">
              <label htmlFor="admin-vip-tier">Hạng VIP</label>
              <select id="admin-vip-tier" value={vipTier} onChange={(event) => setVipTier(event.target.value)} disabled={isPending}>
                {vipTiers.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label} · {tier.devices} thiết bị
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="admin-vip-duration">Thời hạn (tháng)</label>
              <input
                id="admin-vip-duration"
                type="number"
                min="1"
                max="1200"
                value={durationMonths}
                onChange={(event) => setDurationMonths(event.target.value)}
                disabled={permanent || isPending}
                required={!permanent}
              />
            </div>

            <label className="admin-vip-permanent">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(event) => setPermanent(event.target.checked)}
                disabled={isPending}
              />
              Cấp VIP vĩnh viễn
            </label>

            {user.vipTier && (
              <div className="admin-vip-current">
                VIP hiện tại: <strong>{vipTiers.find((tier) => tier.value === user.vipTier)?.label || user.vipTier}</strong>
                <span>
                  {user.vipPermanent
                    ? 'Vĩnh viễn'
                    : `Có hiệu lực đến ${new Date(user.vipExpiresAt).toLocaleDateString('vi-VN')}`}
                </span>
              </div>
            )}

            {confirmRemove && (
              <p className="admin-vip-warning" role="alert">
                Xác nhận xóa toàn bộ quyền VIP của tài khoản này? Thao tác có hiệu lực ngay.
              </p>
            )}
          </div>

          <div className="admin-modal__footer">
            <button type="button" className="admin-secondary-btn" onClick={onClose} disabled={isPending}>
              Đóng
            </button>
            {user.vipTier && (
              confirmRemove ? (
                <>
                  <button type="button" className="admin-secondary-btn" onClick={() => setConfirmRemove(false)} disabled={isPending}>
                    Hủy xóa
                  </button>
                  <button type="button" className="admin-danger-btn" onClick={onRemove} disabled={isPending}>
                    {removePending ? <FrogLoading compact label="Đang xóa..." /> : 'Xác nhận xóa VIP'}
                  </button>
                </>
              ) : (
                <button type="button" className="admin-danger-btn" onClick={() => setConfirmRemove(true)} disabled={isPending}>
                  Xóa VIP
                </button>
              )
            )}
            <button type="submit" className="admin-primary-btn" disabled={isPending || (!permanent && (!durationMonths || Number(durationMonths) < 1 || Number(durationMonths) > 1200))}>
              {grantPending ? <FrogLoading compact label="Đang cấp..." /> : <><Gem size={16} /> Cấp VIP</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
