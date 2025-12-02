// src/components/Checkout.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedItemIds = state?.selectedItems || [];

  // Filter cart items to only include selected ones
  const selectedCartItems = cartItems.filter((item) =>
    selectedItemIds.includes(item.id)
  );
  const total = selectedCartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // Added: State for payment form
  const [formData, setFormData] = useState({
    fullName: "",
    meetupLocation: "school-premises",
    specificLocation: "",
    contact: "",
    paymentMethod: "Cash",
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

    // Validate meet-up location
    if (!formData.meetupLocation.trim()) {
      newErrors.meetupLocation = "Please select a meet-up location.";
    }

    // Validate specific location details if needed
    if (!formData.specificLocation.trim()) {
      newErrors.specificLocation = "Please provide specific meet-up details.";
    }

    // Validate contact number
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    } else if (!validateContact(formData.contact)) {
      newErrors.contact =
        "Please enter a valid Philippine number (e.g., +639123456789 or 09123456789).";
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
  const grandTotal = subtotal;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <h2>Checkout</h2>
          <p>
            Please review your order and select your preferred meet-up location.
          </p>
        </header>

        {/* Added: Order Summary Section */}
        <section className="order-summary">
          <h3>Order Summary</h3>
          {selectedCartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            selectedCartItems.map((item) => (
              <div key={item.id} className="order-item">
                <img
                  src={item.img || "/placeholder.jpg"}
                  alt={item.name}
                  className="order-item-img"
                />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>
                    ₱{item.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <span className="item-price">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))
          )}
          <div className="checkout-total">
            <p>Subtotal: ₱{subtotal.toLocaleString()}</p>
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
              {errors.fullName && (
                <span className="error">{errors.fullName}</span>
              )}
            </div>
            <div className="form-group">
              <label>Meet-up Location Preference</label>
              <select
                name="meetupLocation"
                value={formData.meetupLocation}
                onChange={handleChange}
                required
              >
                <option value="school-premises">School Premises</option>
                <option value="near-establishment">Near Establishment</option>
              </select>
              {errors.meetupLocation && (
                <span className="error">{errors.meetupLocation}</span>
              )}
            </div>
            <div className="form-group">
              <label>Specific Meet-up Location / Details</label>
              <textarea
                name="specificLocation"
                value={formData.specificLocation}
                onChange={handleChange}
                required
                placeholder="e.g., Building A lobby, Near main gate, Specific establishment name, etc."
              />
              {errors.specificLocation && (
                <span className="error">{errors.specificLocation}</span>
              )}
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
              {errors.contact && (
                <span className="error">{errors.contact}</span>
              )}
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="PayMaya">PayMaya</option>
              </select>
            </div>
            <button type="submit" className="checkout-btn">
              Confirm Order
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
