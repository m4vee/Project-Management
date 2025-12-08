import React, { useState, useEffect } from "react";
// Import createProduct from api service
import { createProduct } from "../../services/api"; 
import "./PostItemModal.css";

const PostItemModal = ({ isOpen, onClose, activeFilter }) => {
  // Determine default listing type
  const defaultType = 
    activeFilter === "buy/sell" ? "sell" :
    activeFilter === "rent" ? "rent" :
    activeFilter === "swap" ? "swap" : "sell";

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("New");
  const [price, setPrice] = useState("");
  const [rentDuration, setRentDuration] = useState("");
  const [itemWanted, setItemWanted] = useState("");
  const [availability, setAvailability] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); 

  const [listingType, setListingType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync listing type when modal opens
  useEffect(() => {
    if (isOpen) {
      setListingType(defaultType);
      setError(""); 
    }
  }, [isOpen, activeFilter, defaultType]);

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
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const getTitle = () => {
    switch (listingType) {
      case "sell": return "Sell Your Item";
      case "rent": return "Rent Out Your Item";
      case "swap": return "Swap Your Item";
      default: return "Post Item";
    }
  };

  const resetForm = () => {
    setItemName("");
    setDescription("");
    setCategory("");
    setCondition("New");
    setPrice("");
    setRentDuration("");
    setItemWanted("");
    setAvailability([]);
    setImage(null);
    setImagePreview(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        throw new Error("You must be logged in to post.");
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append("seller_id", userId);
      formData.append("name", itemName);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("listing_type", listingType);
      formData.append("availability", availability.join(",")); 

      // Handle Price logic
      if (listingType === "sell") {
        if (!price) throw new Error("Price is required for selling.");
        formData.append("price", price);
      } else if (listingType === "rent") {
        if (!price) throw new Error("Rental price is required.");
        formData.append("price", price); // Backend maps to price/rental_price
        formData.append("description", `${description} \n(Duration: ${rentDuration || "Not specified"})`); 
      } else if (listingType === "swap") {
        formData.append("price", 0);
        formData.append("description", `${description} \n(Wants: ${itemWanted || "Any"})`); 
      }

      if (image) {
        formData.append("image", image);
      } else {
         // Optional: Throw error if image is mandatory
         // throw new Error("Image is required.");
      }

      // Use the API service function
      await createProduct(formData);

      alert("Item posted successfully!");
      resetForm();
      onClose(); 

    } catch (err) {
      console.error("Error posting product:", err);
      setError(err.message || "Failed to post product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSpecificFields = () => {
    if (listingType === "sell") {
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
    if (listingType === "rent") {
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
          </div>
        </>
      );
    }
    if (listingType === "swap") {
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-post" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
           <h2>{getTitle()}</h2>
           <button className="modal-close-btn" onClick={onClose} disabled={loading}>
             &times;
           </button>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fa-solid fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Image Upload Preview Section */}
          <div className="form-group" style={{textAlign: 'center', marginBottom: '20px'}}>
             <label htmlFor="imageUpload" style={{cursor: 'pointer'}}>
                {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '2px dashed #ccc'}} 
                    />
                ) : (
                    <div style={{
                        padding: '30px', 
                        border: '2px dashed #ccc', 
                        borderRadius: '8px', 
                        color: '#666',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fa-solid fa-cloud-arrow-up" style={{fontSize: '2rem'}}></i>
                        <span>Click to Upload Image *</span>
                    </div>
                )}
             </label>
             <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
              style={{display: 'none'}} 
              required={!image} // Make required only if no image selected yet
            />
          </div>

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
                <option value="Electronics">Electronics</option>
                <option value="Books">Books</option>
                <option value="Clothing">Clothing/Uniform</option>
                <option value="Furniture">Furniture</option>
                <option value="Sports">Sports & Outdoors</option>
                <option value="Gadgets">Gadgets</option>
                <option value="Others">Others</option>
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
                <option value="New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          {renderSpecificFields()}

          <div className="form-group">
            <label>Meetup Availability</label>
            <small style={{display: 'block', marginBottom: '5px', color: '#666'}}>Select days you're available to meet</small>
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

          <button type="submit" className="submit-post-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Posting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i> Submit Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItemModal;