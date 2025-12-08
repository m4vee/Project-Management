import React, { useState } from "react";
import "./SwapRequests.css";
import AppNavbar from "../AppNavbar";
import { useNavigate } from "react-router-dom";
import { useSwapRequests } from "./SwapRequestContext";

const SwapRequests = () => {
  const { swapRequests, updateSwapRequest } = useSwapRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("incoming"); // Changed to 'incoming'/'outgoing' for clarity

  // Get current user ID from storage (Saved during login)
  const currentUserId = parseInt(localStorage.getItem("user_id"));

  // Helper: Filter requests
  // "Incoming" = Requests sent TO me (I am the owner/receiver)
  // "Outgoing" = Requests I sent (I am the requester)
  // Note: Your backend logic needs to return *all* requests involving the user for this to work fully.
  // Assuming 'swapRequests' contains mixed data, we filter here.
  
  const incomingRequests = swapRequests.filter(
    (req) => req.receiver_id === currentUserId || req.product_owner_id === currentUserId // Adjust based on DB column name
  );

  const outgoingRequests = swapRequests.filter(
    (req) => req.requester_id === currentUserId
  );

  const handleAction = async (swapId, action) => {
    await updateSwapRequest(swapId, action);
    alert(`Swap request ${action}!`);
  };

  const renderRequests = (requests, isOutgoing) => {
    if (!requests || requests.length === 0) {
      return (
        <div className="no-requests">
            <i className="fa-solid fa-box-open" style={{fontSize: '3rem', color: '#ccc', marginBottom: '10px'}}></i>
            <p>No {isOutgoing ? "outgoing" : "incoming"} swap requests found.</p>
        </div>
      );
    }

    return requests.map((req) => (
      <div key={req.id} className="swap-card">
        <div className="swap-header">
           <span className={`status-badge ${req.status}`}>{req.status}</span>
           <span className="swap-date">{new Date(req.created_at).toLocaleDateString()}</span>
        </div>

        <div className="swap-body">
            {/* Left: What THEY want (My Item) */}
            <div className="swap-item">
                <p className="label">Requesting Your:</p>
                <h4>{req.product_name}</h4>
                {/* <img src={req.product_image} alt="My Item" /> */}
            </div>

            <div className="swap-icon">
                <i className="fa-solid fa-arrow-right-arrow-left"></i>
            </div>

            {/* Right: What THEY offer */}
            <div className="swap-item">
                <p className="label">Offering:</p>
                <h4>{req.offer_description}</h4>
                <p className="user-info">by User #{req.requester_id}</p> 
            </div>
        </div>

        {/* Actions for INCOMING requests (I am the owner) */}
        {!isOutgoing && req.status === "pending" && (
          <div className="swap-actions">
            <button
              className="swap-accept-btn"
              onClick={() => handleAction(req.id, "accepted")}
            >
              <i className="fa-solid fa-check"></i> Accept
            </button>
            <button
              className="swap-decline-btn"
              onClick={() => handleAction(req.id, "rejected")}
            >
              <i className="fa-solid fa-xmark"></i> Decline
            </button>
          </div>
        )}

        {/* Actions for OUTGOING requests (I am the requester) */}
        {isOutgoing && req.status === "pending" && (
          <div className="swap-actions">
            <button
              className="swap-cancel-btn"
              onClick={() => handleAction(req.id, "cancelled")}
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Completed State */}
        {!isOutgoing && req.status === "accepted" && (
          <div className="swap-actions">
            <button
              className="swap-done-btn"
              onClick={() => handleAction(req.id, "completed")}
            >
              Mark as Completed
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="swap-requests-wrapper">
      <AppNavbar />

      <button
        className="swap-floating-home-btn"
        onClick={() => navigate("/inside-app")}
      >
        <i className="fa-solid fa-house"></i>
      </button>

      <div className="swap-requests-page">
        <div className="page-header">
             <h2>Swap Inventory</h2>
             <p>Manage your item exchanges</p>
        </div>

        <div className="swap-tabs-wrapper">
          <div className="swap-tabs">
            <button
              className={activeTab === "incoming" ? "active" : ""}
              onClick={() => setActiveTab("incoming")}
            >
              Offers Received
            </button>

            <button
              className={activeTab === "outgoing" ? "active" : ""}
              onClick={() => setActiveTab("outgoing")}
            >
              My Requests
            </button>
          </div>
        </div>

        <div className="swap-request-container">
          {activeTab === "incoming"
            ? renderRequests(incomingRequests, false)
            : renderRequests(outgoingRequests, true)}
        </div>
      </div>
    </div>
  );
};

export default SwapRequests;