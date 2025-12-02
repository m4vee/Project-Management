import React, { useState, useRef, useEffect } from "react";
import "./PostActionModal.css";

const PostActionModal = ({ post, onClose, onDelete, onEdit }) => {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDescription] = useState(post.desc || "");
  const [category, setCategory] = useState(post.category || "Buy/Sell");
  const [itemCategory, setItemCategory] = useState(post.itemCategory || "");
  const [condition, setCondition] = useState(post.condition || "Good");
  const [price, setPrice] = useState(post.price || "");
  const [rentDuration, setRentDuration] = useState(post.rentDuration || "");
  const [itemWanted, setItemWanted] = useState(post.itemWanted || "");
  const [availability, setAvailability] = useState(post.meetup || []);
  // Initialize images safely as an array
  const [images, setImages] = useState(Array.isArray(post.img) ? post.img : post.img ? [post.img] : []);

  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
  setTitle(post.title || "");
  setDescription(post.desc || "");
  setCategory(post.category || "Buy/Sell");
  setItemCategory(post.itemCategory || "");
  setCondition(post.condition || "Good");
  setPrice(post.price || "");
  setRentDuration(post.rentDuration || "");
  setItemWanted(post.itemWanted || "");
  setAvailability(post.meetup || []);
  setImages(Array.isArray(post.img) ? post.img : post.img ? [post.img] : []);
  }, [post]);


  const handleAvailabilityChange = (day) => {
    setAvailability(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  const previewURLs = files.map(f => URL.createObjectURL(f));
  setImages(previewURLs);
};


  const handleSave = () => {
    if (!title || !description || !category) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    const updatedPost = {
      ...post,
      title,
      desc: description,
      category,
      itemCategory,
      condition,
      price,
      rentDuration,
      itemWanted,
      meetup: availability,
      img: images
    };

    onEdit(updatedPost);
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <button className="edit-close-btn" onClick={onClose}>×</button>
        <h2>Edit Post</h2><br></br>
        {errorMessage && <div className="edit-error-message">{errorMessage}</div>}

        <div className="edit-scroll-area">
          {/* ITEM NAME */}
          <div className="edit-form-group">
            <label>Item Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="edit-form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          {/* MAIN CATEGORY */}
          <div className="edit-form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select a category</option>
              <option value="Buy/Sell">Buy/Sell</option>
              <option value="Rent">Rent</option>
              <option value="Swap">Swap</option>
            </select>
          </div>

          {/* ITEM CATEGORY */}
          <div className="edit-form-group">
            <label>Item Category</label>
            <select value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
              <option value="" disabled hidden>Select Category</option>
              <option value="arts">Arts and Crafts</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="uniform">Uniform</option>
              <option value="gadgets">Gadgets</option>
              <option value="others">Other School Stuffs</option>
            </select>
          </div>

          {/* CONDITION (Buy/Sell only) */}
          
            <div className="edit-form-group">
              <label>Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                <option>New</option>
                <option>Good</option>
                <option>Used</option>
              </select>
            </div>
          

          {/* PRICE */}
          {(category === "Buy/Sell" || category === "Rent") && (
            <div className="edit-form-group">
              <label>Price (₱)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          )}

          {/* RENT DURATION */}
          {category === "Rent" && (
            <div className="edit-form-group">
              <label>Rent Duration (days)</label>
              <input type="number" value={rentDuration} onChange={e => setRentDuration(e.target.value)} />
            </div>
          )}

          {/* SWAP ITEM */}
          {category === "Swap" && (
            <div className="edit-form-group">
              <label>Looking to Swap For</label>
              <input type="text" value={itemWanted} onChange={e => setItemWanted(e.target.value)} />
            </div>
          )}

          {/* Meetup Availability */}
          <div className="edit-form-group">
            <label>Meetup Availability</label>
            <div className="edit-availability-grid">
              {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(day => (
                <label className="edit-checkbox-day" key={day}>
                  <input
                    type="checkbox"
                    checked={availability.includes(day)}
                    onChange={() => handleAvailabilityChange(day)}
                  />
                  <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div className="edit-form-group">
            <label>Upload Images</label>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple />
            {images.length > 0 && (
              <div className="edit-image-preview-row">
                {images.map((src, i) => (
                  <img key={i} src={src} alt="Preview" className="edit-image-preview" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="edit-action-buttons">
          <button className="edit-btn cancel" onClick={onClose}>Cancel</button>
          <button className="edit-btn primary" onClick={() => {
            if (window.confirm("Do you want to save the changes?")) handleSave();
          }}>Save Changes</button>
          <button className="edit-btn danger" onClick={() => {
            if (window.confirm("Are you sure you want to delete this post?")) onDelete(post.id);
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default PostActionModal;
