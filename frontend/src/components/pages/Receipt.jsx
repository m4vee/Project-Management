import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTransactionDetails } from "../../services/api"; 
import "./Receipt.css";

const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};

export default function Receipt() {
    const navigate = useNavigate();
    const { transactionId } = useParams();

    const [transactionData, setTransactionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (transactionId) {
            setLoading(true);
            fetchTransactionDetails(transactionId)
                .then((data) => {
                    setTransactionData(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching transaction:", err);
                    setError("Failed to load receipt details.");
                    setLoading(false);
                });
        } else {
            setError("No transaction ID provided.");
            setLoading(false);
        }
    }, [transactionId]);

    if (loading) return <div className="receipt-loading"><div className="spinner"></div>Loading Receipt...</div>;
    if (error) return <div className="receipt-error">⚠️ {error}</div>;
    if (!transactionData || !transactionData.items) return <div className="receipt-error">⚠️ Receipt data incomplete.</div>;

    const {
        receipt_code,
        created_at,
        amount,
        payment_method,
        meetup_details,
        buyer_name,
        items, 
    } = transactionData;

    const finalTotal = parseFloat(amount || 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="receipt-wrapper">
            <button className="mobile-back-btn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="receipt-paper">
                
                <div className="receipt-header-red">
                    <div style={{marginBottom: '5px', opacity: 0.8}}>Ref: {receipt_code}</div>
                    <h2>Order Receipt</h2>
                    <p>{new Date(created_at).toLocaleDateString()} • {new Date(created_at).toLocaleTimeString()}</p>
                </div>

                <div className="receipt-body">
                    
                    <div className="section-header">
                        <i className="fa-solid fa-location-dot"></i> Meet-up Details
                    </div>
                    
                    <div className="details-grid">
                        <span className="detail-label">Customer</span>
                        <span className="detail-value">{meetup_details?.full_name || buyer_name}</span>

                        <span className="detail-label">Location</span>
                        <span className="detail-value">
                            {meetup_details?.location_type === "school-premises" ? "Inside TUP Campus" : "Near Establishment"}
                        </span>

                        <span className="detail-label">Specifics</span>
                        <span className="detail-value">{meetup_details?.specific_details || "N/A"}</span>

                        <span className="detail-label">Contact</span>
                        <span className="detail-value">{meetup_details?.contact_number || "N/A"}</span>

                        <span className="detail-label">Payment</span>
                        <span className="detail-value">{payment_method}</span>
                    </div>

                    <div className="section-header" style={{marginTop: '25px'}}>
                        <i className="fa-solid fa-bag-shopping"></i> Order Details ({items.length} Items)
                    </div>

                    {items.map((item, index) => (
                        <div key={index} className="order-item-card">
                            {item.image_url ? (
                                <img src={item.image_url} alt="Item" className="item-thumb" onError={(e) => e.target.style.display='none'}/>
                            ) : (
                                <div className="item-thumb"><i className="fa-solid fa-box"></i></div>
                            )}
                            <div className="item-info">
                                <h4>{item.product_name}</h4>
                                <p className="seller-tag">Sold by: <strong>{item.seller_name}</strong></p>
                            </div>
                            <div className="item-pricing">
                                <p className="qty">Qty: {item.quantity}</p>
                                <p className="unit-price">@ {formatPrice(item.unit_price)}</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="calc-table-wrapper">
                        <div className="calculation-table">
                            <div className="calc-row">
                                <span>Subtotal ({items.length} Items)</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                            
                            <div className="calc-divider"></div>
                            
                            <div className="calc-row total">
                                <span>TOTAL AMOUNT</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="receipt-barcode">
                        <div className="barcode-lines"></div>
                        <p>{receipt_code}</p>
                    </div>

                </div>

                <div className="receipt-actions">
                    <button className="btn-print" onClick={handlePrint}>
                        <i className="fa-solid fa-print"></i> Print
                    </button>
                    
                    <button className="btn-home" onClick={() => navigate('/transactions')}>
                        <i className="fa-solid fa-receipt"></i> Transactions
                    </button>
                </div>
            </div>
        </div>
    );
}