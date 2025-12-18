import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; 
import "./Cart.css";

export default function Cart() {
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart } = useCart(); 
    const [selectedItems, setSelectedItems] = useState(new Set()); 

    const handleIncrease = (id) => {
        const item = cartItems.find((item) => item.id === id);
        if (item) updateQuantity(item.product_id, item.quantity + 1); // Use product_id for API update
    };

    const handleDecrease = (id) => {
        const currentItem = cartItems.find((item) => item.id === id);
        if (currentItem && currentItem.quantity > 1) {
            updateQuantity(currentItem.product_id, currentItem.quantity - 1); // Use product_id for API update
        }
    };

    const handleRemove = (id) => {
        const itemToRemove = cartItems.find((item) => item.id === id);
        if (!itemToRemove) return;

        if (window.confirm("Are you sure you want to remove this item?")) {
            // CRITICAL: removeFromCart must use product_id for API deletion
            removeFromCart(itemToRemove.product_id); 
            
            if (selectedItems.has(id)) {
                const newSelected = new Set(selectedItems);
                newSelected.delete(id);
                setSelectedItems(newSelected);
            }
        }
    };

    const handleSelectItem = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === cartItems.length && cartItems.length > 0) {
            setSelectedItems(new Set());
        } else {
            // Use cart item IDs (the React keys) for selection set
            const allIds = new Set(cartItems.map(item => item.id)); 
            setSelectedItems(allIds);
        }
    };

    const total = cartItems
        .filter((item) => selectedItems.has(item.id))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (selectedItems.size === 0) {
            alert("Please select items to checkout.");
            return;
        }

        // 💥 Prepare payload for Bulk Checkout 💥
        const itemsToCheckout = cartItems
            .filter(item => selectedItems.has(item.id))
            .map(item => ({
                product_id: item.product_id, // CRITICAL: Pass product_id to Checkout
                name: item.name,
                price: item.price,
                img: item.img,
                quantity: item.quantity,
                seller_id: item.seller_id,
                seller_name: item.seller_name
            }));

        navigate('/checkout', {
            state: { 
                source: 'cart', 
                selectedItems: itemsToCheckout,
                totalAmount: total
            },
        });
    };

    return (
        <div className="cart-wrapper">
            <div className="cart-page">
                <header className="cart-header">
                    <div className="header-title">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <h1>My Cart</h1>
                    </div>
                    <button onClick={() => navigate("/inside-app")} className="exit-btn">
                        <i className="fa-solid fa-arrow-left"></i> Home
                    </button>
                </header>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart-container">
                            <i className="fa-solid fa-basket-shopping"></i>
                            <p>Your cart is empty.</p>
                            <button onClick={() => navigate("/inside-app")} className="start-shopping-btn">
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="cart-actions-top">
                                <label className="select-all-label">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                    <span>Select All ({cartItems.length})</span>
                                </label>
                            </div>

                            <div className="cart-items-list">
                                {cartItems.map((item) => (
                                <div className={`cart-card ${selectedItems.has(item.id) ? 'active-card' : ''}`} key={item.id}>
                                    <div className="checkbox-wrapper">
                                        <input
                                        type="checkbox"
                                        className="cart-checkbox"
                                        checked={selectedItems.has(item.id)}
                                        onChange={() => handleSelectItem(item.id)}
                                        />
                                    </div>
                                    
                                    <div className="cart-img-wrapper">
                                        <img 
                                            src={item.img || "/images/placeholder.jpg"} 
                                            alt={item.name} 
                                            onError={(e) => e.target.src = "/images/placeholder.jpg"}
                                        />
                                    </div>
                                    
                                    <div className="cart-info">
                                        <h3>{item.name}</h3>
                                        <div className="tags">
                                            <span className="type-badge">{item.type || 'SELL'}</span>
                                        </div>
                                        <p className="price">₱{Number(item.price).toLocaleString()}</p>
                                    </div>

                                    <div className="cart-controls">
                                        <div className="quantity-control">
                                            <button onClick={() => handleDecrease(item.id)} disabled={item.quantity <= 1}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => handleIncrease(item.id)}>+</button>
                                        </div>
                                        
                                        <button className="remove-icon-btn" onClick={() => handleRemove(item.id)} title="Remove">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-summary">
                        <div className="summary-info">
                            <span className="label">Total ({selectedItems.size} items)</span>
                            <span className="total-amount">₱{total.toLocaleString()}</span>
                        </div>
                        
                        <button
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={selectedItems.size === 0}
                        >
                            Check Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}