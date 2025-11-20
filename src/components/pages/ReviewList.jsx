import React, { useEffect, useState } from "react";
import ReviewCard from "./ReviewModal";

export default function ReviewList({ sellerId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8080/reviews/seller/${sellerId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data));
  }, [sellerId]);

  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
      )}
    </div>
  );
}
