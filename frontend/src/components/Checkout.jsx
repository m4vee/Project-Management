// src/components/Checkout.jsx
import React, { useState, useEffect } from "react";
import { createTransaction } from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "../services/api";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... (State and utility functions unchanged) ...
  const [formData, setFormData] = useState({
    fullName: "",
    meetupLocation: "school-premises",
    specificLocation: "",
    contact: "",
    paymentMethod: "Cash",
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

  useEffect(() => {
    // ... (useEffect hook for data fetching is correct) ...
    if (productId) {
      setLoading(true);
      fetchProductDetails(productId)
        .then((data) => {
          const firstImageUrl =
            data.photos && Array.isArray(data.photos) && data.photos.length > 0
              ? data.photos[0]
              : "/placeholder.jpg";
          setProductData({
            id: data.product_id,
            name: data.title,
            price: data.price,
            img: firstImageUrl,
            quantity: 1,
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching product details:", err);
          setLoading(false);
        });
    }
  }, [productId]);

  // --- BEGIN RENDER LOGIC (Runs on every render) ---

  // Handle Loading/Error State (Must be placed before calculations)
  if (loading) {
    return (
      <div className="checkout-page loading">Loading product details...</div>
    );
  }

  if (!productData) {
    return (
      <div className="checkout-page error">
        Product not found or failed to load.
      </div>
    );
  }

  // --- CALCULATIONS FOR SINGLE ITEM ---
  const selectedCartItems = [productData];
  const subtotal = productData.price;
  const grandTotal = subtotal;

  // 🌟 FIX 1 & 2: Added 'async' keyword and removed unnecessary nesting
  const handlePayment = async (e) => {
    e.preventDefault();
    let newErrors = {};

    // 1. --- User ID and Validation ---
    const userJson = localStorage.getItem("user");
    const userObject = userJson ? JSON.parse(userJson) : null;
    const userId = userObject?.user_id || userObject?.id; // Check both common keys

    if (!userId) {
      newErrors.general =
        "User ID not found. Please log in before checking out.";
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }
    if (!formData.meetupLocation.trim()) {
      newErrors.meetupLocation = "Please select a meet-up location.";
    }
    // Specific location check
    if (!formData.specificLocation.trim()) {
      newErrors.specificLocation = "Please provide specific meet-up details.";
    }
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required.";
    } else if (!validateContact(formData.contact)) {
      newErrors.contact =
        "Please enter a valid Philippine number (e.g., +639123456789 or 09123456789).";
    }

    // 2. --- Check for Errors (Stop if validation failed) ---
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 3. --- Payload Construction (Runs only if validation passed) ---
    const orderPayload = {
      buyer_id: userId,
      product_id: productData.id,
      quantity: 1,
      total_amount: grandTotal,
      payment_method: formData.paymentMethod,
      meetup_details: {
        location_type: formData.meetupLocation,
        specific_details: formData.specificLocation,
        contact_number: formData.contact,
        full_name: formData.fullName,
      },
    };
    console.log("Submitting Payload:", orderPayload);

    // 4. --- API Call ---
    setLoading(true);
    try {
      const response = await createTransaction(orderPayload); // Use response, not result

      // 🌟 CRITICAL FIX: Use URL routing for receipt page
      const transactionId = response.transaction_id;

      if (transactionId) {
        // NAVIGATE using the ID in the URL for clean routing
        navigate(`/receipt/${transactionId}`);
      } else {
        setErrors({
          general:
            "Transaction completed, but receipt ID is missing from server response.",
        });
      }
    } catch (error) {
      console.error("Order Submission Error:", error);
      setErrors({
        general:
          error.message ||
          "Failed to place order. Check network and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🌟 FIX 5: The final JSX return must be OUTSIDE the handlePayment function
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <h2>Checkout</h2>
          <p>
            Please review your order and select your preferred meet-up location.
          </p>
        </header>

        {/* ... (Order Summary Section unchanged) ... */}
        <section className="order-summary">
          <h3>Order Summary</h3>
          {/* Note: selectedCartItems will always have 1 item here */}
          {selectedCartItems.map((item) => (
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
          ))}
          <div className="checkout-total">
            <p>Subtotal: ₱{subtotal.toLocaleString()}</p>
            <h4>Total: ₱{grandTotal.toLocaleString()}</h4>
          </div>
        </section>

        {/* Payment Form Section */}
        <section className="payment-section">
          <h3>Payment Details</h3>
          <form onSubmit={handlePayment}>
            {/* Display general error */}
            {errors.general && (
              <span className="error-general">{errors.general}</span>
            )}

            {/* ... (Form groups unchanged) ... */}
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

            <button type="submit" className="checkout-btn" disabled={loading}>
              {loading ? "Processing..." : "Confirm Order"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
