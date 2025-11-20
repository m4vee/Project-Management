import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from "../AppNavbar";   // <-- IMPORT DITO
import './Feedback.css';

const Feedback = () => {
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleBackClick = () => {
    navigate('/profile');
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleSubmit = () => {
    if (rating === 0 || feedback.trim() === '') {
      setMessage('Please provide both feedback and a rating.');
      return;
    }

    console.log('Feedback:', feedback);
    console.log('Rating:', rating);

    setMessage('Thank you for your feedback!');
    navigate('/profile');
  };

  return (
    <>
      <AppNavbar />

      <div className="feedback-container">

        <button className="back-button" onClick={handleBackClick}>
          &#8592; Back
        </button>

        <h1>Give Feedback</h1>

        <div className="feedback-form">
          <textarea
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Enter your feedback here..."
            rows="4"
          />

          <div className="rating">
            <span>Rate your experience:</span>

            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'selected' : ''}`}
                onClick={() => handleRatingChange(star)}
              >
                &#9733;
              </span>
            ))}
          </div>

          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </>
  );
};

export default Feedback;
