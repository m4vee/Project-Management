import React, { useState, useRef } from "react";
import "./PostActionModal.css";

const PostActionModal = ({ post, onClose, onDelete, onEdit }) => {
  const [title, setTitle] = useState(post.title);
  const [desc, setDesc] = useState(post.desc);
  const [price, setPrice] = useState(post.price);
  const [category, setCategory] = useState(post.category);
  const [image, setImage] = useState(post.img);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // New error state

  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (!title || !desc || !price || !category) {
      setErrorMessage("All fields must be filled out!"); // Show error if fields are missing
      return;
    }

    const updatedPost = {
      id: post.id,
      title,
      desc,
      price,
      category,
      img: image,
    };
    onEdit(updatedPost);
    setErrorMessage(""); // Clear error on successful save
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      onDelete(post.id);
      setShowDeleteConfirm(false); // Close delete confirmation
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Post</h3>

        {/* Error Message Display */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <div className="form-row">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-row">
          <label>Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="form-row">
          <label>Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Buy/Sell</option>
            <option>Rent</option>
            <option>Swap</option>
          </select>
        </div>

        <div className="form-row">
          <label>Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {image && <img src={image} alt="Preview" />}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={handleSave}>
            Save Changes
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => setShowDeleteConfirm(true)} // Show confirmation modal
          >
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="confirmation-modal">
          <div className="confirmation-card">
            <h4>Are you sure you want to delete this post?</h4>
            <div className="confirmation-actions">
              <button
                className="btn cancel"
                onClick={() => setShowDeleteConfirm(false)} // Close confirmation modal
              >
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={handleDelete} // Proceed with deletion
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostActionModal;
