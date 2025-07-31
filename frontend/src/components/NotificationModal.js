"use client"

import Modal from "./Modal"
import Button from "./Button"

const NotificationModal = ({
  isOpen,
  onClose,
  title = "Notification",
  message,
  type = "info", // success, error, warning, info
  confirmText = "OK",
  showCancel = false,
  cancelText = "Cancel",
  onConfirm,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      default:
        return "ℹ️"
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="notification-content">
        <div className="notification-icon">{getIcon()}</div>
        <div className="notification-message">{message}</div>

        <div className="notification-actions">
          {showCancel && (
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button onClick={handleConfirm}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default NotificationModal
