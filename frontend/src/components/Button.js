"use client"
import "../styles/button.css"

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className} ${loading ? "loading" : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className="btn-spinner"></span> : children}
    </button>
  )
}

export default Button
