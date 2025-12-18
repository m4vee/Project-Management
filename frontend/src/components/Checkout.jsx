import React, { useState, useEffect } from "react";
import { createTransaction, fetchProductDetails } from "../services/api";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./Checkout.css";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation(); 
    const { productId } = useParams();

    const [itemsToCheckout, setItemsToCheckout] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        meetupLocation: "school-premises",
        specificLocation: "",
        contact: "",
        paymentMethod: "Cash",
        paymentReference: "", 
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    const validateContact = (contact) => {
        const cleanContact = contact.replace(/\s/g, "");
        const phRegex = /^(((\+63|63)9)|09)\d{9}$/;
        return phRegex.test(cleanContact);
    };

    // --- INITIALIZATION LOGIC ---
    useEffect(() => {
        const initCheckout = async () => {
            setLoading(true);
            setFetchError("");
            const currentItems = [];

            try {
                // SCENARIO A: From Cart (Multiple Items via location state)
                if (location.state && location.state.selectedItems) {
                    const normalizedItems = location.state.selectedItems.map(item => ({
                        product_id: parseInt(item.product_id || item.id),
                        name: item.name,
                        price: parseFloat(item.price || 0),
                        image_url: item.image_url || item.img || "/images/placeholder.jpg",
                        quantity: parseInt(item.quantity || 1),
                        seller_id: item.seller_id
                    }));
                    currentItems.push(...normalizedItems);
                } 
                // SCENARIO B: "Buy Now" (Single Item ID from URL)
                else if (productId) {
                    const response = await fetchProductDetails(productId);
                    const product = response.product || response;

                    if (!product || !product.name) {
                        throw new Error("Invalid product data received from server.");
                    }

                    const imgUrl = product.image_url 
                        ? (product.image_url.startsWith("http") ? product.image_url : `${BACKEND_URL}${product.image_url}`)
                        : "/images/placeholder.jpg";

                    currentItems.push({
                        product_id: parseInt(product.id),
                        name: product.name,
                        price: parseFloat(product.price || 0),
                        image_url: imgUrl,
                        quantity: 1,
                        seller_id: product.seller_id
                    });
                } 
                
                if (currentItems.length === 0) {
                     setFetchError("No items found to checkout.");
                }

                setItemsToCheckout(currentItems);

            } catch (err) {
                console.error("Checkout Init Error:", err);
                setFetchError("Failed to load product details. " + (err.message || ""));
            } finally {
                setLoading(false);
            }
        };

        initCheckout();
    }, [productId, location.state]);

    const grandTotal = itemsToCheckout.reduce((sum, item) => {
        const p = isNaN(item.price) ? 0 : item.price;
        const q = isNaN(item.quantity) ? 1 : item.quantity;
        return sum + (p * q);
    }, 0);

    // --- PAYMENT HANDLING (BULK TRANSACTION) ---
    const handlePayment = async (e) => {
        e.preventDefault();
        let newErrors = {};

        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Please log in first.");
            navigate("/login");
            return;
        }
        
        // Validations
        if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
        if (!formData.specificLocation.trim()) newErrors.specificLocation = "Location details required.";
        if (!formData.contact.trim()) newErrors.contact = "Contact is required.";
        else if (!validateContact(formData.contact)) newErrors.contact = "Invalid PH format (09xx...).";

        if (formData.paymentMethod !== "Cash" && !formData.paymentReference.trim()) {
            newErrors.paymentReference = "Reference No. required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (isNaN(grandTotal) || grandTotal <= 0) {
            alert("Error: Total amount is invalid. Cannot process.");
            return;
        }

        setLoading(true); // START PROCESSING

        try {
            // 1. I-format ang items para sa SINGLE API CALL (Bulk Checkout)
            const itemsPayload = itemsToCheckout.map(item => ({
                product_id: parseInt(item.product_id), 
                quantity: parseInt(item.quantity)
            }));
            
            const finalPayload = {
                user_id: parseInt(userId),
                items: itemsPayload, // CRITICAL: Listahan ng items
                payment_method: formData.paymentMethod,
                payment_reference: formData.paymentMethod !== "Cash" ? formData.paymentReference : null,
                meetup_details: {
                    location_type: formData.meetupLocation,
                    specific_details: formData.specificLocation,
                    contact_number: formData.contact,
                    full_name: formData.fullName,
                },
            };
            
            // 2. ISANG API CALL lang para sa lahat ng items
            const response = await createTransaction(finalPayload);

            const transactionId = response.transaction_id;

            alert(`Order placed successfully! Transaction ID: ${transactionId}`);
            
            // Dispatch event to refresh the cart state globally
            window.dispatchEvent(new Event("cart-updated"));
            
            if(transactionId) {
                navigate(`/receipt/${transactionId}`);
            } else {
                navigate("/my-posts"); 
            }

        } catch (error) {
            console.error("Checkout Processing Error:", error);
            alert(`Failed to process order. Backend says: ${error.message || "Unknown Error"}`);
        } finally {
            setLoading(false); 
        }
    };

    // --- RENDER: LOADING STATE ---
    if (loading) {
        return (
            <div className="checkout-page">
                <div className="checkout-container" style={{ textAlign: 'center', padding: '60px' }}>
                     <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                     <p style={{ color: '#666' }}>Processing your order...</p>
                </div>
            </div>
        );
    }

    // --- RENDER: ERROR STATE ---
    if (fetchError) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <header className="checkout-header" style={{ background: '#7d1528' }}>
                        <h2>Error</h2>
                    </header>
                    <div style={{ padding: '30px', textAlign: 'center' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{color: '#7d1528', fontSize: '3rem', marginBottom:'15px'}}></i>
                        <p className="error-general" style={{ color: '#333', fontSize:'1.1rem' }}>{fetchError}</p>
                        <button className="checkout-btn" onClick={() => navigate("/inside-app")} style={{marginTop:'20px'}}>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: MAIN CHECKOUT FORM ---
    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <header className="checkout-header">
                    <h2>Checkout</h2>
                    <p>Complete your purchase securely</p>
                </header>

                <div className="checkout-content">
                    {/* 1. ORDER SUMMARY */}
                    <section className="order-summary">
                        <h3>Order Summary ({itemsToCheckout.length} items)</h3>
                        <div className="order-items-list">
                            {itemsToCheckout.map((item, index) => (
                                <div key={index} className="order-item">
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="order-item-img"
                                        onError={(e) => e.target.src="/images/placeholder.jpg"}
                                    />
                                    <div className="item-details" style={{ flex: 1 }}>
                                        <h4>{item.name}</h4>
                                        <p className="seller-label">Seller ID: {item.seller_id}</p> 
                                        <p>Qty: {item.quantity}</p>
                                    </div>
                                    <span className="item-price">
                                        ₱{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="checkout-total">
                            <p>Total Amount</p>
                            <h4>₱{grandTotal.toLocaleString()}</h4>
                        </div>
                    </section>

                    {/* 2. PAYMENT & DELIVERY FORM */}
                    <section className="payment-section">
                        <h3>Delivery & Payment Details</h3>
                        <form onSubmit={handlePayment}>
                            
                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    name="fullName" 
                                    value={formData.fullName} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Juan Dela Cruz"
                                />
                                {errors.fullName && <span className="error">{errors.fullName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Meet-up Location</label>
                                <select name="meetupLocation" value={formData.meetupLocation} onChange={handleChange}>
                                    <option value="school-premises">Inside TUP Campus</option>
                                    <option value="near-establishment">Near SM / Ayala</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Specific Details (Room/Time)</label>
                                <textarea 
                                    name="specificLocation" 
                                    value={formData.specificLocation} 
                                    onChange={handleChange} 
                                    rows="2"
                                    placeholder="e.g., CLA Lobby, 1:00 PM"
                                />
                                {errors.specificLocation && <span className="error">{errors.specificLocation}</span>}
                            </div>

                            <div className="form-group">
                                <label>Contact Number</label>
                                <input 
                                    type="text" 
                                    name="contact" 
                                    value={formData.contact} 
                                    onChange={handleChange} 
                                    placeholder="0912 345 6789"
                                />
                                {errors.contact && <span className="error">{errors.contact}</span>}
                            </div>

                            <div className="form-group">
                                <label>Payment Method</label>
                                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                                    <option value="Cash">Cash on Meetup</option>
                                    <option value="GCash">GCash</option>
                                    <option value="PayMaya">Maya</option>
                                </select>
                            </div>

                            {formData.paymentMethod !== "Cash" && (
                                <div className="form-group highlight-bg">
                                    <label>Payment Reference No. *</label>
                                    <input 
                                        type="text" 
                                        name="paymentReference" 
                                        value={formData.paymentReference} 
                                        onChange={handleChange} 
                                        placeholder="Ex. 10023456789"
                                    />
                                    {errors.paymentReference && <span className="error">{errors.paymentReference}</span>}
                                    <small style={{display:'block', marginTop:'4px', color:'#666'}}>
                                        Please settle payment with the seller before confirming.
                                    </small>
                                </div>
                            )}

                            <button type="submit" className="checkout-btn" disabled={loading}>
                                {loading ? "Processing..." : `Confirm • ₱${grandTotal.toLocaleString()}`}
                            </button>

                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}