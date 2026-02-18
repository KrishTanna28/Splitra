"use client"

import { useState, useEffect, useCallback } from "react"
import Modal from "../components/Modal"
import Button from "../components/Button"
import { useAuth } from "../context/AuthContext"
import NotificationModal from "../components/NotificationModal"
import { useNotification } from "../hooks/useNotification"
import { Trash2 } from "lucide-react"

const ExpenseCommentsModal = ({ isOpen, onClose, expense, commentCounts }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("")
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL
  const { notification, hideNotification, showError } = useNotification()

  const emojis = ["👍", "👎", "😊", "😢", "😮", "❤️", "🔥", "💯"]

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${expense.id}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setComments(data.comments)
      } else {
        throw new Error(data.message || "Failed to fetch comments")
      }
    } catch (error) {
      showError("Failed to fetch comments. Please try again later.")
    }
  }, [REACT_APP_API_URL, expense?.id, token, showError])

  useEffect(() => {
    fetchComments();
  }, [expense, token, commentCounts, fetchComments])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && !selectedEmoji) return

    setLoading(true)
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${expense.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: newComment,
          emoji: selectedEmoji,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        showError(data.message || "Failed to add comment")
      }
      await fetchComments()
      setNewComment("")
    } catch (error) {
      setErrors({ general: "Failed to add comment. Please try again later." })
    } finally {
      setLoading(false)
    }
  }

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${expense.id}/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.message || "Failed to delete comment")
      }else{
        await fetchComments()
      }
    }catch(error){
      showError("Failed to delete comment. Please try again later.")
    }
  }

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };
    return date.toLocaleString("en-IN", options);
  }

  if (!expense) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comments" size="medium">
      <div className="comments-modal">
        <div className="expense-summary">
          <h4>{expense.description}</h4>
          <p>
            ₹{expense.amount} • {expense.category}
          </p>
        </div>

        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-user">{comment.name}</span>
                <span className="comment-emoji">{comment.emoji}</span>
                <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                 {comment.user_id === user.id && <button
          style={{cursor: "pointer", background: "none", border: "none", color: "red"}}
          onClick={() => deleteComment(comment.id)}
          title="Delete Comment"
        >
          <Trash2 size={14} />
        </button>}
              </div>
              <div className="comment-text">{comment.comment}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="add-comment-form">
          <div className="emoji-picker">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-btn ${selectedEmoji === emoji ? "selected" : ""}`}
                onClick={() =>
                  setSelectedEmoji((prev) => (prev === emoji ? "" : emoji))
                }
              >
                {emoji}
              </button>
            ))}
          </div>


          <div className="comment-input-row">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            />
            <Button type="submit" loading={loading} size="small">
              Post
            </Button>
          </div>
        </form>
      </div>
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
    </Modal>
  )
}

export default ExpenseCommentsModal
