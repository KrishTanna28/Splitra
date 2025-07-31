"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar"
import GroupInfo from "../components/GroupInfo"
import ExpensesTab from "../components/ExpensesTab"
import BalancesTab from "../components/BalancesTab"
import SettlementsTab from "../components/SettlementsTab"
import ReportsTab from "../components/ReportsTab"
import "../styles/group-page.css"
import Button from "../components/Button";

const GroupPage = () => {
  const { groupId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("info")
  const [groupInfo, setGroupInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const API_URL = process.env.API_URL;
  const [groupMembers, setGroupMembers] = useState([])

  useEffect(() => {
    fetchGroupinfo(groupId);
    fetchGroupMembers(groupId);
  }, [token, groupId, groupMembers]);

  const fetchGroupinfo = async (groupId) => {
    try {
      const response = await fetch(`${API_URL}/groups/my-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();
      if (response.ok) {
        const group = data.groups.find((g) => g.id === Number(groupId))
        setGroupInfo(group);
      } else {
        setErrors("Failed to fetch groups");
      }
    } catch (err) {
      setErrors("Something went wrong.");
    }
  };

  const fetchGroupMembers = async (groupId) => {
    setErrors({})
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();

      if (response.ok) {
        setGroupMembers(data.members);
      }
    } catch (error) {
      setErrors({ general: `Unable to fetch member count for group ${groupId}` })
    }
  }

  const tabs = [
    { id: "info", label: "Group Info", icon: "👥" },
    { id: "expenses", label: "Expenses", icon: "💸" },
    { id: "balances", label: "Balances", icon: "⚖️" },
    { id: "settlements", label: "Settlements", icon: "💳" },
    { id: "reports", label: "Reports", icon: "📊" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return <GroupInfo groupId={groupId} members={groupMembers} onMemberAdded={fetchGroupMembers} />
      case "expenses":
        return <ExpensesTab groupId={groupId} members={groupMembers} />
      case "balances":
        return <BalancesTab groupId={groupId} />
      case "settlements":
        return <SettlementsTab groupId={groupId} members={groupMembers} />
      case "reports":
        return <ReportsTab groupId={groupId} />
      default:
        return <GroupInfo groupId={groupId} members={groupMembers} onMemberAdded={fetchGroupMembers} />
    }
  }

  if (!groupInfo) {
    return <div>
      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button></div>
  }

  return (
    <div className="group-page">
      <Navbar title="Splitra" />

      <div className="group-content">
        <div className="group-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")} aria-label="Back to Dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
              <path d="M32 15H3.41l8.29-8.29-1.41-1.42-10 10a1 1 0 0 0 0 1.41l10 10 1.41-1.41L3.41 17H32z" />
            </svg>
          </button>
          <div><h2>{groupInfo.name}</h2>
            <p>{groupInfo.description ?? ""}</p></div>
          <div></div>
        </div>

        <div className="group-tabs">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  )
}

export default GroupPage
