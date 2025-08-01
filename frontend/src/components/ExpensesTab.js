"use client"

import { useState, useEffect, use } from "react"
import Card from "./Card"
import Button from "./Button"
import AddExpenseModal from "../modals/AddExpenseModal"
import ExpenseCommentsModal from "../modals/ExpenseCommentsModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "./NotificationModal"
import { useAuth } from "../context/AuthContext";
import LoadingModal from "../components/LoadingModal"
import { all } from "../../../backend/routes/authRoutes"

const ExpensesTab = ({ groupId, members }) => {
  const [allExpenses, setAllExpenses] = useState([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseShare, setExpenseShare] = useState([])
  const [expenseSharePerUser, setExpenseSharePerUser] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [errors, setErrors] = useState({})
  const [addingExpense, setAddingExpense] = useState(false)
  const [updatingExpense, setUpdatingExpense] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [deletingExpense, setDeletingExpense] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { token, user } = useAuth()
  const userId = user?.id || null
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL

  const { notification, hideNotification, showSuccess, showConfirm, showError } = useNotification()
  useEffect(() => {
    if (Array.isArray(members)) {
      setGroupMembers(members);
    }
  }, [members]);

  const fetchExpenses = async (groupId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${groupId}/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })
      const data = await response.json()
      if (response.ok && Array.isArray(data.expenses)) {
        setAllExpenses(data.expenses);
        data.expenses.forEach((expense) => {
          fetchCommentCounts(expense.id);
          fetchExpenseShare(expense.id);
        });
      } else {
        throw new Error(data.message || "Failed to fetch expenses");
      }

    } catch (error) {
      setErrors({ general: "Failed to fetch expenses. Please try again later." })
    }
  }

  const handleAddExpense = async (expenseData) => {
    setAddingExpense(true)
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(expenseData));


      if (expenseData.receipt) {
        formData.append("receipt", expenseData.receipt);  // assuming file input is `receipt`
      }

      const response = await fetch(`${REACT_APP_API_URL}/expenses/${groupId}/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        await fetchExpenses(groupId)
        setTimeout(() => {
          setAddingExpense(false)
          showSuccess("Expense added successfully!", "Expense Added")
        }, 1500)
        setShowAddExpense(false)
      } else {
        setErrors(data.message || "Failed to add expense")
        setTimeout(() => {
          setAddingExpense(false)
          showError(data.message || "Failed to add expense", "Error")
        }, 1500)
      }

    } catch (error) {
      setErrors({ general: "Failed to add expense. Please try again later." })
      setTimeout(() => {
        setAddingExpense(false)
        showError(error.message, "Error")
      }, 1500)
    }
  }

  const fetchCommentCounts = async (expenseId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/comment-count/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCommentCounts((prev) => ({
          ...prev,
          [data.expenseId]: parseInt(data.commentCount, 10) || 0,
        }));
      } else {
        console.error("Failed to fetch comment count for expense", expenseId);
      }
    } catch (error) {
      setErrors({ general: "Failed to fetch comment counts. Please try again later." });
    };
  }

  const fetchExpenseShare = async (expenseId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${expenseId}/share`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setExpenseShare(prev => ({ ...prev, [expenseId]: data || [] }));
        const userShare = data.share.find((share) => share.user_id === userId);
        const amount = userShare ? parseFloat(userShare.amount) : 0;
        setExpenseSharePerUser((prev) => ({
        ...prev,
        [expenseId]: amount,
      }));
      }
    } catch (error) {
      setErrors({ general: "Failed to fetch expense share. Please try again later." });
    }
  }


  useEffect(() => {
    fetchExpenses(groupId);
  }, [groupId, token, allExpenses.length, commentCounts.length]);

  useEffect(() => {
    fetchCommentCounts(allExpenses.id);
  }, commentCounts)

  const handleDeleteExpense = (expenseId, description) => {
    showConfirm(
      `Are you sure you want to delete "${description}"? This action cannot be undone.`,
      async () => {
        setDeletingExpense(true)
        try {
          const response = await fetch(`${REACT_APP_API_URL}/expenses/${expenseId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            setTimeout(() => {
              setDeletingExpense(false);
              setAllExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
              showSuccess("Expense deleted successfully!", "Expense Deleted");
            }, 1500);
          } else {
            setTimeout(() => {
              setDeletingExpense(false);
              showError(data.message || "Failed to delete expense", "Error");
            }, 1500);
          }
        } catch (error) {
          setTimeout(() => {
            setDeletingExpense(false);
            showError("Failed to delete expense. Please try again later.", "Error");
          }, 1500);
        }
      },
      "Delete Expense"
    );
  };

  const handleEditExpense = async (groupId, updatedExpense) => {
    setSelectedExpense(updatedExpense);
    setUpdatingExpense(true);
    try {

      const formData = new FormData();
      formData.append("data", JSON.stringify(updatedExpense)); // this must exist!

      if (updatedExpense.receipt) {
        formData.append("receipt", updatedExpense.receipt);
      }

      const response = await fetch(`${REACT_APP_API_URL}/expenses/${groupId}/${updatedExpense.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        setTimeout(() => {
          setUpdatingExpense(false);
          showSuccess("Expense updated successfully!", "Expense Updated");
          fetchExpenses(groupId);
        }, 1500);
      } else {
        setErrors(data.message || "Failed to edit expense");
        setTimeout(() => {
          setUpdatingExpense(false);
          showError(data.message || "Failed to edit expense", "Error");
        }, 1500);
      }

    } catch (error) {
      setErrors({ general: "Failed to edit expense. Please try again later." });
      setTimeout(() => {
        setUpdatingExpense(false);
        showError(error.message, "Error");
      }, 1500);
    }
  }


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
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
  };


  const getCategoryIcon = (category) => {
    const icons = {
      Food: "🍽️",
      Transport: "🚗",
      Accommodation: "🏨",
      Entertainment: "🎬",
      Shopping: "🛍️",
      Other: "📝",
    }
    return icons[category] || "📝"
  }

  if (!allExpenses) {
    return <LoadingModal
        isOpen={true}
        message="Fetching Expenses"
        type="pulse"
      />
  }

  return (
    <div className="expenses-tab">
      <div className="tab-header">
        <h3>Expenses</h3>
        <Button onClick={() => setShowAddExpense(true)}>Add Expense</Button>
      </div>

      <div className="expenses-list">
        {Array.isArray(allExpenses) && allExpenses.map((expense) => (
          <Card key={expense.id} className="expense-card">
            <div className="expense-header">
              <div className="expense-info">
                <div className="expense-category">
                  {expense.category && <span className="category-icon">{getCategoryIcon(expense.category)}</span>}
                  <span className="category-name">{expense.category || "Other"}</span>
                </div>
                <h4 className="expense-description">{expense.description}</h4>
                <div className="expense-meta">
                  <span>Paid by {expense.paid_by}</span>
                  <span>•</span>
                  <span>{formatDateTime(expense.created_at)}</span>
                </div>
              </div>
              <div className="expense-amount">{formatCurrency(expense.amount)}</div>
            </div>

            {expense.receipt_url && (
              <a
                href={`${REACT_APP_API_URL}/${expense.receipt_url.replace(/\\/g, "/")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`${REACT_APP_API_URL}/${expense.receipt_url.replace(/\\/g, "/")}`}
                  alt="Receipt"
                  style={{ maxWidth: "100px", borderRadius: "8px", cursor: "zoom-in" }}
                />
              </a>
            )}
            <div className="expense-splits">
              <h5>Your Split:</h5>
              <div className="splits-list">
                <div className="split-item">
                  <span className="split-amount">{formatCurrency(expenseSharePerUser[expense.id])}</span>
                </div>
              </div>
            </div>

            <div className="expense-actions">
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setSelectedExpense(expense)
                  setShowComments(true)
                }}
              >
                💬 Comments ({commentCounts[expense.id] ?? 0})
              </Button>
              {userId === expense.paid_by_id && (<Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowAddExpense(true)
                  setSelectedExpense(expense)
                  setIsEditing(true)
                }}
              >
                Edit
              </Button>)}
              {userId === expense.paid_by_id && (
                <Button variant="danger" size="small" onClick={() => handleDeleteExpense(expense.id)}>
                  Delete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {allExpenses.length === 0 && (
        <div className="empty-state">
          <h4>No expenses yet</h4>
          <p>Add your first expense to get started</p>
        </div>
      )}

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSubmit={(expenseData) => {
          if (isEditing && selectedExpense) {
            handleEditExpense(groupId, {
              ...selectedExpense,
              ...expenseData,
            });
          } else {
            handleAddExpense(expenseData);
          }
          setIsEditing(false);
          setShowAddExpense(false);
          setSelectedExpense(null);
        }}
        groupId={groupId}
        groupMembers={groupMembers}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        selectedExpense={selectedExpense}
        expenseShare={expenseShare}
        existingReceiptUrl={selectedExpense?.receipt_url}
      />

      <ExpenseCommentsModal isOpen={showComments} onClose={() => setShowComments(false)} expense={selectedExpense} commentCounts={commentCounts} />

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
      <LoadingModal isOpen={addingExpense} message="Adding Expense..." type="bars" />
      <LoadingModal isOpen={deletingExpense} message="Deleting Expense..." type="bars" />
      <LoadingModal isOpen={updatingExpense} message="Updating Expense..." type="bars" />
    </div>
  )
}

export default ExpensesTab
