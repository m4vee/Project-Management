import React, { useState } from "react";
import "./ReviewModal.css";

export default function ReviewModal({ onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  return (
    
    <div className="review-modal-overlay">
      <div className="review-modal">

        <h2>Add Review</h2>

        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className="star"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                color: star <= (hover || rating) ? "#ffc107" : "#ccc"
              }}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          className="review-textarea"
          placeholder="Write your review..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="submit-btn"
            onClick={() => onSubmit({ rating, text })}
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
}
