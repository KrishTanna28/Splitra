"use client"

import { useState } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"

const CreateGroupModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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
      newErrors.name = "Group name is required"
    }
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
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSubmit(formData)
      setFormData({ name: "", description: "" })
      setErrors({})
    } catch (error) {
      setErrors({ general: "Failed to create group" })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: "", description: "" })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Group">
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-banner">{errors.general}</div>}

        <Input
          label="Group Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., Weekend Trip, Office Lunch"
          required
        />

        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description"
        />

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateGroupModal
