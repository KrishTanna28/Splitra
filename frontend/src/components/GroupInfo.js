"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import Card from "./Card"
import Button from "./Button"
import AddMemberModal from "../modals/AddMemberModal"
import { useNotification } from "../hooks/useNotification"
import NotificationModal from "./NotificationModal"
import LoadingModal from "../components/LoadingModal"

const GroupInfo = ({ members , onMemberAdded, groupId}) => {
  const [showAddMember, setShowAddMember] = useState(false)
  const { notification, hideNotification, showSuccess, showError, showWarning } = useNotification()
  const [loading, setLoading] = useState(false)
  const [leavingGroup, setLeavingGroup] = useState(false)
  const { token, user } = useAuth()
  const [groupInfo, setGroupInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const API_URL = process.env.API_URL
  const [addingMember, setAddingMember] = useState(false);
  const [groupMembers, setGroupMembers] = useState(members || []);

  useEffect(() => {
    setGroupMembers(members || []);
  }, [members]);

  function getTimeAgo(isoDateString) {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffMs = now - date;
  
    const diffInSeconds = Math.floor(diffMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
  
    if (diffInYears >= 1) {
      return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
    } else if (diffInMonths >= 1) {
      return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
    } else if (diffInWeeks >= 1) {
      return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
    } else if (diffInDays >= 1) {
      return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
    } else if (diffInHours >= 1) {
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    } else if (diffInMinutes >= 1) {
      return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
    } else {
      return "just now";
    }
  }


  const fetchGroupInfo = async (groupId) => {
    setErrors({})
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
        setErrors({general : "Failed to fetch groups"});
      }
    } catch (err) {
      setErrors({general : "Something went wrong."});
    } 
  };

  const handleAddMember = async (memberData) => {
  setAddingMember(true);
  try {
    const response = await fetch(`${API_URL}/groups/${groupId}/add-member`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userEmail: memberData.userEmail }),
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      // Throw error to be caught by modal
      throw new Error(data.message || "Failed to add member");
    }else{
      setTimeout(() => {
      setAddingMember(false);
      showSuccess("Member added successfully")
      }, 1500);
    }
    
    // Success actions
    onMemberAdded?.();
    return true;
  } catch (error) {
    // Rethrow for modal to handle
    throw error;
  } 
};

const handleLeaveGroup = async () => {
  setLeavingGroup(true)
  try{
    const response = await fetch(`${API_URL}/groups/${groupId}/remove-member`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json();

    if(response.ok){
      setTimeout(()=>{
        setLeavingGroup(false)
      },1500)
      navigate('/dashboard')
      showSuccess("Group left successfully")
    }else{
      setLeavingGroup(false)
      showWarning(data.message)
    }
  }catch(error){
    showError("Unable to leave group")
  }
}


  useEffect(() => {
    fetchGroupInfo(groupId);
  }, [token, groupId])

  if (!groupInfo) {
    return <LoadingModal
        isOpen={true}
        message="Fetching Group Info"
        type="pulse"
      />
  }

  return (
    <div className="group-info">
      <Card>
        <div className="group-details">
          <h3>Group Details</h3>
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{groupInfo.name}</span>
          </div>
          {groupInfo.description && <div className="detail-row">
            <span className="label">Description:</span>
            <span className="value">{groupInfo.description}</span>
          </div>}
          <div className="detail-row">
            <span className="label">Created:</span>
            <span className="value">{getTimeAgo(groupInfo.created_at)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="members-section">
          <div className="section-header">
            <h3>Members ({groupMembers.length})</h3> 
            <Button size="small" onClick={() => setShowAddMember(true)}>
              Add Member
            </Button>
          </div>

          <div className="members-list">
            {groupMembers.map((member) => (
  <div key={member.id} className="member-item" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
    <div
      className="member-image-wrapper"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {member.profile_picture ? (<img
        src={`${API_URL}/${member.profile_picture?.replace(/\\/g, "/")}`}
        alt="Profile"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />) : (<div className="member-avatar">{(member.name?.[0] || "") + (member.name?.split(" ")[1]?.[0] || "")}</div>)}
    </div>
    <div className="member-details">
      <span className="member-name" style={{ display: "block", fontWeight: "bold" }}>{member.name}</span>
      <span className="member-email" style={{ fontSize: "0.85em", color: "#666" }}>{member.email}</span>
    </div>
  </div>
))}
          </div>
          <br></br>
          <Button variant="danger" size="small" onClick={() => handleLeaveGroup()}>Leave Group</Button>
        </div>
      </Card>

      <AddMemberModal isOpen={showAddMember} onClose={() => setShowAddMember(false)} onSubmit={handleAddMember} error={errors} />
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
        isOpen={addingMember}
        message="Adding Member..."
        submessage="Please wait while we add the member to the group"
        type="pulse"
      />
      <LoadingModal
        isOpen={leavingGroup}
        message="Leaving Group..."
        type="pulse"
      />
    </div>
  )
}

export default GroupInfo
