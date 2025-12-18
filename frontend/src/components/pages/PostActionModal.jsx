import React, { useState, useRef, useEffect } from "react";
import "./PostActionModal.css";

const PostActionModal = ({ post, onClose, onDelete, onEdit }) => {
  const [title, setTitle] = useState(post.name || ""); 
  const [description, setDescription] = useState(post.description || "");
  const [category, setCategory] = useState(post.listing_type || "sell");
  const [itemCategory, setItemCategory] = useState(post.category || "");
  const [condition, setCondition] = useState(post.condition || "Good");
  const [price, setPrice] = useState(post.price || "");
  
  const [rentDuration, setRentDuration] = useState(""); 
  const [itemWanted, setItemWanted] = useState("");

  const [availability, setAvailability] = useState([]);
  const [images, setImages] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post) {
        setTitle(post.name || "");
        setDescription(post.description || "");
        setCategory(post.listing_type || "sell");
        setItemCategory(post.category || "");
        setCondition(post.condition || "Good");
        setPrice(post.price || "");
        
        if (post.availability) {
            const availArray = post.availability.split(',').map(day => day.trim().toLowerCase());
            setAvailability(availArray);
        } else {
            setAvailability([]);
        }

        if (post.image_url) {
            setImages([post.image_url]);
        } else {
            setImages([]);
        }
    }
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
      id: post.id,
      seller_id: post.seller_id,
      
      // We map these to match what Profile.jsx expects or the DB columns directly
      title: title, 
      name: title,
      
      description: description,
      
      type: category,
      listing_type: category,
      
      category: itemCategory,
      condition: condition,
      price: price,
      
      availability: availability.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', '),
      
      image_url: images.length > 0 ? images[0] : "",
    };

    onEdit(updatedPost);
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal-container" onClick={e => e.stopPropagation()}>
        <button className="edit-close-btn" onClick={onClose}>×</button>
        <h2>Edit Post</h2>
        {errorMessage && <div className="edit-error-message">{errorMessage}</div>}

        <div className="edit-scroll-area">
          <div className="edit-form-group">
            <label>Item Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="edit-form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="edit-form-group">
            <label>Listing Type</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="sell">Buy/Sell</option>
              <option value="rent">Rent</option>
              <option value="swap">Swap</option>
            </select>
          </div>

          <div className="edit-form-group">
            <label>Item Category</label>
            <select value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
              <option value="" disabled>Select Category</option>
              <option value="arts">Arts and Crafts</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="uniform">Uniform</option>
              <option value="gadgets">Gadgets</option>
              <option value="others">Other School Stuffs</option>
            </select>
          </div>

          <div className="edit-form-group">
            <label>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Used">Used</option>
            </select>
          </div>

          {(category === "sell" || category === "rent") && (
            <div className="edit-form-group">
              <label>Price (₱)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          )}

          {category === "rent" && (
            <div className="edit-form-group">
              <label>Rent Duration (days)</label>
              <input type="number" value={rentDuration} onChange={e => setRentDuration(e.target.value)} />
            </div>
          )}

          {category === "swap" && (
            <div className="edit-form-group">
              <label>Looking to Swap For</label>
              <input type="text" value={itemWanted} onChange={e => setItemWanted(e.target.value)} />
            </div>
          )}

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

          <div className="edit-form-group">
            <label>Update Image</label>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
            
            {images.length > 0 && (
              <div className="edit-image-preview-row">
                <img src={images[0]} alt="Preview" className="edit-image-preview" />
              </div>
            )}
          </div>
        </div>

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