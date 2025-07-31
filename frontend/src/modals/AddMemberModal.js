"use client"

import { useState } from "react"
import Modal from "../components/Modal"
import Input from "../components/Input"
import Button from "../components/Button"

const AddMemberModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit({ userEmail: email });
      // Reset and close on success
      setEmail("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Member">
      <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError("") // Clear error when typing
          }}
          error={!!error}
          placeholder="member@example.com"
          required
        />

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <div className="modal-actions mt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddMemberModal