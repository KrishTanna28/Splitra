"use client"

import { useState, useEffect } from "react"
import Card from "./Card"
import Button from "./Button"
import AddSettlementModal from "../modals/AddSettlementModal"
import UPIQRModal from "../modals/UPIQRModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "./NotificationModal"
import { useAuth } from "../context/AuthContext"
import LoadingModal from "./LoadingModal"

const SettlementsTab = ({ groupId, members }) => {
  const [settlements, setSettlements] = useState([])
  const [showAddSettlement, setShowAddSettlement] = useState(false)
  const [addingSettlement, setAddingSettlement] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [ errors, setErrors ] = useState({})
  const { user, token } = useAuth()
  const userName = user?.name || "You"
  const API_URL = process.env.API_URL || "http://localhost:5000"

  const { notification, hideNotification, showError, showSuccess } = useNotification()

  useEffect(() => {
    fetchSettlements()
  }, [groupId])

  const fetchSettlements = async () => {
    try{
      const response = await fetch(`${API_URL}/settlements/${groupId}`,{
        headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if(response.ok){
        setSettlements(data.settlements)
      }
    }catch(error){
      setErrors({general:"Error fetching settlements"})
    }
  }

  const handleAddSettlement = async (settlementData) => {
    setAddingSettlement(true)
    try{
      const response = await fetch(`${API_URL}/settlements/${groupId}/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paidBy:settlementData.to,
          paidTo:settlementData.from,
          amount:settlementData.amount,
          note:settlementData.note || ""
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

      await fetchSettlements();

    }catch(error){
      showError({general:"Unable to add settlement"})
      setAddingSettlement(false)
    }
  }

  // const handleShowQR = (user) => {
  //   setSelectedUser(user)
  //   setShowQR(true)
  // }

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
  }

  const getBalanceColor = (settlement) => {
    if (settlement.fromName === userName) return "negative"
    if (settlement.toName === userName) return "positive"
    return "neutral"
  }

  return (
    <div className="settlements-tab">
      {/* <div className="tab-header">
        <h3>Settlements</h3>
        <Button onClick={() => setShowAddSettlement(true)}>Record Payment</Button>
      </div>

      <div className="quick-actions">
        <Card className="qr-section">
          <h4>Receive Payment</h4>
          <p>Show QR code for others to pay you</p>
          <Button variant="secondary" onClick={() => handleShowQR({ name: "You", upiId: "you@upi" })}>
            Show My QR Code
          </Button>
        </Card>
      </div> */}

      <div className="settlements-list">
        <div style={{display:"flex", justifyContent:"space-between"}}><h3>Recent Settlements</h3><Button onClick={() => setShowAddSettlement(true)}>Record Payment</Button></div>
        <br></br>
        {Array.isArray(settlements) && settlements.map((settlement) => (
          <Card key={settlement.id} className="settlement-card">
            <div className={`balance-item ${getBalanceColor(settlement)}`}>
              <div className="settlement-details">
                <div className="settlement-parties">
                  <span className="from">{settlement.fromName}</span>
                  <span className="arrow">→</span>
                  <span className="to">{settlement.toName}</span>
                </div>
                <div className="settlement-amount">{formatCurrency(settlement.amount)}</div>
              </div>
              <div className="settlement-meta">
                <span className="date">{formatDateTime(settlement.createdAt)}</span>
              </div>
              {settlement.note && <div className="settlement-note">Note: {settlement.note}</div>}
            </div>
          </Card>
        ))}
      </div>

      {settlements.length === 0 && (
        <div className="empty-state">
          <h4>No settlements yet</h4>
          <p>Record payments to keep track of settlements</p>
        </div>
      )}

      <AddSettlementModal
        isOpen={showAddSettlement}
        onClose={() => setShowAddSettlement(false)}
        onSubmit={handleAddSettlement}
        groupId={groupId}
        members={members}
        prefilledData={null}
      />

      <UPIQRModal isOpen={showQR} onClose={() => setShowQR(false)} user={selectedUser} />

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
      <LoadingModal isOpen={addingSettlement} message="Adding Settlement..." submessage="Please wait while we update your settlements" type="dots"/>
    </div>
  )
}

export default SettlementsTab
