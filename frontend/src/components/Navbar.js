"use client"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import "../styles/navbar.css"

const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)
  }

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown)
  }

  const handleThemeToggle = () => {
    toggleTheme()
    setShowDropdown(false)
  }

  const handleProfileNavigation = () => {
    navigate("/profile")
    setShowDropdown(false)
  }

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1 className="navbar-title">
          <img src="/logo.png" alt="Splitra Logo" className="logo-img" />
          <span>Splitra</span>
        </h1>
        <div className="navbar-actions">
          <div className="profile-dropdown" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={handleProfileClick}
              aria-label="Profile menu"
              style={{
                width: "40px",
                height: "40px",
                padding: 0,
                border: "none",
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
              }}
            >
              <img
                src={user.profile_picture}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  display: "block",
                }}
              />
            </button>


            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header" style={{
                width: "40px",
                height: "40px",
                padding: 0,
                border: "none",
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
              }}>
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                      display: "block",
                    }}
                  />
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{user?.name}</span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <button className="dropdown-item" onClick={handleThemeToggle}>
                  <span className="dropdown-icon">{theme === "light" ? "🌙" : "☀️"}</span>
                  <span>Switch to {theme === "light" ? "Dark" : "Light"} Mode</span>
                </button>

                <button className="dropdown-item" onClick={handleProfileNavigation}>
                  <span className="dropdown-icon">👤</span>
                  <span>Profile</span>
                </button>

                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
