"use client"

import { useState, useEffect } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"

const AddExpenseModal = ({ isOpen, onClose, onSubmit, groupMembers, isEditing, setIsEditing, selectedExpense, expenseShare, existingReceiptUrl }) => {

  const API_URL = process.env.API_URL || "http://localhost:5000"
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Other",
    receipt: null,
  });

  useEffect(() => {
    if (isEditing && selectedExpense) {
      setFormData({
        description: selectedExpense.description || "",
        amount: selectedExpense.amount || "",
        category: selectedExpense.category || "Other",
        receipt: selectedExpense.receipt_url || null, // actual file not available on edit, skip it
      });

      const shares = expenseShare[selectedExpense.id]?.share || [];

      const userIds = shares.map((s) => s.user_id);
      setSelectedMembers(userIds);

      const updatedSplits = groupMembers.map((member) => {
        const matchingShare = shares.find((s) => s.user_id === member.id);
        return {
          userId: member.id,
          name: member.name,
          amount: matchingShare ? matchingShare.amount : "",
        };
      });

      setSplits(updatedSplits);

    }
  }, [isEditing, selectedExpense]);
  const [splits, setSplits] = useState([]);


  useEffect(() => {
    if (Array.isArray(groupMembers) && groupMembers.length > 0) {
      setSplits((prev) => {
        // Only set if lengths mismatch or first-time load
        if (prev.length !== groupMembers.length) {
          return groupMembers.map((member) => ({
            userId: member.id,
            name: member.name,
            amount: "",
          }));
        }
        return prev;
      });
    }
  }, [groupMembers]);

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSplitEqual, setIsSplitEqual] = useState(false);

  const categories = ["Food", "Transport", "Accommodation", "Entertainment", "Shopping", "Other"]

  const handleCheckboxChange = (memberId) => {
    const isSelected = selectedMembers.includes(memberId);
    let updated;

    if (isSelected) {
      updated = selectedMembers.filter((id) => id !== memberId);
    } else {
      updated = [...selectedMembers, memberId];
    }

    setSelectedMembers(updated); // ✅ Set new selection

    const totalAmount = parseFloat(formData.amount);
    const validAmount = !isNaN(totalAmount) && totalAmount > 0;
    const equalShare =
      validAmount && updated.length > 0
        ? (totalAmount / updated.length).toFixed(2)
        : "";

    // ✅ Now update splits using the correct updated state
    setSplits((prevSplits) =>
      prevSplits.map((split) =>
        updated.includes(split.userId)
          ? { ...split, amount: equalShare }
          : { ...split, amount: "" }
      )
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "amount") {
      const amount = parseFloat(value) || 0;
      const equalShare = selectedMembers.length > 0 ? (amount / selectedMembers.length).toFixed(2) : 0;

      setSplits((prevSplits) =>
        prevSplits.map((split) =>
          selectedMembers.includes(split.userId)
            ? { ...split, amount: equalShare }
            : { ...split, amount: "" }
        )
      );
    }
  };

  const handleSplitChange = (index, value) => {
    const newSplits = [...splits]
    newSplits[index].amount = value
    setSplits(newSplits)
  }

  const handleEqualSplit = () => {
    if (!isSplitEqual) {
      // ✅ Apply equal split
      const amount = Number.parseFloat(formData.amount) || 0;
      const allUserIds = splits.map((split) => split.userId);
      setSelectedMembers(allUserIds);

      const splitAmount = (amount / allUserIds.length).toFixed(2);

      const newSplits = splits.map((split) => ({
        ...split,
        amount: splitAmount,
      }));

      setSplits(newSplits);
    } else {
      // ❌ Clear split
      setSelectedMembers([]);
      const clearedSplits = splits.map((split) => ({
        ...split,
        amount: "",
      }));
      setSplits(clearedSplits);
    }

    setIsSplitEqual(!isSplitEqual); // toggle
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
    setFormData({
      ...formData,
      receipt: file,
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
    }

    const totalSplit = splits
      .filter((split) => selectedMembers.includes(split.userId)) // ✅ only selected members
      .reduce((sum, split) => sum + (Number.parseFloat(split.amount) || 0), 0);

    const amount = Number.parseFloat(formData.amount) || 0

    if (Math.abs(totalSplit - amount) > 0.1) {
      newErrors.splits = "Split amounts must equal total amount"
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

      const expenseData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
        splits: splits
          .filter((split) => selectedMembers.includes(split.userId))
          .map((split) => ({
            ...split,
            amount: Number.parseFloat(split.amount),
          })),
        paidBy: "You",
      }

      onSubmit(expenseData)

      // Reset form
      setFormData({
        description: "",
        amount: "",
        category: "Other",
        receipt: null,
      })
      setSplits(splits.map((split) => ({ ...split, amount: "" })))
      setErrors({})
    } catch (error) {
      setErrors({ general: "Failed to add expense" })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      description: "",
      amount: "",
      category: "Other",
      receipt: null,
    })
    setSplits(splits.map((split) => ({ ...split, amount: "" })))
    setErrors({})
    setIsEditing(false);
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Expense" size="large">
      <form onSubmit={handleSubmit}>
        {errors.general && <div className="error-banner">{errors.general}</div>}

        <div className="form-row">
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="What was this expense for?"
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
            <label className="input-label">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="input">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <input
            type="file"
            id="receipt"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="receipt" className="btn btn-medium btn-secondary">
            📎 Choose File
          </label>
        </div>
        {selectedFile ? (
          <p style={{ marginTop: "8px", fontSize: "0.85rem" }}>
            Selected: {selectedFile.name}
          </p>
        ) : isEditing && existingReceiptUrl ? (
          <p style={{ marginTop: "8px", fontSize: "0.85rem" }}>
            Existing file:{" "}
            <a
              href={`${API_URL}/${existingReceiptUrl.replace(/\\/g, "/")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              View Receipt
            </a>
          </p>
        ) : null}

        <div className="splits-section">
          <div className="splits-header">
            <h4>Split Details</h4>
            <Button type="button" variant="secondary" size="small" onClick={handleEqualSplit}>
              {isSplitEqual ? "Clear Split" : "Split Equally"}
            </Button>
          </div>

          {errors.splits && <div className="error-message">{errors.splits}</div>}

          {splits.map((split, index) => (
            <div key={split.userId} className="split-row">
              <input
                type="checkbox"
                style={{ cursor: "pointer" }}
                checked={selectedMembers.includes(split.userId)}
                onChange={() => handleCheckboxChange(split.userId)}
                className="split-checkbox"
              />
              <span className="split-name">{split.name}</span>
              <input
                type="number"
                step="0.01"
                value={split.amount}
                onChange={(e) => handleSplitChange(index, e.target.value)}
                className="split-input"
                placeholder="0.00"
                disabled={!selectedMembers.includes(split.userId)}
              />
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Edit Expense" : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddExpenseModal
