// src/components/Cart.jsx (or src/components/pages/Cart.jsx if moved)
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; // Fixed: Use the context hook (adjust path if in pages/: ../../context/CartContext)
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart } = useCart(); // Use context functions

  // Increase item quantity
  const handleIncrease = (id) => {
    updateQuantity(id, cartItems.find(item => item.id === id).quantity + 1);
  };

  // Decrease item quantity (minimum 1)
  const handleDecrease = (id) => {
    const currentItem = cartItems.find(item => item.id === id);
    if (currentItem.quantity > 1) {
      updateQuantity(id, currentItem.quantity - 1);
    }
  };

  // Remove item
  const handleRemove = (id) => {
    removeFromCart(id);
  };

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Navigate to Checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  // Navigate back to homepage (inside app) to add more items
  const handleAddAnother = () => {
    navigate("/inside-app");
  };

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h2>🛒 My Cart</h2>
        <Link to="/inside-app" className="exit-btn" title="Exit to main app">
          <i className="fa-solid fa-arrow-left"></i> Exit
        </Link>
      </header>

      <div className="cart-body">
        {cartItems.length === 0 ? (
          <p className="empty-cart">Your cart is empty 😢</p>
        ) : (
          cartItems.map((item) => (
            <div className="cart-card" key={item.id}>
              <img src={item.img || "/placeholder.jpg"} alt={item.name} className="cart-img" />
              <div className="cart-info">
                <h3>{item.name}</h3>
                <p>₱{item.price.toLocaleString()}</p>
                <p>Service: {item.type}</p> {/* Added: Display service type */}
                <div className="quantity-control">
                  <button onClick={() => handleDecrease(item.id)} disabled={item.quantity <= 1}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleIncrease(item.id)}>+</button>
                </div>
              </div>
              <div className="cart-right">
                <p className="cart-subtotal">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </p>
                <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Actions - Always show "Add Another Item", conditionally show checkout */}
      <div className="cart-summary">
        {cartItems.length > 0 && (
          <h3>Total: ₱{total.toLocaleString()}</h3>
        )}
        <div className="cart-actions">
          <button
            className="add-another-btn"
            onClick={handleAddAnother}
            title="Add more items to your cart"
          >
            + Add Another Item
          </button>
          {cartItems.length > 0 && (
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              title="Proceed to checkout"
            >
              Proceed to Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
