import React from "react";
import { Link } from "react-router-dom";
import "./RatingBox.css";

export default function RatingBox({ sellerId, reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="rating-box-polished">
        <h4>Rating</h4>
        <p className="no-reviews">No reviews yet</p>
      </div>
    );
  }

  const avg =
    Math.round(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
    ) / 10;

  return (
    <div className="rating-wrapper">
    <div className="rating-box-polished">
      <h4>Rating</h4>

      <div className="rating-main">
        <span className="rating-number">{avg}</span>
        <span className="rating-stars">{renderStars(avg)}</span>
      </div>

      <p className="review-count">{reviews.length} reviews</p>

    <div className="view-reviews-wrapper">
      <Link to={`/reviews/${sellerId}`} className="view-reviews-link">
        View all reviews →
      </Link>
    </div>
    </div>
    </div>
  );
}

function renderStars(avg) {
  const full = Math.floor(avg);
  const half = avg % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <>
      {"★".repeat(full)}
      {half && "☆"}
      {"☆".repeat(empty)}
    </>
  );
}
