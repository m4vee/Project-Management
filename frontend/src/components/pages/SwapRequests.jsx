import React, { useState, useEffect } from "react";
import "./SwapRequests.css";
import { useNavigate } from "react-router-dom";
import { fetchSwapRequests, updateSwapStatus } from "../../services/api"; 
import { FaTimes } from 'react-icons/fa';
import RatingModal from "../../components/RatingModal"; 
import "../../components/RatingModal.css";

const BACKEND_URL = "http://127.0.0.1:5000"; 

const SwapRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("incoming"); 
    
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [selectedSwapId, setSelectedSwapId] = useState(null);
    const [declineReason, setDeclineReason] = useState("");

    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingModalData, setRatingModalData] = useState(null);

    const storedId = localStorage.getItem("user_id");
    const currentUserId = storedId ? parseInt(storedId, 10) : null; 

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
            const data = await fetchSwapRequests(currentUserId);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadData();
    };

    const submitStatusUpdate = async (swapId, status, reason = null) => {
        try {
            const response = await updateSwapStatus(swapId, status, currentUserId, reason); 
            
            setRequests(prev => prev.map(req => 
                req.id === swapId ? { ...req, status: status, rejection_reason: reason } : req
            ));
            
            if (response.should_rate && response.rate_target_id) {
                const currentSwap = requests.find(r => r.id === swapId);
                let partnerName = "User";
                if(currentSwap) {
                     partnerName = currentUserId === currentSwap.requester_id 
                        ? currentSwap.target_owner_name 
                        : currentSwap.requester_name;
                }

                setRatingModalData({
                    rater_id: response.rater_id,
                    rate_target_id: response.rate_target_id,
                    rate_type: response.rate_type,
                    rate_trans_id: response.rate_trans_id,
                    target_name: partnerName
                });
                setIsRatingModalOpen(true);
            }

            if (status === 'rejected') {
                setShowDeclineModal(false);
                setDeclineReason("");
                setSelectedSwapId(null);
            }

            if (!response.should_rate) {
                 alert(response.message || `Request ${status === 'cancelled' ? 'cancelled' : 'marked as ' + status}.`);
            }
           
        } catch (error) {
            console.error(error);
            alert(`Failed to update status: ${error.message}`);
        }
    };

    const handleAction = async (swapId, status) => {
        if (status === 'cancelled' && !window.confirm("Are you sure you want to cancel?")) return;
        
        if (status === 'completed' && !window.confirm("Confirm that the item exchange is done?")) return;

        if (status === 'rejected') {
            setSelectedSwapId(swapId);
            setShowDeclineModal(true);
            return;
        }

        submitStatusUpdate(swapId, status);
    };

    const handleConfirmDecline = () => {
        if (!declineReason.trim()) {
            alert("Please enter a reason.");
            return;
        }
        submitStatusUpdate(selectedSwapId, 'rejected', declineReason);
    };

    const handleModalClose = () => {
        setIsRatingModalOpen(false);
        setRatingModalData(null);
        loadData();
    };
    
    const formatAvailability = (avail) => {
        if (!avail) return "No specific sched";
        return avail.replace(/,/g, ", ");
    };

    const incomingRequests = requests.filter(req => parseInt(req.target_owner_id) === currentUserId);
    const outgoingRequests = requests.filter(req => parseInt(req.requester_id) === currentUserId);
    
    const extractOfferDetails = (description) => {
        if (!description) return { offer: null, note: null };
        const match = description.match(/^(.*?)\s*\(Note:\s*(.*)\)$/);
        if (match) {
            return {
                offer: match[1].trim(),
                note: match[2].trim(),
            };
        }
        return { offer: description, note: null };
    };

    const renderRequests = (items, isOutgoing) => {
        if (loading) return <div className="loading-msg">Loading requests...</div>;

        if (!items || items.length === 0) {
            return (
                <div className="no-requests">
                    <i className="fa-solid fa-box-open"></i>
                    <p>No {isOutgoing ? "outgoing" : "incoming"} swap requests found.</p>
                </div>
            );
        }

        return items.map((req) => {
            const details = extractOfferDetails(req.offer_description);
            const displayedOfferName = details.offer || req.offered_item_name || "Manual Offer";

            return (
                <div key={req.id} className="swap-card">
                    <div className="swap-header">
                        <span className={`status-badge ${req.status}`}>{req.status.toUpperCase()}</span>
                        <span className="swap-date">
                            <i className="fa-regular fa-clock"></i> 
                            {new Date(req.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="swap-body">
                        <div className="swap-item">
                            <p className="label">{isOutgoing ? "You Want:" : "Requesting Your:"}</p>
                            
                            {req.target_item_image ? (
                                <img 
                                    src={req.target_item_image.startsWith('http') ? req.target_item_image : `${BACKEND_URL}${req.target_item_image}`} 
                                    alt="Target Item" 
                                    className="item-thumb" 
                                    onError={(e) => {e.target.src = "/images/placeholder.jpg"}}
                                />
                            ) : (
                                <div className="item-thumb-placeholder"><i className="fa-solid fa-image"></i></div>
                            )}
                            
                            <h4>{req.target_item_name}</h4>
                            
                            {isOutgoing && (
                                <div className="owner-details">
                                    <p className="user-info">Owner: <strong>{req.target_owner_name}</strong></p>
                                    <p className="availability-info">
                                        <i className="fa-regular fa-calendar"></i> Sched: {formatAvailability(req.target_item_availability)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="swap-icon">
                            <i className="fa-solid fa-arrow-right-arrow-left"></i>
                        </div>

                        <div className="swap-item">
                            <p className="label">{isOutgoing ? "You Offered:" : "Offering:"}</p>
                            
                            {req.offer_image_url ? (
                                <img 
                                    src={`${BACKEND_URL}${req.offer_image_url}`} 
                                    alt="Uploaded Offer" 
                                    className="item-thumb" 
                                    onError={(e) => {e.target.src = "/images/placeholder.jpg"}} 
                                />
                            ) : req.offered_item_image ? (
                                <img 
                                    src={req.offered_item_image.startsWith('http') ? req.offered_item_image : `${BACKEND_URL}${req.offered_item_image}`}
                                    alt="Offered Item" 
                                    className="item-thumb" 
                                    onError={(e) => {e.target.src = "/images/placeholder.jpg"}}
                                />
                            ) : (
                                <div className="item-thumb-placeholder">
                                    <i className="fa-solid fa-gift"></i>
                                </div>
                            )}

                            <h4>{displayedOfferName}</h4>
                            
                            {!isOutgoing && <p className="user-info">by <strong>{req.requester_name}</strong></p>}
                        </div>
                    </div>
                    
                    {(details.offer || details.note) && (
                        <div className="offer-description-box">
                            {details.offer && (
                                <p style={{margin: '0', marginBottom: details.note ? '5px' : '0'}}>
                                    <strong>Offer Item Description:</strong> {details.offer}
                                </p>
                            )}
                            {details.note && (
                                <p style={{margin: '0'}}>
                                    <strong>Requester Note:</strong> {details.note}
                                </p>
                            )}
                        </div>
                    )}

                    {req.status === 'rejected' && req.rejection_reason && (
                        <div className="rejection-note">
                            <strong>Declined Reason:</strong> "{req.rejection_reason}"
                        </div>
                    )}

                    {!isOutgoing && req.status === "pending" && (
                        <div className="swap-actions">
                            <button className="swap-accept-btn" onClick={() => handleAction(req.id, "accepted")}>
                                <i className="fa-solid fa-check"></i> Accept
                            </button>
                            <button className="swap-decline-btn" onClick={() => handleAction(req.id, "rejected")}>
                                <i className="fa-solid fa-xmark"></i> Decline
                            </button>
                        </div>
                    )}

                    {isOutgoing && req.status === "pending" && (
                        <div className="swap-actions">
                            <button className="swap-cancel-btn" onClick={() => handleAction(req.id, "cancelled")}>
                                Cancel Request
                            </button>
                        </div>
                    )}

                    {(req.status === "accepted" || req.status === "completed") && (
                        <div className="swap-actions">
                            
                            {req.status === "accepted" && (
                                <button className="swap-done-btn" onClick={() => handleAction(req.id, 'completed')}>
                                    <i className="fa-solid fa-check-double"></i> Mark as Done
                                </button>
                            )}

                            {req.status === "completed" && !req.has_rated && (
                                <button className="swap-rate-btn" onClick={() => handleAction(req.id, 'completed')} style={{background: '#ffc107', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
                                    <i className="fa-solid fa-star"></i> Rate Partner
                                </button>
                            )}

                            {req.status === "completed" && req.has_rated && (
                                <button className="swap-done-btn" disabled style={{background: '#ccc', cursor: 'default', border:'none', padding:'8px 15px', borderRadius:'5px', color:'white'}}>
                                    <i className="fa-solid fa-check"></i> Completed
                                </button>
                            )}
                            
                            <button className="chat-btn" onClick={() => {
                                const partnerId = isOutgoing ? req.target_owner_id : req.requester_id;
                                navigate(`/chat?user=${partnerId}`);
                            }}>
                                <i className="fa-solid fa-comments"></i> Chat
                            </button>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="swap-requests-wrapper">
            <button className="mobile-back-btn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="swap-requests-page">
                <div className="page-header">
                    <div>
                        <h2>Swap Inventory</h2>
                        <p>Manage your item exchanges</p>
                    </div>
                    <button onClick={handleRefresh} style={{background:'transparent', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#8B0000'}}>
                        <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`}></i>
                    </button>
                </div>

                <div className="swap-tabs-wrapper">
                    <div className="swap-tabs">
                        <button className={activeTab === "incoming" ? "active" : ""} onClick={() => setActiveTab("incoming")}>
                            Offers Received
                        </button>
                        <button className={activeTab === "outgoing" ? "active" : ""} onClick={() => setActiveTab("outgoing")}>
                            My Requests
                        </button>
                    </div>
                </div>

                <div className="swap-request-container">
                    {activeTab === "incoming" ? renderRequests(incomingRequests, false) : renderRequests(outgoingRequests, true)}
                </div>
            </div>

            {showDeclineModal && (
                <div className="modal-overlay">
                    <div className="swap-modal-container">
                        <div className="modal-header" style={{background: '#8B0000', color: 'white'}}>
                            <h3 style={{color: 'white'}}>Decline Swap Offer</h3>
                            <button onClick={() => {setShowDeclineModal(false); setDeclineReason("");}} className="close-btn"><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{marginBottom: '10px', color: '#333'}}>Please state why you are rejecting this swap offer:</p>
                            <textarea 
                                value={declineReason} 
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="E.g., The offered item is not what I need, or item condition is poor..."
                                style={{width: '100%', height: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #ffcccc', resize: 'vertical', marginBottom: '15px'}}
                            />
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button onClick={() => {setShowDeclineModal(false); setDeclineReason("");}} className="cancel-btn">Cancel</button>
                                <button onClick={handleConfirmDecline} className="confirm-swap-btn" style={{background: '#d9534f'}}>Confirm Decline</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <RatingModal 
                isOpen={isRatingModalOpen}
                ratingData={ratingModalData}
                onClose={handleModalClose}
            />
        </div>
    );
};

export default SwapRequests;