import React, { useState } from "react";
import { createProduct, addProductPhoto } from "../../services/api";
import "./PostItemModal.css";
import { uploadProductImage } from "../../services/imageUpload";

const PostItemModal = ({ isOpen, onClose, activeFilter }) => {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("new");
  const [price, setPrice] = useState("");
  const [rentDuration, setRentDuration] = useState("");
  const [itemWanted, setItemWanted] = useState("");
  const [availability, setAvailability] = useState([]);
  const [image, setImage] = useState(null);

  // New states for API handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAvailabilityChange = (day) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const getTitle = () => {
    switch (activeFilter) {
      case "buy/sell":
        return "Sell Your Item";
      case "rent":
        return "Rent Out Your Item";
      case "swap":
        return "Swap Your Item";
      default:
        return "Post Item";
    }
  };

  const getListingType = () => {
    switch (activeFilter) {
      case "buy/sell":
        return "sell";
      case "rent":
        return "rent";
      case "swap":
        return "swap";
      default:
        return "sell";
    }
  };

  // Map your category names to category IDs from database
  const getCategoryId = (categoryName) => {
    const categoryMap = {
      electronics: 1,
      books: 2,
      clothing: 3,
      arts: 1, // Map to existing category or add new ones
      uniform: 3,
      gadgets: 1,
      others: 1,
    };
    return categoryMap[categoryName] || 1;
  };

  const resetForm = () => {
    setItemName("");
    setDescription("");
    setCategory("");
    setCondition("new");
    setPrice("");
    setRentDuration("");
    setItemWanted("");
    setAvailability([]);
    setImage(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get logged-in user
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.user_id) {
        setError("Please log in to post items.");
        setLoading(false);
        return;
      }

      // Prepare product data for backend
      const productData = {
        name: itemName,
        description: description,
        condition: condition,
        category_id: getCategoryId(category),
        listing_type: getListingType(),
        role_in_post: "seller",
        posted_by: user.user_id,
      };

      // Add price based on listing type
      if (activeFilter === "buy/sell") {
        productData.price = parseFloat(price);
        productData.rental_price = null;
      } else if (activeFilter === "rent") {
        productData.price = null;
        productData.rental_price = parseFloat(price);
      } else if (activeFilter === "swap") {
        productData.price = null;
        productData.rental_price = null;
      }

      console.log("Submitting product data:", productData);

      // Create product in database
      const newProduct = await createProduct(productData);

      console.log("Product created successfully:", newProduct);

      if (image) {
        console.log("Uploading image...");
        const imageUrl = await uploadProductImage(image);
        console.log("Image uploaded:", imageUrl);

        // Save image URL to database
        await addProductPhoto(newProduct.product_id, imageUrl);
        console.log("Image URL saved to database");
      }

      // TODO: Save availability if you have availability endpoint
      if (availability.length > 0 && newProduct.product_id) {
        await saveProductAvailability(newProduct.product_id, availability);
      }

      alert("Product posted successfully!");
      resetForm();
      onClose(); // This will trigger refresh in HomePage
    } catch (err) {
      console.error("Error posting product:", err);
      setError(err.message || "Failed to post product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificFields = () => {
    if (activeFilter === "buy/sell") {
      return (
        <div className="form-group">
          <label htmlFor="price">Price (₱) *</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 500"
            min="0"
            step="0.01"
            required
            disabled={loading}
          />
        </div>
      );
    }
    if (activeFilter === "rent") {
      return (
        <>
          <div className="form-group">
            <label htmlFor="price">Rent Price (₱/day) *</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 100"
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Rent Duration</label>
            <input
              type="text"
              id="duration"
              value={rentDuration}
              onChange={(e) => setRentDuration(e.target.value)}
              placeholder="e.g., 3 days minimum"
              disabled={loading}
            />
            <small>Optional: Add rental duration notes</small>
          </div>
        </>
      );
    }
    if (activeFilter === "swap") {
      return (
        <div className="form-group">
          <label htmlFor="itemWanted">Item Wanted in Return</label>
          <input
            type="text"
            id="itemWanted"
            value={itemWanted}
            onChange={(e) => setItemWanted(e.target.value)}
            placeholder="e.g., old textbooks, calculator"
            disabled={loading}
          />
          <small>Optional: What would you like to swap for?</small>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-post" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2>{getTitle()}</h2>

        {error && (
          <div className="error-banner">
            <i className="fa-solid fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="itemName">Item Name *</label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., iPhone 13 Pro Max"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              rows="4"
              required
              disabled={loading}
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="books">Books</option>
                <option value="clothing">Clothing/Uniform</option>
                <option value="arts">Arts and Crafts</option>
                <option value="gadgets">Gadgets</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
                disabled={loading}
              >
                <option value="new">New</option>
                <option value="like new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          {renderSpecificFields()}

          <div className="form-group">
            <label>Meetup Availability</label>
            <small>Select days you're available to meet</small>
            <div className="availability-grid">
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={availability.includes(day)}
                    onChange={() => handleAvailabilityChange(day)}
                    disabled={loading}
                  />
                  <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageUpload">Upload Image</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
            <small>Optional: Image upload feature coming soon</small>
          </div>

          <button type="submit" className="submit-post-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Posting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i> Submit Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItemModal;
