import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // 👈 CRITICAL: Use useParams
import { useCart } from "../../context/CartContext";
import { fetchTransactionDetails } from "../../services/api"; // 👈 Must be imported
import "./Receipt.css";

export default function Receipt() {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const { transactionId } = useParams(); // 🌟 Get the ID from the URL (e.g., '4')

  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transactionId) {
      setLoading(true);
      // Call the API function we added that hits the backend GET route
      fetchTransactionDetails(transactionId)
        .then((data) => {
          setTransactionData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching transaction:", err);
          setError("Failed to load order details. Check network.");
          setLoading(false);
        });
    } else {
      setError("No transaction ID provided in the URL.");
      setLoading(false);
    }
  }, [transactionId]);

  // --- Handle Loading, Error, and Missing Data States ---
  if (loading) {
    return <div className="receipt-container loading">Loading receipt...</div>;
  }

  if (error) {
    return <div className="receipt-container error">Error: {error}</div>;
  }

  // If the API returned 404 or the data is null
  if (!transactionData) {
    return (
      <div className="receipt-container">
        <div className="empty-receipt">
          <p>Order details not found for transaction ID: {transactionId}.</p>
        </div>
      </div>
    );
  }

  // --- Data Mapping (Uses transactionData from the backend) ---
  const {
    price_paid,
    listing_price,
    meetup_details = {},
    payment_method,
    product_name,
    status,
  } = transactionData;

  const subtotal = parseFloat(price_paid);
  const grandTotal = subtotal;
  const productPrice = parseFloat(listing_price);

  const orderItems = [
    {
      id: transactionData.product_id,
      name: product_name,
      price: productPrice,
      quantity: 1, // Assuming single item purchase flow
    },
  ];

  // --- Handler Functions ---
  const handleDone = () => {
    clearCart(); // Clear cart when leaving receipt
    navigate("/inside-app");
  };

  const handlePrint = () => {
    window.print();
  };

  // --- JSX Rendering (Updated to use transactionData) ---
  // You will need to restore the full JSX body using the variables defined above
  // (e.g., transactionData, orderItems, meetup_details, etc.)
  return (
    <div className="receipt-container">
      <div className="receipt-card">
        <header className="receipt-header">
          <div className="receipt-icon">🧾</div>
          <h1 className="receipt-title">Order Receipt</h1>
          <p className="receipt-subtitle">
            Transaction ID: {transactionData.transaction_id}
          </p>
        </header>

        <div className="receipt-content">
          <section className="customer-info">
            <h2 className="section-title">Meet-up Details</h2>
            <p>
              <strong>Customer:</strong>{" "}
              {meetup_details.full_name || transactionData.buyer_username}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {meetup_details.location_type === "school-premises"
                ? "School Premises"
                : "Near Establishment"}
            </p>
            <p>
              <strong>Specifics:</strong>{" "}
              {meetup_details.specific_details || "N/A"}
            </p>
            <p>
              <strong>Contact:</strong> {meetup_details.contact_number || "N/A"}
            </p>
            <p>
              <strong>Payment Method:</strong> {payment_method || "N/A"}
            </p>
          </section>

          <section className="receipt-items">
            <h2 className="section-title">Order Details</h2>
            {orderItems.map((item) => (
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

          <section className="receipt-summary">
            <div className="summary-row total">
              <span>Total Amount Paid</span>
              <span>₱{grandTotal.toFixed(2)}</span>
            </div>
          </section>
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
