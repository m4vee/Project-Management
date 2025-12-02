import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css'; // Make sure your styles are correctly linked
import AppNavbar from '../AppNavbar';


const Feedback = () => {
  const navigate = useNavigate();

  // State hooks for managing inputs
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0); // Default to 0, no rating
  const [message, setMessage] = useState('');

  // Handle back button click
  const handleBackClick = () => {
    navigate('/profile'); // Change to desired route if necessary
  };

  // Handle rating change
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  // Handle feedback text change
  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  // Handle submit
  const handleSubmit = () => {
    if (rating === 0 || feedback.trim() === '') {
      setMessage('Please provide both feedback and a rating.');
      return;
    }

    // Save feedback and rating here (e.g., send to backend or save in state)
    console.log('Feedback:', feedback);
    console.log('Rating:', rating);

    setMessage('Thank you for your feedback!');
    // Redirect to the profile page after saving
    navigate('/profile');
  };

  return (
    <>
    <AppNavbar />
    <div className="feedback-container">
      {/* Back Button */}
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
