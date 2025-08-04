"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Card from "../components/Card"
import Button from "../components/Button"
import Input from "../components/Input"
import { useAuth } from "../context/AuthContext"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "../components/NotificationModal"
import LoadingModal from "../components/LoadingModal"
import "../styles/profile.css"

const Profile = () => {
    const { token, login, user } = useAuth()
    const navigate = useNavigate()
    const { notification, hideNotification, showSuccess, showError } = useNotification()
    const [removePicture, setRemovePicture] = useState(false)

    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const REACT_APP_API_URL = process.env.REACT_APP_API_URL

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        upiId: "",
    })
    const [errors, setErrors] = useState({})

    // Profile Picture
    const [profilePicture, setProfilePicture] = useState(null)
    const [profilePicturePreview, setProfilePicturePreview] = useState(null)

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                upiId: user.upi_id || "",
            })
        }
    }, [user])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                // 5MB limit
                showError("Profile picture must be less than 5MB", "File Too Large")
                return
            }

            if (!file.type.startsWith("image/")) {
                showError("Please select a valid image file", "Invalid File Type")
                return
            }
            setProfilePicturePreview(file)
            setProfilePicture(file)
            const reader = new FileReader()
            reader.onload = (e) => setProfilePicturePreview(e.target.result)
            reader.readAsDataURL(file)
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
            newErrors.email = "Please enter a valid email"
        }

        if (formData.upiId && !/^[\w.-]+@[\w.-]+$/.test(formData.upiId)) {
            newErrors.upiId = "Please enter a valid UPI ID"
        }

        return newErrors
    }

    const handleSave = async () => {
        const newErrors = validateForm()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setLoading(true)

        try {
            const form = new FormData()
            form.append("name", formData.name)
            form.append("email", formData.email)
            form.append("upi_id", formData.upiId)

            if (profilePicture) {
                form.append("profile_picture", profilePicture)
            }

            if (removePicture) {
                form.append("remove_picture", "true")
            }

            const response = await fetch(`${REACT_APP_API_URL}/auth/update-profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: form,
            })

            const data = await response.json()

            if (response.ok) {
                showSuccess("Profile updated successfully!", "Profile Updated")
                login(data.user, token) // Update auth context
                setIsEditing(false)
                setRemovePicture(false)
            } else {
                showError(data.message || "Failed to update profile", "Update Failed")
            }
        } catch (error) {
            showError("Something went wrong", "Update Failed")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        // Reset form data to original values
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            upiId: user?.upiId || "",
        })
        setProfilePicturePreview(user?.profilePicture || null)
        setProfilePicture(null)
        setErrors({})
        setIsEditing(false)
    }

    const getInitials = (name) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .join("")
            .slice(0, 2)
    }

    const hasUpiId = formData.upiId && formData.upiId.trim() !== ""

    return (
        <div className="profile-page">
            <Navbar title="Profile" />

            <div className="profile-content">
                <div className="profile-header">
                    <button className="back-btn" onClick={() => navigate("/dashboard")} aria-label="Back to Dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
                            <path d="M32 15H3.41l8.29-8.29-1.41-1.42-10 10a1 1 0 0 0 0 1.41l10 10 1.41-1.41L3.41 17H32z" />
                        </svg>
                    </button>
                    <h2>My Profile</h2>
                    <p>Manage your account information</p>
                </div>

                <div className="profile-container-simple">
                    <Card className="profile-card-simple">
                        {/* Profile Picture Section */}
                        <div className="profile-picture-section-simple">
                            <div className="current-picture-simple">
                                {profilePicturePreview ? (
                                    <img
                                        src={profilePicturePreview}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                            display: "block",
                                        }}
                                    />
                                ) : user.profile_picture && !removePicture ? (
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
                                ) : (
                                    <div className="profile-placeholder-simple">{getInitials(formData.name)}</div>
                                )}
                            </div>
                            {isEditing && (
                                <div className="picture-actions-simple">
                                    <input
                                        type="file"
                                        id="profile-picture"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="file-input"
                                    />
                                    <label htmlFor="profile-picture" className="btn btn-secondary btn-small">
                                        Change Picture
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        onClick={() => {
                                            setRemovePicture(true)
                                            setProfilePicture(null)
                                            setProfilePicturePreview(null)
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Profile Information */}
                        <div className="profile-info-section">
                            <div className="profile-fields">
                                <Input
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    disabled={!isEditing}
                                    required
                                />

                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    disabled={!isEditing}
                                    required
                                />

                                <div className="upi-field">
                                    <Input
                                        label="UPI ID"
                                        name="upiId"
                                        value={formData.upiId}
                                        onChange={handleChange}
                                        error={errors.upiId}
                                        disabled={!isEditing}
                                        placeholder="yourname@upi"
                                    />
                                    {!hasUpiId && !isEditing && (
                                        <div className="upi-missing-notice">
                                            <p className="notice-text">
                                                <span className="notice-icon">💳</span>
                                                Add your UPI ID to receive payments easily
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="profile-actions">
                                {!isEditing ? (
                                    <Button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                                        {!hasUpiId ? "Update Profile" : "Edit Profile"}
                                    </Button>
                                ) : (
                                    <div className="edit-actions">
                                        <Button variant="secondary" onClick={handleCancel}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSave} loading={loading}>
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <LoadingModal
                isOpen={loading}
                message="Updating your profile..."
                submessage="Please wait while we save your changes"
                type="pulse"
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
        </div>
    )
}

export default Profile
