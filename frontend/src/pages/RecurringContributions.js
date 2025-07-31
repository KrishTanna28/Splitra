"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Card from "../components/Card"
import Button from "../components/Button"
import AddRecurringModal from "../modals/AddRecurringModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "../components/NotificationModal"
import { useAuth } from "../context/AuthContext"
import "../styles/recurring-contributions.css"
import LoadingModal from "../components/LoadingModal"
import { useApp } from "../context/AppContext"

const RecurringContributions = () => {
    const [recurringContributions, setRecurringContributions] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingContribution, setEditingContribution] = useState(null)
    const { groups, setGroups } = useApp()
    const [addingRecurring, setAddingRecurring] = useState(false)
    const [editRecurring, setEditRecurring] = useState(false)
    const [deleteRecurring, setDeleteRecurring] = useState(false)
    const [errors, setErrors] = useState({})
    const { token } = useAuth()
    const navigate = useNavigate()
    const { notification, hideNotification, showSuccess, showConfirm, showError } = useNotification()
    const API_URL = process.env.API_URL

    const fetchGroups = async () => {
        setErrors({})
        try {
            const response = await fetch(`${API_URL}/groups/my-groups`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json();

            if (response.ok) {
                setGroups(data.groups)
            }
        } catch (error) {
            setErrors({ general: "Unable to fetch groups" })
        }
    }

    useEffect(() => {
        fetchGroups();
    }, [token]);

    useEffect(() => {
        fetchActiveRecurrinContributions()
    }, [recurringContributions.length])

    const fetchActiveRecurrinContributions = async () => {
        try {
            const response = await fetch(`${API_URL}/settlements/my-recurring`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                const normalized = (data.contributions || []).map((c) => ({
                    id: c.id,
                    description: c.description,
                    startDate: c.start_date,
                    isActive: c.active,
                    amount: parseFloat(c.amount),
                    category: c.category,
                    groupId: c.group_id,
                    contributorName: c.contributor_name,
                    groupName: c.group_name,
                    participants: c.participants || [],
                    nextDate: c.next_date,
                    frequency: c.frequency
                }));

                setRecurringContributions(normalized);
            }
        } catch (error) {
            setErrors({ general: "Unable to fetch active contributions" });
        }
    };

    const handleAddContribution = async (contributionData) => {
        setAddingRecurring(true)
        try {
            const response = await fetch(`${API_URL}/settlements/recurring`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(contributionData),
                credentials: "include"
            })

            const data = await response.json()

            if (!response.ok) {
                setAddingRecurring(false)
                setShowAddModal(false)
                showError(data.message)
            } else {
                setTimeout(() => {
                    setAddingRecurring(false)
                    setShowAddModal(false)
                    showSuccess(data.message || "Recurring contribution addedd successfully")
                }, 1500)
            }

            await fetchActiveRecurrinContributions()

        } catch (error) {
            setErrors("Unable to send add recurring contribution")
        }
    }

    const handleEditContribution = async (editData) => {
        setEditRecurring(true)
        try {
            const response = await fetch(`${API_URL}/settlements/update-recurring/${editData.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData),
                credentials: "include"
            })

            const data = await response.json()

            if (!response.ok) {
                setEditRecurring(false)
                setShowAddModal(false)
                showError(data.message)
            } else {
                setTimeout(() => {
                    setEditRecurring(false)
                    setShowAddModal(false)
                    showSuccess(data.message || "Recurring contribution addedd successfully")
                }, 1500)
            }

            await fetchActiveRecurrinContributions()

        } catch (error) {
            setErrors("Unable to send add recurring contribution")
        }
    }

    const handleToggleActive = (id) => {
        const contribution = recurringContributions.find((c) => c.id === id);
        const action = contribution.isActive ? "pause" : "resume";

        showConfirm(
            `Are you sure you want to ${action} "${contribution.description}"?`,
            async () => {
                try {
                    const response = await fetch(`${API_URL}/settlements/update-recurring/${id}`, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            active: !contribution.isActive,
                        }),
                        credentials: "include",
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setRecurringContributions(
                            recurringContributions.map((c) =>
                                c.id === id ? { ...c, isActive: !c.isActive } : c
                            )
                        );
                        showSuccess(
                            `Recurring contribution ${action === "pause" ? "paused" : "resumed"} successfully!`,
                            "Success"
                        );
                    } else {
                        showError(data.message || "Failed to update contribution");
                    }
                } catch (error) {
                    setErrors("Unable to toggle");
                }
            },
            `${action.charAt(0).toUpperCase() + action.slice(1)} Contribution`
        );
    };

    const handleDeleteContribution = async (id) => {
        const contribution = recurringContributions.find((c) => c.id === id);
        showConfirm(
            `Are you sure you want to delete "${contribution.description}"? This action cannot be undone.`,
            async () => {
                setDeleteRecurring(true)
                try {
                    const response = await fetch(`${API_URL}/settlements/delete-recurring/${id}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        credentials: "include",
                    });

                    const data = await response.json();

                    if (response.ok) {
                        setRecurringContributions(prev =>
                            prev.filter((contribution) => contribution.id !== id)
                        );
                        setTimeout(()=>{
                            setDeleteRecurring(false)
                            showSuccess("Recurring contribution deleted successfully!", "Success");
                        },1500)
                    } else {
                        setErrors(data.message || "Unable to delete contribution");
                    }
                } catch (error) {
                    setErrors("Unable to delete contribution");
                }
            },
            "Delete Contribution"
        );
    };


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            quarterly: "Quarterly",
            yearly: "Yearly",
        }
        return labels[frequency] || frequency
    }

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

    const getDaysUntilNext = (dateString) => {
        const nextDate = new Date(dateString)
        const today = new Date()
        const diffTime = nextDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const activeContributions = recurringContributions.filter((c) => c.isActive)
    const pausedContributions = recurringContributions.filter((c) => !c.isActive)

    const getMonthlyEquivalent = (contribution) => {
        switch (contribution.frequency?.toLowerCase()) {
            case "daily": {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                return contribution.amount * daysInMonth;
            }
            case "weekly":
                return contribution.amount * 4.33;
            case "quarterly":
                return contribution.amount / 3;
            case "yearly":
                return contribution.amount / 12;
            case "monthly":
                return contribution.amount;
            default:
                return 0;
        }
    };

    const monthlyTotal = activeContributions.reduce((sum, contribution) => {
        return sum + getMonthlyEquivalent(contribution);
    }, 0);

    return (
        <div className="recurring-contributions">
            <Navbar title="Recurring Contributions" />

            <div className="recurring-content">
                <div className="page-header">
                    <div>
                        <h2>Recurring Contributions</h2>
                        <p>Manage your automatic recurring expenses</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                            ← Back to Dashboard
                        </Button>
                        {recurringContributions.length > 0 && <Button onClick={() => setShowAddModal(true)}>Add Recurring</Button>}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="summary-cards">
                    <Card className="summary-card">
                        <div className="summary-icon">📊</div>
                        <div className="summary-info">
                            <h3>{activeContributions.length}</h3>
                            <p>Active Contributions</p>
                        </div>
                    </Card>
                    <Card className="summary-card">
                        <div className="summary-icon">💰</div>
                        <div className="summary-info">
                            <h3>{formatCurrency(monthlyTotal)}</h3>
                            <p>Monthly Total</p>
                        </div>
                    </Card>
                    <Card className="summary-card">
                        <div className="summary-icon">⏰</div>
                        <div className="summary-info">
                            <h3>{activeContributions.filter((c) => getDaysUntilNext(c.nextDate) <= 7).length}</h3>
                            <p>Due This Week</p>
                        </div>
                    </Card>
                </div>

                {/* Active Contributions */}
                <div className="contributions-section">
                    <h3>Active Contributions</h3>
                    <div className="contributions-grid">
                        {Array.isArray(activeContributions) && activeContributions.map((contribution) => (
                            <Card key={contribution.id} className="contribution-card active">
                                <div className="contribution-header">
                                    <div className="contribution-category">
                                        <span className="category-icon">{getCategoryIcon(contribution.category)}</span>
                                        <span className="category-name">{contribution.category}</span>
                                    </div>
                                    <div className="contribution-status active">Active</div>
                                </div>

                                <div className="contribution-main">
                                    <h4 className="contribution-title">{contribution.description}</h4>
                                    <div className="contribution-amount">{formatCurrency(contribution.amount)}</div>
                                </div>

                                <div className="contribution-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Frequency:</span>
                                        <span className="detail-value">{getFrequencyLabel(contribution.frequency)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Next Date:</span>
                                        <span className="detail-value">
                                            {formatDate(contribution.nextDate)}
                                            <span className="days-until">
                                                ({getDaysUntilNext(contribution.nextDate)}{" "}
                                                {getDaysUntilNext(contribution.nextDate) > 1 ? "days" : "day"})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Group:</span>
                                        <span className="detail-value">{contribution.groupName}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Participants:</span>
                                        <span className="detail-value">{contribution.participants.length} members</span>
                                    </div>
                                </div>

                                <div className="contribution-actions">
                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={() => {
                                            setEditingContribution(contribution)
                                            setShowAddModal(true)
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button variant="secondary" size="small" onClick={() => handleToggleActive(contribution.id)}>
                                        Pause
                                    </Button>
                                    <Button variant="danger" size="small" onClick={() => handleDeleteContribution(contribution.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {activeContributions.length === 0 && (
                        <div className="empty-state">
                            <h4>No active recurring contributions</h4>
                            <p>Create your first recurring contribution to automate regular expenses</p>
                            <Button onClick={() => setShowAddModal(true)}>Add Your First Recurring</Button>
                        </div>
                    )}
                </div>

                {/* Paused Contributions */}
                {pausedContributions.length > 0 && (
                    <div className="contributions-section">
                        <h3>Paused Contributions</h3>
                        <div className="contributions-grid">
                            {Array.isArray(pausedContributions) && pausedContributions.map((contribution) => (
                                <Card key={contribution.id} className="contribution-card paused">
                                    <div className="contribution-header">
                                        <div className="contribution-category">
                                            <span className="category-icon">{getCategoryIcon(contribution.category)}</span>
                                            <span className="category-name">{contribution.category}</span>
                                        </div>
                                        <div className="contribution-status paused">Paused</div>
                                    </div>

                                    <div className="contribution-main">
                                        <h4 className="contribution-title">{contribution.description}</h4>
                                        <div className="contribution-amount">{formatCurrency(contribution.amount)}</div>
                                    </div>

                                    <div className="contribution-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Frequency:</span>
                                            <span className="detail-value">{getFrequencyLabel(contribution.frequency)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Group:</span>
                                            <span className="detail-value">{contribution.groupName}</span>
                                        </div>
                                    </div>

                                    <div className="contribution-actions">
                                        <Button
                                            variant="secondary"
                                            size="small"
                                            onClick={() => {
                                                setEditingContribution(contribution)
                                                setShowAddModal(true)
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button variant="secondary" size="small" onClick={() => handleToggleActive(contribution.id)}>
                                            Resume
                                        </Button>
                                        <Button variant="danger" size="small" onClick={() => handleDeleteContribution(contribution.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AddRecurringModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false)
                    setEditingContribution(null)
                }}
                onSubmit={editingContribution ? handleEditContribution : handleAddContribution}
                editData={editingContribution}
                groups={groups}
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
            <LoadingModal
                isOpen={addingRecurring}
                message="Creating Expense..."
                submessage="Please wait while we update the recurring contributions"
                type="bars"
            />
            <LoadingModal
                isOpen={editRecurring}
                message="Updating Expense..."
                submessage="Please wait while we update the recurring contributions"
                type="bars"
            />
            <LoadingModal
                isOpen={deleteRecurring}
                message="Deleting Expense..."
                submessage="Please wait while we update the recurring contributions"
                type="bars"
            />
        </div>
    )
}

export default RecurringContributions
