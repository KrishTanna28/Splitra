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
    startDate: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const frequencies = [
    { value : "daily", label : "Daily"},
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ]

  const categories = ["Food", "Transport", "Accommodation", "Entertainment", "Shopping", "Other"]

  useEffect(() => {
    if (editData) {
      setFormData({
        description: editData.description,
        amount: editData.amount.toString(),
        frequency: editData.frequency,
        groupId: editData.groupId.toString(),
        category: editData.category,
        participants: editData.participants,
        startDate: editData.startDate ? formatToInputDate(editData.startDate) : "",
      })
    } else {
      // Set default next date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData({
        description: "",
        amount: "",
        frequency: "monthly",
        groupId: "",
        category: "Other",
        participants: [],
        startDate: "",
      })
    }
  }, [editData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // // Update participants when group changes
    // if (name === "groupId") {
    //   const selectedGroup = groups.find((g) => g.id === Number.parseInt(value))
    //   setFormData((prev) => ({
    //     ...prev,
    //     [name]: value,
    //     participants: selectedGroup ? selectedGroup.members : [],
    //   }))
    // }

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

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
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

      const selectedGroup = groups.find((g) => g.id === Number.parseInt(formData.groupId))
      const contributionData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
        groupId: Number.parseInt(formData.groupId),
        groupName: selectedGroup?.name || "",
        participants: selectedGroup?.members || [],
        id : editData.id
      }

      onSubmit(contributionData)

      if (!editData) {
        setFormData({
          title: "",
          description: "",
          amount: "",
          frequency: "monthly",
          groupId: "",
          category: "Other",
          participants: [],
          startDate: editData.startDate ? formatDateOnly(editData.startDate) : "",
        })
      }
      setErrors({})
    } catch (error) {
      setErrors({ general: "Failed to save recurring contribution" })
    } finally {
      setLoading(false)
    }
  }

  function formatDateOnly(isoString) {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0]; // Always "yyyy-MM-dd"
}

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      frequency: "monthly",
      groupId: "",
      category: "Other",
      participants: [],
    })
    setErrors({})
    onClose()
  }


  const handleFrequencyChange = (e) => {
    const frequency = e.target.value
    setFormData({
      ...formData,
      frequency,
    })
  }

  function formatToInputDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? "Edit Recurring Contribution" : "Add Recurring Contribution"}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-banner">{errors.general}</div>}

        <div className="form-row">
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
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
            <select name="category" value={formData.category} onChange={handleChange} className="input" required>
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
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="input"
              required
            />
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
              {Array.isArray(groups) && groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.groupId && <span className="error-message">{errors.groupId}</span>}
          </div>
        </div>

        {/* {formData.participants.length > 0 && (
          <div className="participants-preview">
            <h4>Participants ({formData.participants.length})</h4>
            <div className="participants-list">
              {formData.participants.map((participant, index) => (
                <span key={index} className="participant-tag">
                  {participant}
                </span>
              ))}
            </div>
          </div>
        )} */}

        {Object.keys(errors).length > 0 && (
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
