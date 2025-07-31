"use client"
import Modal from "../components/Modal"
import Button from "../components/Button"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "../components/NotificationModal"

const UPIQRModal = ({ isOpen, onClose, user }) => {
  const { notification, hideNotification, showSuccess } = useNotification()
  const generateQRCode = (upiId, amount = "") => {
    // Mock QR code generation - in real app, use a QR library
    return `/placeholder.svg?height=200&width=200&query=UPI QR code for ${upiId}`
  } 

  const handleCopyUPI = () => {
    if (user?.upiId) {
      navigator.clipboard.writeText(user.upiId)
      showSuccess("UPI ID copied to clipboard!", "Copied")
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="UPI Payment">
      <div className="upi-modal">
        <div className="upi-header">
          <h4>Scan to Pay {user.name}</h4>
          <p>Use any UPI app to scan this QR code</p>
        </div>

        <div className="qr-container">
          <img src={generateQRCode(user.upiId) || "/placeholder.svg"} alt="UPI QR Code" className="qr-code" />
        </div>

        <div className="upi-details">
          <div className="upi-id-section">
            <label>UPI ID:</label>
            <div className="upi-id-row">
              <span className="upi-id">{user.upiId || "you@upi"}</span>
              <Button variant="secondary" size="small" onClick={handleCopyUPI}>
                Copy
              </Button>
            </div>
          </div>
        </div>

        <div className="upi-instructions">
          <h5>How to pay:</h5>
          <ol>
            <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
            <li>Scan the QR code above</li>
            <li>Enter the amount and confirm payment</li>
            <li>Share the transaction screenshot in the group</li>
          </ol>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={notification.confirmText}
        showCancel={notification.showCancel}
        cancelText={notification.cancelText}
        onConfirm={notification.onConfirm}
      />
    </Modal>
  )
}

export default UPIQRModal
