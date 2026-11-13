import { Modal } from 'antd'

export default function ResetAttemptDialog({
  resetMode,
  isPending,
  onCancel,
  onConfirm,
}) {
  const isRetake = resetMode === 'RETAKE'

  return (
    <Modal
      title={
        isRetake
          ? 'Xóa kết quả và cho thi lại?'
          : 'Xóa kết quả và chặn thi lại?'
      }
      open={Boolean(resetMode)}
      onCancel={() => {
        if (!isPending) onCancel()
      }}
      onOk={onConfirm}
      confirmLoading={isPending}
      okText="Xác nhận xóa"
      cancelText="Hủy"
      okButtonProps={{ danger: true }}
      closable={!isPending}
      maskClosable={!isPending}
    >
      <p>
        Đáp án đã nộp, điểm, nhận xét và nhật ký của lượt hiện tại sẽ bị xóa.
        Hành động không thể hoàn tác.
      </p>
      <p className="mt-3">
        {isRetake
          ? 'Học sinh được thêm quyền làm lại. Đáp án đã được công bố trước đó không thể thu hồi.'
          : 'Học sinh bị chặn thi lại trong đợt giao này, không ảnh hưởng các đợt khác.'}
      </p>
    </Modal>
  )
}
