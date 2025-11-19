import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Input from "../components/Input"
import Button from "../components/Button"
import OTPModal from "../modals/OTPModal"
import "../styles/auth.css"
import LoadingModal from "../components/LoadingModal"
import { Eye, EyeOff } from "lucide-react" 

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [showPassword, setShowPassword] = useState(false) 
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(`${REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: "include"
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please try again.")
      }

      if (data.requiresOTP) {
        setShowOTP(true)
      } else {
        setErrors({ general: "Unexpected response from server." })
      }

    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: error.message || "An error occurred during login." })
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSuccess = (userData, token) => {
    setShowLoadingModal(true);
    login(userData, token);
    setTimeout(() => {
      setShowLoadingModal(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && <div className="error-banner">{errors.general}</div>}

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          >
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                cursor: "pointer"
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </Input>

          <Button type="submit" disabled={false} className="auth-submit">
            Sign In
          </Button>

          <LoadingModal
            isOpen={loading}
            message="Signing you in..."
            submessage="Please wait while we verify your credentials"
            type="pulse"
          />
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        email={formData.email}
        onSuccess={handleOTPSuccess}
      />
      <LoadingModal
        isOpen={showLoadingModal}
        message="Logging you in..."
        type="spinner"
      />
    </div>
  )
}

export default Login
