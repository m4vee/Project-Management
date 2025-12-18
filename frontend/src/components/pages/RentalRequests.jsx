import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// FIX: Gumamit tayo ng direct fetch para hindi na kailangan ng Context provider
import { fetchRentalRequests, updateRentalStatus } from "../../services/api"; 
import RatingModal from "../../components/RatingModal"; 
import "../../components/RatingModal.css"; 
import "./RentalRequests.css";

const BACKEND_URL = "http://127.0.0.1:5000";

const RentalRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]); // Local state for requests
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("renter");

    const storedId = localStorage.getItem("user_id");
    const currentUserId = storedId ? parseInt(storedId, 10) : null;

    // STATES FOR RATING MODAL
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingModalData, setRatingModalData] = useState(null);

    useEffect(() => {
        if (!currentUserId) {
            navigate("/");
            return;
        }
        loadData();
    }, [currentUserId, navigate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchRentalRequests(currentUserId);
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load rentals:", error);
        } finally {
            setLoading(false);
        }
    };

    const myRequests = requests.filter(
        (req) => parseInt(req.renter_id) === currentUserId
    );

    const receivedRequests = requests.filter(
        (req) => parseInt(req.owner_id) === currentUserId
    );

    const displayRequests = activeTab === "renter" ? myRequests : receivedRequests;

    // --- HELPER FUNCTIONS ---

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        }) + ', ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatAvailability = (avail) => {
        if (!avail) return "Any Day";
        return avail.replace(/,/g, ", ");
    };
    
    const getStatusClass = (status) => {
        if (!status) return "";
        // Visual tweak: If status is 'completed', display as 'returned' style if you prefer
        return status.toLowerCase();
    };

    // Helper to display 'Returned' instead of 'Completed' in the UI Badge
    const getDisplayStatus = (status) => {
        if (status === 'completed') return 'RETURNED';
        return status ? status.toUpperCase() : 'PENDING';
    };

const calculateTotal = (req) => {
    const pricePerDay = Number(req.price_per_day || req.price || req.product_price);

    if (!req.rent_start || !req.rent_end || !pricePerDay) return "0.00";

    const start = new Date(req.rent_start);
    const end = new Date(req.rent_end);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const days = Math.max(diffDays, 1);
    const total = days * pricePerDay;

    return total.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

    // --- ACTIONS ---

    const handleAction = async (req, status, reason = null) => {
        if (status === 'cancelled' && !window.confirm("Are you sure you want to cancel?")) return;
        if (status === 'completed' && !window.confirm("Confirm that the item has been returned?")) return;

        try {
            // NOTE: We send 'completed' to backend to signify "Returned"
            const response = await updateRentalStatus(req.id, status, currentUserId, reason);
            
            // RATING TRIGGER
            if (response.should_rate && status === 'completed') {
                const isOwner = parseInt(req.owner_id) === currentUserId;
                const partnerName = isOwner ? req.renter_name : req.owner_name;

                setRatingModalData({
                    rater_id: response.rater_id,
                    rate_target_id: response.rate_target_id,
                    rate_type: response.rate_type, 
                    rate_trans_id: response.rate_trans_id,
                    target_name: partnerName 
                });
                setIsRatingModalOpen(true);
            } else {
                // Optional success message
                if(status === 'completed') alert("Item marked as returned.");
            }

            loadData();
            
        } catch (error) {
            console.error(error);
            alert(`Failed to update status: ${error.message}`);
        }
    };
    
    const handleDeclineWithComment = async (req) => {
        const comment = prompt("Reason for declining:");
        if (comment) {
            await handleAction(req, "declined", comment);
        }
    };

    const handleChat = (req, isReceived) => {
        const partnerId = isReceived ? req.renter_id : req.owner_id;
        navigate(`/chat?user=${partnerId}`);
    };

    const handleModalClose = () => {
        setIsRatingModalOpen(false);
        setRatingModalData(null);
        loadData(); 
    };

    // --- RENDER ---

    const renderRequests = (items, isReceived) => {
        if (loading) return <div className="loading-msg">Loading records...</div>;

        if (!items || items.length === 0) {
            return (
                <div className="no-requests">
                    <i className="fa-solid fa-box-open" style={{fontSize: '3rem', color: '#ccc', marginBottom: '10px'}}></i>
                    <p>{isReceived ? "No rental requests received." : "You haven't made any bookings."}</p>
                </div>
            );
        }

        return items.map((req) => (
            <div key={req.id} className="request-card">
                <div className="card-content-wrapper"> 
                    <div className="product-image-thumb-wrapper">
                        <img 
                            src={req.product_image ? `${BACKEND_URL}${req.product_image}` : "/images/placeholder.jpg"} 
                            alt={req.product_name} 
                            className="product-image-thumb"
                            onError={(e) => {e.target.src = "/images/placeholder.jpg"}}
                        />
                    </div>

                    <div className="request-info">
                        <span className={`request-status ${getStatusClass(req.status)}`}>
                            {getDisplayStatus(req.status)}
                        </span>
                        
                        <h4 className="product-title">{req.product_name || "Item"}</h4>
                        
                        <div className="info-group">
                            <div className="info-row">
                                <span className="label">{isReceived ? "Renter:" : "Owner:"}</span>
                                <span className="value">
                                    <strong>
                                    {isReceived 
                                        ? (req.renter_name || `User #${req.renter_id}`) 
                                        : (req.owner_name  || `User #${req.owner_id}`)}
                                    </strong>
                                </span>
                            </div>

                            <div className="info-row">
                                <span className="label">Dates:</span>
                                <span className="value date-range">
                                    {formatDate(req.rent_start)} — {formatDate(req.rent_end)}
                                </span>
                            </div>
                            
                            {req.created_at && (
                                <div className="info-row request-time">
                                    <span className="label">Requested:</span>
                                    <span className="value">{formatDateTime(req.created_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="status-price-area">
                        <span className="total-price-label">Total Cost:</span>
                        <span className="total-price-value">
                            ₱{calculateTotal(req)}
                        </span>
                    </div>
                </div>

                {req.status === 'declined' && req.comment && (
                    <div className="rejection-note">
                        <strong>Reason:</strong> "{req.comment}"
                    </div>
                )}
                
                <div className="request-actions">
                    {/* PENDING REQUESTS */}
                    {isReceived && req.status === "pending" && (
                        <>
                            <button className="accept-btn" onClick={() => handleAction(req, "accepted")}>
                                <i className="fa-solid fa-check"></i> Accept
                            </button>
                            <button className="decline-btn" onClick={() => handleDeclineWithComment(req)}>
                                <i className="fa-solid fa-xmark"></i> Decline
                            </button>
                        </>
                    )}

                    {/* ACTIVE RENTALS (Accepted) */}
                    {isReceived && req.status === "accepted" && (
                        <>
                            <button className="chat-btn" onClick={() => handleChat(req, isReceived)}>
                                <i className="fa-solid fa-comments"></i> Chat
                            </button>
                            {/* MARK AS RETURNED BUTTON */}
                            <button className="done-btn" onClick={() => handleAction(req, "completed")}>
                                <i className="fa-solid fa-box-archive"></i> Mark as Returned
                            </button>
                        </>
                    )}

                    {/* RENTER SIDE ACTIONS */}
                    {!isReceived && req.status === "pending" && (
                        <button className="cancl-btn full-width-btn" onClick={() => handleAction(req, "cancelled")}>
                            Cancel Request
                        </button>
                    )}
                    
                    {!isReceived && (req.status === "accepted" || req.status === "completed") && (
                        <button className="chat-btn full-width-btn" onClick={() => handleChat(req, isReceived)}>
                            <i className="fa-solid fa-comments"></i> Message Owner
                        </button>
                    )}
                </div>
            </div>
        ));
    };

    return (
        <div className="rental-requests-wrapper">
            
            {/* Added Mobile Back Button */}
            <button className="mobile-back-btn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>



            <div className="rental-requests-page">
                <div className="page-header">
                    <div>
                        <h2>Rentals Activity</h2>
                        <p>Manage all item bookings and requests.</p>
                    </div>
                </div>

                <div className="tabs-wrapper">
                    <div className="tabs">
                    <button
                        className={activeTab === "renter" ? "active" : ""}
                        onClick={() => setActiveTab("renter")}
                    >
                        My Bookings
                    </button>

                    <button
                        className={activeTab === "rentee" ? "active" : ""}
                        onClick={() => setActiveTab("rentee")}
                    >
                        Incoming Requests
                    </button>
                    </div>
                </div>

                <div className="requests-container">
                    {renderRequests(displayRequests, activeTab === "rentee")}
                </div>
            </div>
            
            <RatingModal 
                isOpen={isRatingModalOpen}
                ratingData={ratingModalData}
                onClose={handleModalClose}
            />
        </div>
    );
};

export default RentalRequests;