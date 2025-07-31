import { use, useEffect, useState } from "react"
import Modal from "../components/Modal"
import Button from "../components/Button"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "../components/NotificationModal"
import { useAuth } from "../context/AuthContext" // Assuming this gives you the token

const UPIQRModal = ({ isOpen, onClose }) => {
  const { notification, hideNotification, showSuccess, showError } = useNotification()
  const { token } = useAuth()
  const [qrData, setQrData] = useState(null)
  const [errors, setErrors] = useState({})
  const [user, setUser] = useState({})
  const API_URL = process.env.API_URL || "http://localhost:5000"

  useEffect(() => {
    fetchQRCode()
    fetchUserDetails()
  }, [user, token])

  const fetchQRCode = async () => {
      if (user?.upi_id) {
        try {
          const response = await fetch(`${API_URL}/settlements/${user.id}/upi-qr?amount=0`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          const data = await response.json()
          if (response.ok) {
            setQrData(data.qrCode)
          } else {
            showError("Could not generate QR", "Error")
          }
        } catch (err) {
          console.error("QR Fetch error:", err)
        }
      }
    }

    const fetchUserDetails = async () =>{
      try{
        const response = await fetch(`${API_URL}/auth/user-details`, {
          headers:{
            Authorization:`Bearer ${token}`
          }
        })

        const data = await response.json();

        if(response.ok){
          setUser(data.user)
        }
      }catch(error){
        setErrors("Unable to fetch user details")
      }
    }

  const handleCopyUPI = () => {
    if (user?.upi_id) {
      navigator.clipboard.writeText(user.upi_id)
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
          {qrData ? (
            <img src={qrData} alt="UPI QR Code" className="qr-code" />
          ) : (
            <p>Generating QR code...</p>
          )}
        </div>

        <div className="upi-details">
          <div className="upi-id-section">
            <label>UPI ID:</label>
            <div className="upi-id-row">
              <span className="upi-id">{user.upi_id || "you@upi"}</span>
              <Button variant="secondary" size="small" onClick={handleCopyUPI}>
                Copy
              </Button>
            </div>
          </div>
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
