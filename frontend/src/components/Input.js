"use client"
import "../styles/input.css"

const Input = ({
  label,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  name
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`input ${error ? "input-error" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        name={name}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

export default Input
