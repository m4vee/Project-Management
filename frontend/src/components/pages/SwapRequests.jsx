import React, { useState } from "react";
import "./SwapRequests.css";
import AppNavbar from "../AppNavbar";
import { useNavigate } from "react-router-dom";
import { useSwapRequests } from './SwapRequestContext';

const SwapRequests = () => {
  const { swapRequests, updateSwapRequest } = useSwapRequests();
  const navigate = useNavigate();
  const currentUser = "Krislyn Sayat"; 
  const [activeTab, setActiveTab] = useState("requested");

  const handleAction = (swapId, action) => {
    updateSwapRequest(swapId, action);
  };

  const renderRequests = (requests, isRequestedByMe = false) =>
    requests.length === 0 ? (
      <p>No swap requests found.</p>
    ) : (
      requests.map((req) => (
        <div key={req.swap_id} className="swap-card">
          <div className="swap-request-info">
            <p><strong>Product Requested:</strong> {req.product_requested_name}</p>
            <p><strong>Product Offered:</strong> {req.product_offered_name}</p>
            <p><strong>Requested by:</strong> {req.requester_name}</p>
            <p><strong>Requested to:</strong> {req.receiver_name}</p>
            <p>
               
              <span className={`swap-request-status ${req.status}`}>
                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
              </span>
            </p>
          </div>

          <div className="swap-actions">
            {isRequestedByMe && req.status === "pending" && (
              <button className="swap-cancel-btn" onClick={() => handleAction(req.swap_id, "cancelled")}>Cancel</button>
            )}

            {!isRequestedByMe && req.status === "pending" && (
              <>
                <button className="swap-accept-btn" onClick={() => handleAction(req.swap_id, "accepted")}>Accept</button>
                <button className="swap-decline-btn" onClick={() => handleAction(req.swap_id, "declined")}>Decline</button>
              </>
            )}

            {!isRequestedByMe && req.status === "accepted" && (
              <button className="swap-done-btn" onClick={() => handleAction(req.swap_id, "completed")}>Done</button>
            )}
          </div>
        </div>
      ))
    );

  const myRequestedSwaps = swapRequests.filter(req => req.requester_name === currentUser);
  const myReceivedSwaps = swapRequests.filter(req => req.receiver_name === currentUser);

  return (
    <div className="swap-requests-wrapper">
      <AppNavbar />

      <button className="swap-floating-home-btn" onClick={() => navigate("/inside-app")}>
        <i className="fa-solid fa-house"></i>
      </button>

      <div className="swap-requests-page swap-scroll-box">
        <h2>Swap Inventory</h2>

        <div className="swap-tabs-wrapper">
          <div className="swap-tabs">
            <button 
              className={activeTab === "requested" ? "active" : ""} 
              onClick={() => setActiveTab("requested")}
            >
              My Swap Requests
            </button>

            <button 
              className={activeTab === "received" ? "active" : ""} 
              onClick={() => setActiveTab("received")}
            >
              Swaps Offered to Me
            </button>
          </div>
        </div>

        <div className="swap-request-container">
          {activeTab === "requested"
            ? renderRequests(myRequestedSwaps, true)
            : renderRequests(myReceivedSwaps, false)}
        </div>
      </div>
    </div>
  );
};

export default SwapRequests;
