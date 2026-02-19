"use client"

import { useState, useCallback } from "react"

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

  const showNotification = useCallback(({
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
  }, [])

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const showSuccess = useCallback((message, title = "Success") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: "success",
      confirmText: "OK",
      showCancel: false,
      cancelText: "Cancel",
      onConfirm: null,
    })
  }, [])

  const showError = useCallback((message, title = "Error") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: "error",
      confirmText: "OK",
      showCancel: false,
      cancelText: "Cancel",
      onConfirm: null,
    })
  }, [])

  const showWarning = useCallback((message, title = "Warning") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: "warning",
      confirmText: "OK",
      showCancel: false,
      cancelText: "Cancel",
      onConfirm: null,
    })
  }, [])

  const showConfirm = useCallback((message, onConfirm, title = "Confirm") => {
    setNotification({
      isOpen: true,
      title,
      message,
      type: "warning",
      showCancel: true,
      confirmText: "Yes",
      cancelText: "No",
      onConfirm,
    })
  }, [])

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
