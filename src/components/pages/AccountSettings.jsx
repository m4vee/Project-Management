import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from "../AppNavbar";   
import './AccountSettings.css';

const AccountSettings = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [deactivateAccount, setDeactivateAccount] = useState(false);

  const handleBackClick = () => {
    navigate('/profile');
  };

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all fields!');
      return;
    }

    console.log('Changes Saved:', { currentPassword, newPassword, notifications });
    navigate('/profile');
  };

  return (
    <>
      <AppNavbar />

      <div className="account-settings-container">

        <button className="back-button" onClick={handleBackClick}>
          &#8592; Back
        </button>

        <h1>Account Settings</h1>

        <section className="settings-section">
          <h2>Login and Security</h2>
          <div className="setting-item">
            <label>Change Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="setting-item">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="setting-item">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="setting-item">
            <button onClick={handleSave}>Change</button>
          </div>
        </section>

        <section className="settings-section">
          <h2>Notifications</h2>
          <div className="setting-item">
            <label>Notifications</label>
            <div className="toggle-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                />
                <span className="slider" />
              </label>
              <span>{notifications ? "On" : "Off"}</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Account</h2>
          <div className="setting-item">
            <label>Delete Account</label>
            <div className="toggle-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deleteAccount}
                  onChange={() => setDeleteAccount(!deleteAccount)}
                />
                <span className="slider" />
              </label>
              <span>{deleteAccount ? "On" : "Off"}</span>
            </div>
          </div>

          <div className="setting-item">
            <label>Deactivate Account</label>
            <div className="toggle-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deactivateAccount}
                  onChange={() => setDeactivateAccount(!deactivateAccount)}
                />
                <span className="slider" />
              </label>
              <span>{deactivateAccount ? "On" : "Off"}</span>
            </div>
          </div>
        </section>

        <div className="save-button-container">
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

export default AccountSettings;
