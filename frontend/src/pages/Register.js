"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Input from "../components/Input"
import Button from "../components/Button"
import "../styles/auth.css"
import LoadingModal from "../components/LoadingModal"

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    upiId: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // UPI ID is now optional, so no validation here

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Mock API call
      const response = await fetch(`${REACT_APP_API_URL}/auth/register`, {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          name:formData.name,
          email:formData.email,
          password:formData.password,
          upi_id:formData.upiId || null
        }),
        credentials:"include"
      })

      const data = await response.json();

      // Simulate successful registration
      if(!response.ok){
        console.log(response)
        throw new Error(data.message || "Registration failed. Please try again.")
      }
        navigate("/login", {
          state: { message: "Registration successful! Please sign in." },
        })
    } catch (error) {
      console.error(error)
      setErrors({ general: "Registration failed. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join SplitPay today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && <div className="error-banner">{errors.general}</div>}

          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

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
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          <Input
            label="UPI ID (Optional)"
            name="upiId"
            placeholder="yourname@upi"
            value={formData.upiId}
            onChange={handleChange}
            error={errors.upiId}
            // required removed to make it optional
          />

          <Button type="submit" loading={loading} className="auth-submit">
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <LoadingModal
        isOpen={loading}
        message="Creating your account..."
        submessage="Setting up your profile and preferences"
        type="circle"
      />
    </div>
  )
}

export default Register
