"use client"

import { useEffect } from "react"
import "../styles/loading-modal.css"

const LoadingModal = ({
  isOpen,
  message = "Loading...",
  submessage = "",
  type = "spinner", // spinner, dots, pulse, bars, circle
  overlay = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const renderLoader = () => {
    switch (type) {
      case "dots":
        return (
          <div className="loader-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )

      case "pulse":
        return (
          <div className="loader-pulse">
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
          </div>
        )

      case "bars":
        return (
          <div className="loader-bars">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        )

      case "circle":
        return (
          <div className="loader-circle">
            <div className="circle-path"></div>
          </div>
        )

      default: // spinner
        return (
          <div className="loader-spinner">
            <div className="spinner"></div>
          </div>
        )
    }
  }

  return (
    <div className={`loading-modal-overlay ${overlay ? "with-overlay" : "no-overlay"}`}>
      <div className="loading-modal-content">
        <div className="loading-animation">{renderLoader()}</div>

        <div className="loading-text">
          <h3 className="loading-message">{message}</h3>
          {submessage && <p className="loading-submessage">{submessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default LoadingModal
