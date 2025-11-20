import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../AppNavbar";
import './MyProfile.css';


const MyProfile = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("Krislyn Sayat");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [birthday, setBirthday] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ⭐ Added profile image + file input ref
  const [profileImg, setProfileImg] = useState("/images/mikha.webp");
  const fileRef = useRef(null);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleUpdateClick = () => {
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const handleLogout = () => {
    navigate('/');
  };

  // ⭐ Click on image → open file picker
  const handleImageClick = () => {
    fileRef.current.click();
  };

  // ⭐ When user selects image → update preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImg(reader.result); 
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <AppNavbar />

      <div className="my-profile-container">
        <button className="my-back-button" onClick={handleBackClick}>
          &#8592; Back
        </button>

        <div className="my-profile-header">

          {/* ⭐ Profile Image Click → Choose File */}
          <div
            className="my-profile-image"
            onClick={handleImageClick}
            style={{ cursor: "pointer" }}
          >
            <img src={profileImg} alt="profile" />

            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileRef}
              onChange={handleImageChange}
            />
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
