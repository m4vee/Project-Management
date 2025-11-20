import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ReviewsPage.css";
import ReviewModal from "./ReviewModal";
import AppNavbar from "../AppNavbar";

export default function SellerReviewsPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([
    {
      id: 1,
      rating: 5,
      username: "krislyn01",
      text: "Super smooth transaction! Highly recommended.",
      date: "2024-01-20",
    },
    {
      id: 2,
      rating: 4,
      username: "paulgie23",
      text: "Item arrived in good condition. Seller was helpful.",
      date: "2024-02-10",
    },
    {
      id: 3,
      rating: 5,
      username: "marie_angel",
      text: "Legit seller! Thank you!",
      date: "2024-03-05",
    },
  ]);

  // 🔥 AUTO-COMPUTE RATING COUNTS BASED ON REVIEWS ARRAY
  const ratingStats = useMemo(() => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      stats[r.rating]++;
    });
    return stats;
  }, [reviews]);

  const totalRatings = Object.values(ratingStats).reduce((a, b) => a + b, 0);

  const RatingBar = ({ stars, count }) => {
    const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

    return (
      <div className="rating-row">
        <span className="star-label">{stars}★</span>

        <div className="bar-background">
          <div className="bar-fill" style={{ width: `${percent}%` }}></div>
        </div>

        <span className="rating-count">{count}</span>
      </div>
    );
  };

  const [showModal, setShowModal] = useState(false);

  // 🔥 WHEN USER SUBMITS A NEW REVIEW
  const handleSubmitReview = ({ rating, text }) => {
    if (!rating || text.trim() === "") {
      alert("Please add a rating and review text.");
      return;
    }

    setReviews((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        username: "You",
        rating: Number(rating),
        text,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);

    setShowModal(false);
  };

  return (
    <>
      <AppNavbar />

      <div className="reviews-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h2 className="title">Reviews for Seller {sellerId}</h2>

        <button className="add-review-btn" onClick={() => setShowModal(true)}>
          + Add Review
        </button>

        {/* ⭐ AUTO CHART COMPUTATION */}
        <div className="rating-summary-section">
          {[5, 4, 3, 2, 1].map((s) => (
            <RatingBar key={s} stars={s} count={ratingStats[s]} />
          ))}
        </div>

        {/* REVIEW LIST */}
        {reviews.map((rev) => (
          <div key={rev.id} className="review-card">
            <div className="review-header">
              <span>{rev.username}</span>
              <span>{rev.date}</span>
            </div>

            <div className="stars">
              {"★".repeat(rev.rating)}
              {"☆".repeat(5 - rev.rating)}
            </div>

            <p className="review-text">{rev.text}</p>
          </div>
        ))}

        {showModal && (
          <ReviewModal
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmitReview}
          />
        )}
      </div>
    </>
  );
}
