import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './MyProfile.css'; // Ensure your styles are correctly linked
import AppNavbar from "../AppNavbar";


const MyProfile = () => {
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const [name, setName] = useState("Krislyn Sayat");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [birthday, setBirthday] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // State for success message

  // Handle the back button
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page in the browser history
  };

  // Handle the "Update" button click
  const handleUpdateClick = () => {
    // Assuming here you'd save or handle the data, for now we show success
    setSuccessMessage("Profile updated successfully!"); // Set success message
    setTimeout(() => {
      setSuccessMessage(""); // Clear the message after a few seconds
    }, 3000); // Clear after 3 seconds
  };

  // Handle "Log Out" functionality - navigate to the home page
  const handleLogout = () => {
    navigate('/'); // Redirect to the home page on logout
  };

  return (
    <>
    <AppNavbar />
    <div className="my-profile-container">
      {/* Back Button */}
      <button className="my-back-button" onClick={handleBackClick}>
        &#8592; Back
      </button>

      <div className="my-profile-header">
        <div className="my-profile-image">
          <img src="/images/mikha.webp" alt="profile" />
        </div>
        <div className="my-profile-name">
          <h1>{name}</h1>
        </div>
      </div>

      <div className="my-personal-details">
        <div className="my-form-group">
          <label>Full Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Program:</label>
          <input type="text" value={program} onChange={(e) => setProgram(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Year Level:</label>
          <input type="text" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Birthday:</label>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Birthplace:</label>
          <input type="text" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Address:</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="my-form-group">
          <label>Contact No.:</label>
          <input type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="my-footer-buttons">
        <button className="my-update-button" onClick={handleUpdateClick}>Update</button>
        <button className="my-logout-button" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
    </>
  );
};

export default MyProfile;
