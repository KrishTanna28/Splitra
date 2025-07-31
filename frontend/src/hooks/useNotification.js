"use client"

import { useState } from "react"

export const useNotification = () => {
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
    showCancel: false,
    cancelText: "Cancel",
    onConfirm: null,
  })

  const showNotification = ({
    title = "Notification",
    message,
    type = "info",
    confirmText = "OK",
    showCancel = false,
    cancelText = "Cancel",
    onConfirm = null,
  }) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      showCancel,
      cancelText,
      onConfirm,
    })
  }

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }

  const showSuccess = (message, title = "Success") => {
    showNotification({ title, message, type: "success" })
  }

  const showError = (message, title = "Error") => {
    showNotification({ title, message, type: "error" })
  }

  const showWarning = (message, title = "Warning") => {
    showNotification({ title, message, type: "warning" })
  }

  const showConfirm = (message, onConfirm, title = "Confirm") => {
    showNotification({
      title,
      message,
      type: "warning",
      showCancel: true,
      confirmText: "Yes",
      cancelText: "No",
      onConfirm,
    })
  }

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  }
}
