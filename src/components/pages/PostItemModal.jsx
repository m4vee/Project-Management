import React, { useState } from 'react';
import './PostItemModal.css';

const PostItemModal = ({ isOpen, onClose, activeFilter }) => {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [rentDuration, setRentDuration] = useState('');
  const [itemWanted, setItemWanted] = useState('');
  // --- This state will hold the selected days ---
  const [availability, setAvailability] = useState([]);

  if (!isOpen) return null;

  // --- This function handles checking/unchecking the boxes ---
  const handleAvailabilityChange = (day) => {
    setAvailability((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day) // If day is already in array, remove it
        : [...prev, day] // Otherwise, add it
    );
  };

  const getTitle = () => {
    switch (activeFilter) {
      case 'buy/sell': return 'Sell Your Item';
      case 'rent': return 'Rent Out Your Item';
      case 'swap': return 'Swap Your Item';
      default: return 'Post Item';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // When you submit, it will now include the array of selected days
    console.log({
      type: activeFilter,
      itemName,
      description,
      category,
      price,
      rentDuration,
      itemWanted,
      availability,
    });
    onClose();
  };

  const renderSpecificFields = () => {
    // ... (This function is unchanged and correct)
    if (activeFilter === 'buy/sell') {
      return (
        <div className="form-group">
          <label htmlFor="price">Price (₱)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 500" required />
        </div>
      );
    }
    if (activeFilter === 'rent') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="price">Rent Price (₱)</label>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 100" required />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Rent Duration</label>
            <input type="text" id="duration" value={rentDuration} onChange={(e) => setRentDuration(e.target.value)} placeholder="e.g., per day, per week" required />
          </div>
        </>
      );
    }
    if (activeFilter === 'swap') {
      return (
        <div className="form-group">
          <label htmlFor="itemWanted">Item Wanted in Return</label>
          <input type="text" id="itemWanted" value={itemWanted} onChange={(e) => setItemWanted(e.target.value)} placeholder="e.g., old textbooks, calculator" required />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-post" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2>{getTitle()}</h2>
        <form onSubmit={handleSubmit}>
          {/* --- Existing form fields --- */}
          <div className="form-group">
            <label htmlFor="itemName">Item Name</label>
            <input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select a category</option>
              <option value="arts">Arts and Crafts</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="uniform">Uniform</option>
              <option value="gadgets">Gadgets</option>
              <option value="others">Others School Stuffs</option>
            </select>
          </div>

          {renderSpecificFields()}
          
          {/* --- This is the new section for availability --- */}
          <div className="form-group">
            <label>Meetup Availability</label>
            <div className="availability-grid">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <label key={day} className="day-checkbox">
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
          
          <div className="form-group">
            <label htmlFor="imageUpload">Upload Image</label>
            <input type="file" id="imageUpload" accept="image/*" required />
          </div>
          <button type="submit" className="submit-post-btn">Submit Post</button>
        </form>
      </div>
    </div>
  );
};

export default PostItemModal;

