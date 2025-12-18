import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    fetchUserTransactions, 
    markTransactionCompleted, 
    reportTransactionIssue,
    fetchRentalRequests,      
    updateRentalStatus,       
    fetchSwapRequests,        
    updateSwapStatus          
} from "../services/api";
import RatingModal from '../components/RatingModal'; 
import '../components/RatingModal.css'; 
import "./TransactionStatus.css";

const BACKEND_URL = "http://127.0.0.1:5000";

const TransactionStatus = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("purchases"); 
    const [dataList, setDataList] = useState({ 
        purchases: [], 
        sales: [], 
        rentals: [], 
        swaps: [] 
    });
    const [loading, setLoading] = useState(true);
    const currentUserId = localStorage.getItem("user_id");

    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingModalData, setRatingModalData] = useState(null);

    useEffect(() => {
        if (!currentUserId) { navigate("/"); return; }
        loadAllData();
    }, [currentUserId, navigate]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [transData, rentalData, swapData] = await Promise.all([
                fetchUserTransactions(currentUserId),
                fetchRentalRequests(currentUserId),
                fetchSwapRequests(currentUserId)
            ]);

            setDataList({
                purchases: transData.purchases || [],
                sales: transData.sales || [],
                rentals: rentalData || [],
                swaps: swapData || []
            });
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderReceived = async (id, sellerName) => {
        if(!window.confirm("Confirm that you have received the item?")) return;
        setLoading(true);
        try {
            const response = await markTransactionCompleted(id);
            triggerRating(response, sellerName);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            loadAllData();
        }
    };

    const handleRentalReturned = async (rental) => {
        if(!window.confirm("Confirm that the item has been returned?")) return;
        setLoading(true);
        try {
            const response = await updateRentalStatus(rental.id, 'completed', currentUserId);
            triggerRating(response, rental.renter_name);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            loadAllData();
        }
    };

    const handleSwapDone = async (swap) => {
        if(!window.confirm("Confirm that the swap is complete?")) return;
        setLoading(true);
        try {
            const response = await updateSwapStatus(swap.id, 'completed', currentUserId);
            const partnerName = parseInt(currentUserId) === swap.requester_id ? swap.target_owner_name : swap.requester_name;
            triggerRating(response, partnerName);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            loadAllData();
        }
    };

    const triggerRating = (response, targetName) => {
        if (response.should_rate && response.rate_target_id) {
            setRatingModalData({
                rater_id: response.rater_id,
                rate_target_id: response.rate_target_id,
                rate_type: response.rate_type,
                rate_trans_id: response.rate_trans_id,
                target_name: targetName 
            });
            setIsRatingModalOpen(true);
        } else {
            alert(response.message || "Status updated successfully!");
        }
    };

    const handleReportIssue = async (id) => {
        const reason = prompt("Reason for cancellation:");
        if (!reason) return;
        try {
            await reportTransactionIssue(id, reason);
            alert("Transaction cancelled.");
            loadAllData();
        } catch (error) {
            alert("Error reporting issue");
        }
    };
    
    const handleModalClose = () => {
        setIsRatingModalOpen(false);
        setRatingModalData(null);
        loadAllData(); 
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    };

    const renderList = () => {
        let items = [];
        let type = activeTab;

        if (type === 'purchases') items = dataList.purchases;
        if (type === 'sales') items = dataList.sales;
        if (type === 'rentals') items = dataList.rentals;
        if (type === 'swaps') items = dataList.swaps;

        if (items.length === 0) {
            return (
                <div className="empty-state">
                    <i className="fa-solid fa-box-open"></i>
                    <p>No {type} found.</p>
                </div>
            );
        }

        return items.map((item) => {
            if (type === 'rentals') {
                const isOwner = parseInt(currentUserId) === item.owner_id;
                const partnerName = isOwner ? item.renter_name : item.owner_name;
                
                return (
                    <div key={item.id} className="trans-card">
                         <div className="trans-img-wrapper">
                            <img src={`${BACKEND_URL}${item.product_image}`} alt={item.product_name} onError={(e)=>e.target.style.display='none'}/>
                        </div>
                        <div className="trans-details">
                            <div className="trans-header">
                                <h4>Rental: {item.product_name}</h4>
                                <span className={`status-badge ${item.status}`}>{item.status}</span>
                            </div>
                            <div className="trans-meta">
                                <p><i className="fa-solid fa-user"></i> {isOwner ? `Renter: ${partnerName}` : `Owner: ${partnerName}`}</p>
                                <p><i className="fa-regular fa-calendar"></i> {item.rent_start} to {item.rent_end}</p>
                            </div>
                            <div className="trans-footer">
                                <span className="price">{formatPrice(item.price)} / day</span>
                                {isOwner && item.status === 'accepted' && (
                                    <button className="btn-receive" onClick={() => handleRentalReturned(item)}>
                                        Mark Returned
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            if (type === 'swaps') {
                const isRequester = parseInt(currentUserId) === item.requester_id;
                const partnerName = isRequester ? item.target_owner_name : item.requester_name;

                return (
                    <div key={item.id} className="trans-card">
                         <div className="trans-img-wrapper">
                            <img src={`${BACKEND_URL}${item.target_item_image}`} alt={item.target_item_name} onError={(e)=>e.target.style.display='none'}/>
                        </div>
                        <div className="trans-details">
                            <div className="trans-header">
                                <h4>Swap: {item.target_item_name}</h4>
                                <span className={`status-badge ${item.status}`}>{item.status}</span>
                            </div>
                            <div className="trans-meta">
                                <p><i className="fa-solid fa-arrow-right-arrow-left"></i> With: {partnerName}</p>
                                <p><i className="fa-solid fa-gift"></i> Offer: {item.offered_item_name || item.offer_description}</p>
                            </div>
                            <div className="trans-footer">
                                {item.status === 'accepted' && (
                                    <button className="btn-receive" onClick={() => handleSwapDone(item)}>
                                        Mark Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
            const itemPreviewName = firstItem ? firstItem.product_name : 'Item';
            const itemPreviewImage = firstItem ? firstItem.product_image : null;
            const partnerName = type === 'purchases' ? (item.items[0]?.seller_name) : (item.items[0]?.buyer_name);

            return (
                <div key={item.id} className="trans-card">
                    <div className="trans-img-wrapper">
                        <img 
                            src={itemPreviewImage ? `${BACKEND_URL}${itemPreviewImage}` : ''} 
                            alt={itemPreviewName} 
                            onError={(e) => e.target.style.display='none'}
                        />
                    </div>

                    <div className="trans-details">
                        <div className="trans-header">
                            <h4>{itemPreviewName}</h4>
                            <span className={`status-badge ${item.status}`}>{item.status}</span>
                        </div>
                        
                        <div className="trans-meta">
                            <p><i className="fa-solid fa-user"></i> {type === 'purchases' ? 'Seller' : 'Buyer'}: {partnerName}</p>
                            <p><i className="fa-regular fa-calendar"></i> {new Date(item.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="trans-footer">
                            <span className="price">{formatPrice(item.amount)}</span>
                            
                            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                                {type === 'purchases' && item.status === 'pending' && (
                                    <>
                                        <button className="btn-receive" onClick={() => handleOrderReceived(item.id, partnerName)}>
                                            Received
                                        </button>
                                        <button className="btn-report" onClick={() => handleReportIssue(item.id)}>
                                            Report
                                        </button>
                                    </>
                                )}
                                
                                <button className="btn-view-receipt" onClick={() => navigate(`/receipt/${item.id}`)}>
                                    View Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="transaction-page-wrapper">
            
            <button className="mobile-back-btn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="transaction-container">
                <div className="page-header">
                    <h2>My Transactions</h2>
                    <p>Manage your orders, rentals, and swaps</p>
                </div>

                <div className="tabs-container">
                    <button className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
                        <i className="fa-solid fa-cart-shopping"></i> Purchases
                    </button>
                    <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
                        <i className="fa-solid fa-sack-dollar"></i> Sales
                    </button>
                    <button className={`tab-btn ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
                        <i className="fa-solid fa-clock"></i> Rentals
                    </button>
                    <button className={`tab-btn ${activeTab === 'swaps' ? 'active' : ''}`} onClick={() => setActiveTab('swaps')}>
                        <i className="fa-solid fa-repeat"></i> Swaps
                    </button>
                </div>

                <div className="trans-list-content">
                    {loading ? (
                        <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i> Loading...</div>
                    ) : (
                        renderList()
                    )}
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

export default TransactionStatus;