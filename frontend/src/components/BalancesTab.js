"use client"

import { useState, useEffect } from "react"
import Card from "./Card"
import { useAuth } from "../context/AuthContext"
import Button from "./Button"
import AddSettlementModal from "../modals/AddSettlementModal"
import LoadingModal from "./LoadingModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "./NotificationModal"

const BalancesTab = ({ groupId }) => {
  const [settlements, setSettlements] = useState([])
  const [myBalances, setMyBalances] = useState({})
  const [balances, setBalances] = useState({})
  const [errors, setErrors] = useState({})
  const [showAddSettlement, setShowAddSettlement] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [addingSettlement, setAddingSettlement] = useState(false)
  const [prefilledData, setPrefilledData] = useState({})
  const { notification, hideNotification, showError, showSuccess } = useNotification()
  const API_URL = process.env.API_URL || "http://localhost:5000"
  const { user, token } = useAuth()
  const userId = user?.id

  useEffect(() => {
    fetchBalances(groupId);
    fetchMyBalances(groupId);
  }, [groupId, settlements.length], balances.length)

  const fetchBalances = async (groupId) => {
    try {
      const response = await fetch(`${API_URL}/balances/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setBalances(data.balances || {});
        setSettlements(data.settlements || []);
      }
    } catch (error) {
      setErrors({ general: `Unable to fetch balances for group ${groupId}` });
    }
  };

  const fetchMyBalances = async (groupId) => {
    try {
      const response = await fetch(`${API_URL}/balances/${groupId}/my-balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json();
      if (response.ok) {
        setMyBalances(data || {})
      }
      console.log("Fetched my balances:", data.settlements);
    } catch (error) {
      setErrors({ general: `Unable to fetch your balances for group ${groupId}` })
    }
  }

  const sendReminder = async (settlement) => {
    setSendingReminder(true)
    try {
      const response = await fetch(`${API_URL}/settlements/${groupId}/payment-reminder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: settlement.from.id,
          amount: settlement.amount
        }),
        credentials: "include"
      })

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.message);
        showError("Unable to send email")
      } else {
        setTimeout(() => {
          setSendingReminder(false)
          showSuccess(`Reminder sent successfully to ${settlement.from.name}`)
        }, 1500)
      }
    } catch (error) {
      setErrors({ general: "Unable to send the reminder" })
    }
  }

  const handleAddSettlement = async (prefilledData) => {
    setAddingSettlement(true)
    try{
      const response = await fetch(`${API_URL}/settlements/${groupId}/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paidBy:prefilledData.to,
          paidTo:prefilledData.from,
          amount:prefilledData.amount,
          note:prefilledData.note || ""
        }),
        credentials: "include"
      })

      const data = await response.json()

      if(!response.ok){
        showError(data.message);
      }else{
        setTimeout(()=>{
          setAddingSettlement(false)
          showSuccess(data.message)
        },1500)
      }

      // await fetchSettlements();

    }catch(error){
      showError({general:"Unable to add settlement"})
      setAddingSettlement(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const getBalanceColor = (balance) => {
    if (balance.from.id === userId) return "negative"
    if (balance.to.id === userId) return "positive"
    return "neutral"
  }

  return (
    <div className="balances-tab">
      <div className="tab-header">
        <h3>Balances</h3>
      </div>

      <div className="balances-list">
        {Array.isArray(settlements) && settlements.filter(settlement => settlement.amount !== 0).map((settlement, index) => (
          <Card key={index} className="balance-card">
            <div className={`balance-item ${getBalanceColor(settlement)}`}>
              <div className="balance-info">
                <span className="balance-from">{settlement.from.id === userId ? "You" : settlement.from.name}</span>
                <span className="balance-arrow">{settlement.from.id === userId ? "owe" : "owes"}</span>
                <span className="balance-to">{settlement.to.id === userId ? "You" : settlement.to.name}</span>
              </div>
              <div className="balance-amount-section">
                <div className="balance-amount">{formatCurrency(settlement.amount)}
                  &nbsp;&nbsp;&nbsp;
                  {settlement.from.id === userId ? (
                    <Button
                      variant="secondary"
                      size="small"
                      className="balance-action-btn"
                      onClick={() => {
                        setPrefilledData({
                          from: settlement.from.id,
                          to: settlement.to.id,
                          amount: settlement.amount,
                          note:settlement.note
                        })
                        setShowAddSettlement(true)
                      }
                      }
                    >
                      Pay
                    </Button>
                  ) : settlement.to.id === userId ? (
                    <Button
                      variant="secondary"
                      size="small"
                      className="balance-action-btn"
                      onClick={() => sendReminder(settlement)}
                    >
                      Remind
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>


      {settlements.length === 0 && (
        <div className="empty-state">
          <h4>All settled up!</h4>
          <p>No outstanding balances in this group</p>
        </div>
      )}

      <Card className="balance-summary">
        <h4>Your Summary</h4>
        <div className="summary-item positive">
          <span>You Paid:</span>
          <span>{formatCurrency(myBalances.totalPaid || 0)}</span>
        </div>
        <div className="summary-item negative">
          <span>Your Share:</span>
          <span>{formatCurrency(myBalances.totalOwed || 0)}</span>
        </div>
        <div className={`summary-item ${myBalances.netSettled >= 0 ? "positive" : "negative"}`}>
          <span>Net Settled:</span>
          <span>{formatCurrency(myBalances.netSettled || 0)}</span>
        </div>
        <div className={`summary-item total ${myBalances.finalBalance >= 0 ? "positive" : "negative"}`}>
          <span>Final Balance:</span>
          <span>{formatCurrency(myBalances.finalBalance || 0)}</span>
        </div>
      </Card>
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
      <AddSettlementModal
        isOpen={showAddSettlement}
        onClose={() => {
          setShowAddSettlement(false)
          setPrefilledData(null)
        }}
        onSubmit={() => {
          handleAddSettlement(prefilledData)
          setShowAddSettlement(false)
          setPrefilledData(null)
        }}
        groupId={groupId}
        members={Object.values(balances)}
        prefilledData={prefilledData}
      />

      <LoadingModal isOpen={sendingReminder} message="Sending Reminder..." type="dots" />
      <LoadingModal isOpen={addingSettlement} message="Adding Settlement..." submessage="Please wait while we update your settlements" type="dots" />
    </div>
  )
}

export default BalancesTab
