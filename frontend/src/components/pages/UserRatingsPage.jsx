import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserProfile, fetchAllUserReviews } from "../../services/api"; 
import { FaStar, FaThumbsUp, FaThumbsDown } from "react-icons/fa"; 
import "./UserRatingsPage.css"; 

const BACKEND_URL = "http://127.0.0.1:5000";
const DEFAULT_AVATAR = "/images/default-profile.jpg";

const UserRatingsPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [profileName, setProfileName] = useState("Loading...");
    const [loading, setLoading] = useState(true);

    const loadReviews = useCallback(async () => {
        try {
            setLoading(true);
            const profileData = await fetchUserProfile(userId, null);
            setProfileName(profileData.username);

            const reviewData = await fetchAllUserReviews(userId);
            
            // Adding dummy reaction data for UI demo (Backend connection required for permanent save)
            const reviewsWithReactions = reviewData.map(r => ({
                ...r,
                likes: Math.floor(Math.random() * 10), // Mock data
                dislikes: 0,
                userReaction: null // 'like', 'dislike', or null
            }));

            setReviews(reviewsWithReactions);

        } catch (error) {
            console.error("Failed to load reviews:", error);
            setProfileName("User Not Found");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    // --- REACTION LOGIC (Like/Dislike) ---
    const handleReaction = (index, type) => {
        setReviews(prev => prev.map((rev, i) => {
            if (i !== index) return rev;

            let newLikes = rev.likes;
            let newDislikes = rev.dislikes;
            let newReaction = type;

            // If clicking the same button, remove reaction (toggle off)
            if (rev.userReaction === type) {
                newReaction = null;
                if (type === 'like') newLikes--;
                else newDislikes--;
            } 
            // If switching (e.g., from Like to Dislike)
            else {
                if (rev.userReaction === 'like') newLikes--;
                if (rev.userReaction === 'dislike') newDislikes--;
                
                if (type === 'like') newLikes++;
                else newDislikes++;
            }

            return { ...rev, likes: newLikes, dislikes: newDislikes, userReaction: newReaction };
        }));
        
        // TODO: Call API here to save reaction to database
    };

    const ratingStats = useMemo(() => {
        const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRatingSum = 0;

        reviews.forEach((review) => {
            const r = Math.round(review.rating);
            if (stats[r] !== undefined) stats[r]++;
            totalRatingSum += review.rating;
        });

        const totalCount = reviews.length;
        const average = totalCount > 0 ? (totalRatingSum / totalCount).toFixed(1) : "0.0";

        return { counts: stats, total: totalCount, average };
    }, [reviews]);

    const handleRaterClick = (raterId) => {
        navigate(`/profile/${raterId}`);
    };

    const renderStars = (rating) => (
        <span className="review-stars">
            {[...Array(5)].map((_, i) => (
                <FaStar key={i} size={14} color={i < rating ? '#ffc107' : '#e4e5e9'} />
            ))}
        </span>
    );
    
    if (loading) return <div className="ratings-page-wrapper loading-state">Loading reviews...</div>;

    return (
        <div className="ratings-page-wrapper">
            <div className="ratings-header-nav">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h2>Reviews for {profileName}</h2>
            </div>

            <div className="ratings-content">
                {/* --- SUMMARY CARD --- */}
                <div className="rating-summary-card">
                    <div className="summary-left">
                        <div className="big-score">{ratingStats.average}</div>
                        <div className="big-stars">{renderStars(Math.round(parseFloat(ratingStats.average)))}</div>
                        <p className="total-reviews-text">{ratingStats.total} Ratings</p>
                    </div>
                    <div className="summary-right">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingStats.counts[star];
                            const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                            return (
                                <div key={star} className="rating-row">
                                    <span className="star-label">{star} <FaStar size={10} style={{marginBottom: 1, marginLeft: 2, color: '#666'}}/></span>
                                    <div className="bar-background">
                                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="rating-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- REVIEW LIST --- */}
                <div className="reviews-list-container">
                    {reviews.length === 0 ? (
                        <div className="no-reviews-state">
                            <i className="fa-solid fa-star-half-stroke"></i>
                            <p>No reviews yet.</p>
                        </div>
                    ) : (
                        reviews.map((review, index) => (
                            <div key={index} className="review-card aesthetic-card">
                                {/* LEFT SIDE: Avatar */}
                                <div className="card-left" onClick={() => handleRaterClick(review.rater_id)}>
                                    <img 
                                        src={review.rater_profile_image ? `${BACKEND_URL}${review.rater_profile_image}` : DEFAULT_AVATAR} 
                                        alt={review.rater_name} 
                                        className="reviewer-avatar-large"
                                        onError={(e) => {e.target.src = DEFAULT_AVATAR}}
                                    />
                                </div>

                                {/* RIGHT SIDE: Content */}
                                <div className="card-right">
                                    <div className="card-header-row">
                                        <div className="user-meta">
                                            <h4 onClick={() => handleRaterClick(review.rater_id)}>{review.rater_name}</h4>
                                            <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`transaction-badge ${review.transaction_type}`}>
                                            {review.transaction_type}
                                        </span>
                                    </div>

                                    <div className="card-stars-row">
                                        {renderStars(review.rating)}
                                    </div>

                                    <p className="review-text">
                                        {review.review_text || "No comments provided."}
                                    </p>

                                    {/* LIKE / DISLIKE BUTTONS */}
                                    <div className="review-actions">
                                        <button 
                                            className={`btn-reaction ${review.userReaction === 'like' ? 'active' : ''}`}
                                            onClick={() => handleReaction(index, 'like')}
                                        >
                                            <FaThumbsUp /> 
                                            <span>{review.likes > 0 ? review.likes : 'Helpful'}</span>
                                        </button>

                                        <button 
                                            className={`btn-reaction ${review.userReaction === 'dislike' ? 'active' : ''}`}
                                            onClick={() => handleReaction(index, 'dislike')}
                                        >
                                            <FaThumbsDown />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserRatingsPage;