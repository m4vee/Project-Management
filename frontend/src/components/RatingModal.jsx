import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { submitRating } from "../services/api";
import "./RatingModal.css";

export default function RatingModal({ isOpen, onClose, ratingData, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHover(0);
            setReviewText("");
            setIsSubmitting(false);
        }
    }, [isOpen, ratingData]);

    if (!isOpen || !ratingData) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert("Please select a star rating.");
            return;
        }

        setIsSubmitting(true);
        
        const payload = {
            rater_id: ratingData.rater_id,
            rated_user_id: ratingData.rate_target_id,
            transaction_type: ratingData.rate_type,
            transaction_id: ratingData.rate_trans_id,
            rating: rating,
            review_text: reviewText.trim(),
        };

        try {
            await submitRating(payload);
            if (onSuccess) onSuccess(); 
            onClose(); 
        } catch (error) {
            console.error("Rating Error:", error);
            alert("Failed to submit rating. You might have already rated this.");
            setIsSubmitting(false);
        }
    };

    const targetName = ratingData.target_name || "the user";

    return (
        <div className="rating-modal-overlay">
            <div className="rating-modal-content glass-effect">
                <div className="modal-header">
                    <h3>Rate Experience</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    <p>How was your transaction with <strong>{targetName}</strong>?</p>
                    
                    <div className="star-rating-container">
                        {[...Array(5)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <FaStar
                                    key={index}
                                    className="star"
                                    color={starValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHover(starValue)}
                                    onMouseLeave={() => setHover(rating)}
                                    size={35}
                                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                />
                            );
                        })}
                    </div>

                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write a comment (optional)..."
                        maxLength={255}
                    />

                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || rating === 0}
                        className="submit-rating-btn"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                    </button>
                </div>
            </div>
        </div>
    );
}