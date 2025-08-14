"use client"

import { useState, useEffect } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"

const AddRecurringModal = ({ isOpen, onClose, onSubmit, editData, groups }) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    frequency: "monthly",
    groupId: "",
    category: "Other",
    participants: [],
    start_date: "",
  })
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState("")
  const [loading, setLoading] = useState(false)

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ]

  const categories = ["Food", "Transport", "Accommodation", "Entertainment", "Shopping", "Other"]

  useEffect(() => {
    if (editData) {
      setFormData({
        description: editData.description || "",
        amount: editData.amount?.toString() || "",
        frequency: editData.frequency || "monthly",
        groupId: editData.groupId?.toString() || "",
        category: editData.category || "Other",
        participants: editData.participants || [],
        start_date: editData.start_date ? formatToInputDate(editData.start_date) : "",
      })
    } else {
      setFormData({
        description: "",
        amount: "",
        frequency: "monthly",
        groupId: "",
        category: "Other",
        participants: [],
        start_date: "",
      })
    }
    setErrors({})
    setGeneralError("")
  }, [editData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
    }

    if (!formData.groupId) {
      newErrors.groupId = "Please select a group"
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required"
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
    setGeneralError("")
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const selectedGroup = groups.find((g) => g.id === Number.parseInt(formData.groupId))
      const contributionData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
        groupId: Number.parseInt(formData.groupId),
        groupName: selectedGroup?.name || "",
        participants: selectedGroup?.members || [],
        id: editData?.id,
      }

      await onSubmit(contributionData)

      if (!editData) {
        setFormData({
          description: "",
          amount: "",
          frequency: "monthly",
          groupId: "",
          category: "Other",
          participants: [],
          start_date: "",
        })
      }
      setErrors({})
    } catch (error) {
      setGeneralError("Failed to save recurring contribution")
    } finally {
      setLoading(false)
    }
  }

  function formatDateOnly(isoString) {
    const date = new Date(isoString)
    return date.toISOString().split("T")[0]
  }

  function formatToInputDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleClose = () => {
    setFormData({
      description: "",
      amount: "",
      frequency: "monthly",
      groupId: "",
      category: "Other",
      participants: [],
      start_date: "",
    })
    setErrors({})
    setGeneralError("")
    onClose()
  }

  const handleFrequencyChange = (e) => {
    const frequency = e.target.value
    setFormData({
      ...formData,
      frequency,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? "Edit Recurring Contribution" : "Add Recurring Contribution"}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {generalError && <div className="error-banner">{generalError}</div>}

        <div className="form-row">
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
            error={errors.description}
            required
          />
        </div>

        <div className="form-row">
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="0.00"
            required
          />

          <div className="input-group">
            <label className="input-label">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">Frequency *</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleFrequencyChange}
              className="input"
              required
            >
              {frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Start Date *</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={`input ${errors.start_date ? "input-error" : ""}`}
              required
            />
            {errors.start_date && <span className="error-message">{errors.start_date}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">Group *</label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              className={`input ${errors.groupId ? "input-error" : ""}`}
              required
            >
              <option value="">Select a group</option>
              {Array.isArray(groups) &&
                groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
            </select>
            {errors.groupId && <span className="error-message">{errors.groupId}</span>}
          </div>
        </div>

        {Object.keys(errors).some((key) => key !== "general") && (
          <div className="error-banner">Please fix the highlighted fields.</div>
        )}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? "Update" : "Create"} Recurring
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddRecurringModal
