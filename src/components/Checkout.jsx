// src/components/Checkout.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const { cartItems, clearCart } = useCart();
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const navigate = useNavigate();

  // Added: State for payment form
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    contact: "",
    paymentMethod: "Cash on Delivery",
  });

  // Added: State for validation errors
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  // Added: Validation function for contact number
  const validateContact = (contact) => {
    const phRegex = /^(\+63|63)?[0-9]{10}$/; // Starts with +63 or 63, followed by 10 digits
    return phRegex.test(contact.replace(/\s/g, "")); // Remove spaces for validation
  };

  const handlePayment = (e) => {
    e.preventDefault();
    let newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = "Delivery address is required.";
    }

    // Validate contact number
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    } else if (!validateContact(formData.contact)) {
      newErrors.contact = "Please enter a valid Philippine number (e.g., +639123456789 or 09123456789).";
    }

    // If there are errors, set them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulate successful payment (unchanged)
    navigate("/receipt", { state: { cartItems, total, formData } }); // Added formData to state for receipt
    clearCart();
  };

  const subtotal = total;
  const shippingFee = 50;
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <h2>🛒 Checkout</h2>
          <p>Please review your order and enter payment details.</p>
        </header>

        {/* Added: Order Summary Section */}
        <section className="order-summary">
          <h3>Order Summary</h3>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="order-item">
                <img
                  src={item.img || "/placeholder.jpg"}
                  alt={item.name}
                  className="order-item-img"
                />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>₱{item.price.toLocaleString()} × {item.quantity}</p>
                </div>
                <span className="item-price">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))
          )}
          <div className="checkout-total">
            <p>Subtotal: ₱{subtotal.toLocaleString()}</p>
            <p>Shipping Fee: ₱{shippingFee}</p>
            <h4>Total: ₱{grandTotal.toLocaleString()}</h4>
          </div>
        </section>

        {/* Added: Payment Form Section */}
        <section className="payment-section">
          <h3>Payment Details</h3>
          <form onSubmit={handlePayment}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
              {errors.fullName && <span className="error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Enter your address"
              />
              {errors.address && <span className="error">{errors.address}</span>}
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                placeholder="e.g., +639123456789 or 09123456789"
              />
              {errors.contact && <span className="error">{errors.contact}</span>}
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="GCash">GCash</option>
                <option value="PayMaya">PayMaya</option>
              </select>
            </div>
            <button type="submit" className="checkout-btn">
              Pay Now
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}