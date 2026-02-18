"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Card from "../components/Card"
import Button from "../components/Button"
import CreateGroupModal from "../modals/CreateGroupModal"
import { useApp } from "../context/AppContext"
import "../styles/dashboard.css"
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingModal from "../components/LoadingModal"


const Dashboard = () => {
  const { token } = useAuth()
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const { groups, setGroups } = useApp()
  const [groupCount, setGroupCount] = useState({});
  const [totalGroupExpenses, setTotalGroupExpenses] = useState({});
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({})
  const [creatingGroup, setCreatingGroup] = useState(false);
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

  useState(()=>{
    if(!token){
      navigate("/")
    }
  }, [token, navigate])

  const fetchGroupMemberCount = async (groupId) => {
    setErrors({})
    try {
      const response = await fetch(`${REACT_APP_API_URL}/groups/${groupId}/member-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();

      if (response.ok) {
        setGroupCount(prev => ({
          ...prev,
          [groupId]: data.member_count
        }));
      }
    } catch (error) {
      setErrors({ general: `Unable to fetch member count for group ${groupId}` })
    }
  }

  const fetchTotalExpenses = async (groupId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/expenses/${groupId}/total-expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();

      if (response.ok) {
        const total = data?.total_expenses ?? 0;
        setTotalGroupExpenses((prev) => ({
          ...prev,
          [groupId]: total,
        }));
      }

    } catch (error) {
      setErrors({ general: `Unable to fetch total expenses for group ${groupId}` })
    }
  }

  const fetchBalances = async (groupId) => {
    try {
      const response = await fetch(`${REACT_APP_API_URL}/balances/${groupId}/my-balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();

      if (response.ok) {
        setBalance(prev => ({
          ...prev,
          [groupId]: data.finalBalance
        }));
      }
    } catch (error) {
      setErrors({ general: `Unable to fetch balances for group ${groupId}` })
    }
  }

  const fetchGroups = async () => {
    setErrors({})
    try {
      const response = await fetch(`${REACT_APP_API_URL}/groups/my-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json();

      if (response.ok) {
        setGroups(data.groups)
        data.groups.forEach(group => {
          fetchGroupMemberCount(group.id);
          fetchTotalExpenses(group.id);
          fetchBalances(group.id);
        });
      }
    } catch (error) {
      setErrors({ general: "Unable to fetch groups" })
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);


  if (loading) return <LoadingModal
    isOpen={loading}
    message="Signing you in..."
    submessage="Please wait while we verify your credentials"
    type="pulse"
  />

  const handleCreateGroup = async (groupData) => {
    setCreatingGroup(true);

    try {
      const response = await fetch(`${REACT_APP_API_URL}/groups/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: groupData.name,
          description: groupData.description
        }),
        credentials: "include"
      })

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || "Failed to create group");
      }else{
        setTimeout(() => {
        setCreatingGroup(false);
      }, 1500); 
      }
      await fetchGroups();

      setShowCreateGroup(false)
    } catch (error) {
      setErrors({ general: "Unable to create a new group" })
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <div className="dashboard">
      <Navbar title="Splitra" />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h2>Your Groups</h2>
            <p>Manage your shared expenses</p>
          </div>
          <div><Button variant="secondary" onClick={() => navigate("/recurring")}>
              Recurring Contributions
            </Button>
            &nbsp;&nbsp;
            {Array.isArray(groups) && groups.length > 0 && (<Button onClick={() => setShowCreateGroup(true)}>Create Group</Button>)}
            </div>
        </div>

        <div className="groups-grid">
          {Array.isArray(groups) && groups.map((group) => (
            <Card key={group.id} hover onClick={() => navigate(`/group/${group.id}`)}>
              <div className="group-card">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  <span className="members-count">
                    {groupCount[group.id] ?? 0} {groupCount[group.id] === 1 ? "member" : "members"}
                  </span>
                </div>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <div className="stat">
                    <span className="stat-label">Total Expenses</span>
                    <span className="stat-value">{formatCurrency(totalGroupExpenses[group.id] ?? 0)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Your Balance</span>
                    <span
                      className={`stat-value ${(balance[group.id] ?? 0) > 0
                        ? "positive"
                        : (balance[group.id] ?? 0) < 0
                          ? "negative"
                          : ""
                        }`}
                    >
                      {formatCurrency(balance[group.id] ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="empty-state">
            <h3>No groups yet</h3>
            <p>Create your first group to start splitting expenses</p>
            <Button onClick={() => setShowCreateGroup(true)}>Create Your First Group</Button>
          </div>
        )}
      </div>

      {errors.general && <div className="error-banner">{errors.general}</div>}

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={handleCreateGroup}
      />
      <LoadingModal
        isOpen={creatingGroup}
        message="Creating Group..."
        submessage="Please wait while we update your dashboard"
        type="dots"
      />
    </div>
  )
}

export default Dashboard
