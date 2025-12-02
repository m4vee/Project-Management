import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; // <-- useLocation added
import { useCart } from "../../context/CartContext";
import "./Receipt.css";

export default function Receipt() {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation(); // <-- get location state

  // Extract data from state or fallback to empty values
  const { cartItems = [], total = 0, formData = {} } = location.state || {};

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const grandTotal = subtotal;

  const handleDone = () => {
    clearCart(); // Clear cart when leaving receipt
    navigate("/inside-app");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-container">
      <div className="receipt-card">
        <header className="receipt-header">
          <div className="receipt-icon">🧾</div>
          <h1 className="receipt-title">Order Receipt</h1>
          <p className="receipt-subtitle">
            Thank you for your purchase! Your order has been confirmed.
          </p>
        </header>

        <div className="receipt-content">
          {cartItems.length > 0 ? (
            <>
              {/* Customer Info */}
              <section className="customer-info">
                <h2 className="section-title">Customer Details</h2>
                <p>
                  <strong>Name:</strong> {formData.fullName || "N/A"}
                </p>
                <p>
                  <strong>Meet-up Location:</strong>{" "}
                  {formData.meetupLocation === "school-premises"
                    ? "School Premises"
                    : "Near Establishment"}
                </p>
                <p>
                  <strong>Specific Location:</strong>{" "}
                  {formData.specificLocation || "N/A"}
                </p>
                <p>
                  <strong>Contact:</strong> {formData.contact || "N/A"}
                </p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {formData.paymentMethod || "N/A"}
                </p>
              </section>

              {/* Order Items */}
              <section className="receipt-items">
                <h2 className="section-title">Order Details</h2>
                {cartItems.map((item) => (
                  <div key={item.id} className="receipt-item">
                    <div className="item-details">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">
                        Qty: {item.quantity || 1}
                      </span>
                    </div>
                    <span className="item-price">
                      ₱{(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </section>

              {/* Summary */}
              <section className="receipt-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₱{grandTotal.toFixed(2)}</span>
                </div>
              </section>
            </>
          ) : (
            <div className="empty-receipt">
              <p>No items in your order. Something went wrong?</p>
            </div>
          )}
        </div>

        <footer className="receipt-footer">
          <button className="btn btn-secondary" onClick={handlePrint}>
            Print Receipt
          </button>
          <button className="btn btn-primary" onClick={handleDone}>
            Continue Shopping
          </button>
        </footer>
      </div>
    </div>
  );
}
