"use client"

import { useState, useEffect } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"
import LoadingModal from "../components/LoadingModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "../components/NotificationModal"

const OTPModal = ({ isOpen, onClose, email, onSuccess }) => {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const { notification, hideNotification, showSuccess } = useNotification()
  const API_URL = "http://localhost:5000"

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [isOpen, countdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Mock OTP verification
      const response = await fetch(`${API_URL}/auth/verify-otp`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          email,
          otp
        }),
        credentials:"include"
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.")
      }

      onSuccess(data.user, data.token)
      showSuccess(`OTP has been resent to ${email}`, "OTP Sent")
    } catch (error) {
      setError("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(60)
    setError("")

    try {
      // Mock resend OTP
      const response = await fetch(`${API_URL}/auth/resend-otp`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          email,
          otp
        }),
        credentials:"include"
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.")
      }

      onSuccess(data.user, data.token)
    } catch (error) {
      setError("Failed to resend OTP")
    }
  }

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
    if (error) setError("")
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify OTP">
      <form onSubmit={handleSubmit}>
        <div className="otp-content">
          <p className="otp-message">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>

          <Input
            label="Enter OTP"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            error={error}
            className="otp-input"
          />

          <div className="otp-actions">
            <Button type="submit" loading={loading} disabled={otp.length !== 6}>
              Verify OTP
            </Button>

            <div className="resend-section">
              {canResend ? (
                <button type="button" className="resend-btn" onClick={handleResend}>
                  Resend OTP
                </button>
              ) : (
                <span className="countdown">Resend in {countdown}s</span>
              )}
            </div>
          </div>
        </div>
      </form>
      <LoadingModal
        isOpen={loading}
        message="Verifying OTP..."
        submessage="Please wait while we confirm your code"
        type="dots"
      />
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

export default OTPModal
