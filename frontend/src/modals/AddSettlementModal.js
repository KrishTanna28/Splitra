"use client"

import { useState, useEffect } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"
import { useAuth } from "../context/AuthContext"

const AddSettlementModal = ({ isOpen, onClose, onSubmit, groupId, members, prefilledData }) => {
  const [formData, setFormData] = useState({
    from: "",
      to: "",
      amount: "",
      note: "",
  })

  useEffect(() => {
  if (isOpen && prefilledData && members.length > 0) {
    setFormData({
      from: prefilledData.from,
      to: prefilledData.to,
      amount: prefilledData.amount || "",
      note: "",
    });
  }
}, [isOpen, prefilledData, members]);


  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const {user} = useAuth()
  const userName = user.name

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

    if (!formData.from) {
      newErrors.from = "Please select who paid"
    }

    if (!formData.to) {
      newErrors.to = "Please select who received"
    }

    if (formData.from === formData.to) {
      newErrors.to = "Payer and receiver cannot be the same"
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
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

      const settlementData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
      }

      onSubmit(settlementData)

      setFormData({
        from: "",
        to: "",
        amount: "",
        note: "",
      })
      setErrors({})
      onClose()
    } catch (error) {
      setErrors({ general: "Failed to record settlement" })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      from: "",
      to: "",
      amount: "",
      note: "",
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Settlement">
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-banner">{errors.general}</div>}

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">From *</label>
            <select
              name="from"
              value={formData.from}
              onChange={handleChange}
              className={`input ${errors.from ? "input-error" : ""}`}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name == userName ? "You" : member.name}
                </option>
              ))}
            </select>
            {errors.from && <span className="error-message">{errors.from}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">To *</label>
            <select
              name="to"
              value={formData.to}
              onChange={handleChange}
              className={`input ${errors.to ? "input-error" : ""}`}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name == userName ? "You" : member.name}
                </option>
              ))}
            </select>
            {errors.to && <span className="error-message">{errors.to}</span>}
          </div>
        </div>

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

        <Input
          label="Note (Optional)"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Payment description"
        />

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Record Settlement
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddSettlementModal
