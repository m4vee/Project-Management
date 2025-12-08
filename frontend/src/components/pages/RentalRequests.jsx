import React, { useState, useEffect } from "react";
import AppNavbar from "../AppNavbar";
import { useNavigate } from "react-router-dom";
import { useRentalRequests } from "./RentalRequestContext";
import "./RentalRequests.css";

const RentalRequests = () => {
  const { renterRequests, updateRequestAPI } = useRentalRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("renter"); // 'renter' (My Requests) vs 'rentee' (Requests received)

  // Get current user ID
  const currentUserId = parseInt(localStorage.getItem("user_id"));

  // Helper: Filter requests
  // "Renter" = Requests I made (I am the renter)
  // "Rentee" = Requests made to me (I am the product owner/rentee)
  // Note: Backend currently returns "received" requests mostly. 
  // You might need a separate endpoint for "sent" requests or filter client-side if all are returned.
  
  const myRequests = renterRequests.filter(
    (req) => req.renter_id === currentUserId
  );

  const receivedRequests = renterRequests.filter(
    (req) => req.owner_id === currentUserId || req.seller_id === currentUserId // Adjust based on your API response field
  );
  
  // Fallback: If backend returns all requests in one list, use that.
  // If backend only returns one type based on endpoint, use 'renterRequests' directly for now.
  const displayRequests = activeTab === "renter" ? myRequests : receivedRequests;

  const handleAction = async (requestId, status) => {
    await updateRequestAPI(requestId, status);
    alert(`Rental request ${status}!`);
  };

  const getStatusClass = (status) => {
      if (!status) return "";
      return status.toLowerCase();
  };

  const renderRequests = (requests, isReceived) => {
    if (!requests || requests.length === 0) {
      return (
        <div className="no-requests">
          <i className="fa-solid fa-box-open" style={{fontSize: '3rem', color: '#ccc', marginBottom: '10px'}}></i>
          <p>No rental requests found.</p>
        </div>
      );
    }

    return requests.map((req) => (
      <div key={req.id} className="request-card">
        <div className="request-info">
          <p><strong>Product:</strong> {req.product_name}</p>
          <p><strong>Renter:</strong> {req.renter_name || "User #" + req.renter_id}</p>
          
          {/* Display dates if available */}
          {req.rent_start && (
              <p>
                <strong>Period:</strong> {new Date(req.rent_start).toLocaleDateString()} - {new Date(req.rent_end).toLocaleDateString()}
              </p>
          )}
        </div>

        <div className="request-card-header">
            <span className={`request-status ${getStatusClass(req.status)}`}>
                {req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : "Pending"}
            </span>
        </div>

        {/* Actions for Received Requests (I am the owner) */}
        {isReceived && req.status === "pending" && (
          <div className="request-actions">
            <button className="accept-btn" onClick={() => handleAction(req.id, "accepted")}>
                <i className="fa-solid fa-check"></i> Accept
            </button>
            <button className="decline-btn" onClick={() => handleAction(req.id, "declined")}>
                <i className="fa-solid fa-xmark"></i> Decline
            </button>
          </div>
        )}

        {/* Actions for My Requests (I am the renter) */}
        {!isReceived && req.status === "pending" && (
          <div className="request-actions">
            <button className="cancl-btn" onClick={() => handleAction(req.id, "cancelled")}>
              Cancel Request
            </button>
          </div>
        )}

        {/* Completed State */}
        {isReceived && req.status === "accepted" && (
          <div className="request-actions">
            <button className="done-btn" onClick={() => handleAction(req.id, "completed")}>
              Mark as Returned
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="rental-requests-wrapper">
      <AppNavbar />
      
      <button
          className="floating-home-btn" onClick={() => navigate("/inside-app")}>
          <i className="fa-solid fa-house"></i> 
      </button>

      <div className="rental-requests-page scroll-box">
        <div className="page-header" style={{textAlign: 'center', marginBottom: '20px'}}>
             <h2 style={{color: '#8B0000'}}>Rentals Inventory</h2>
        </div>

        <div className="tabs-wrapper">
            <div className="tabs">
            <button
                className={activeTab === "renter" ? "active" : ""}
                onClick={() => setActiveTab("renter")}
            >
                My Rental Requests
            </button>

            <button
                className={activeTab === "rentee" ? "active" : ""}
                onClick={() => setActiveTab("rentee")}
            >
                Requests Received
            </button>
            </div>
        </div>

        <div className="requests-container">
            {/* If tab is 'rentee' (received), pass true for isReceived */}
            {renderRequests(
                activeTab === "renter" ? myRequests : receivedRequests, 
                activeTab === "rentee"
            )}
        </div>
      </div>
    </div>
  );
};

export default RentalRequests;