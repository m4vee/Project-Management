// src/components/Cart.jsx (or src/components/pages/Cart.jsx if moved)
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; // Fixed: Use the context hook (adjust path if in pages/: ../../context/CartContext)
import "./Cart.css";
import AppNavbar from "./AppNavbar";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart } = useCart(); // Use context functions
  const [selectedItems, setSelectedItems] = useState(new Set()); // Track selected item IDs

  // Increase item quantity
  const handleIncrease = (id) => {
    updateQuantity(id, cartItems.find((item) => item.id === id).quantity + 1);
  };

  // Decrease item quantity (minimum 1)
  const handleDecrease = (id) => {
    const currentItem = cartItems.find((item) => item.id === id);
    if (currentItem.quantity > 1) {
      updateQuantity(id, currentItem.quantity - 1);
    }
  };

  // Remove item
  const handleRemove = (id) => {
    removeFromCart(id);
  };

  // Toggle checkbox for item selection
  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Calculate total (only for selected items)
  const total = cartItems
    .filter((item) => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Navigate to Checkout
  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to checkout!");
      return;
    }
    navigate("/checkout", {
      state: { selectedItems: Array.from(selectedItems) },
    });
  };

  // Navigate back to homepage (inside app) to add more items
  const handleAddAnother = () => {
    navigate("/inside-app");
  };

  return (
    <div className="cart-wrapper">
      <AppNavbar />
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
                <input
                  type="checkbox"
                  className="cart-checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  title="Select item for checkout"
                />
                <img
                  src={item.img || "/placeholder.jpg"}
                  alt={item.name}
                  className="cart-img"
                />
                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p>₱{item.price.toLocaleString()}</p>
                  <p>Service: {item.type}</p>{" "}
                  {/* Added: Display service type */}
                  <div className="quantity-control">
                    <button
                      onClick={() => handleDecrease(item.id)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleIncrease(item.id)}>+</button>
                  </div>
                </div>
                <div className="cart-right">
                  <p className="cart-subtotal">
                    ₱{(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Actions - Always show "Add Another Item", conditionally show checkout */}
        <div className="cart-summary">
          {selectedItems.size > 0 && <h3>Total: ₱{total.toLocaleString()}</h3>}
          <div className="cart-actions">
            <button
              className="add-another-btn"
              onClick={handleAddAnother}
              title="Add more items to your cart"
            >
              + Add Another Item
            </button>
            {selectedItems.size > 0 && (
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
    </div>
  );
}
