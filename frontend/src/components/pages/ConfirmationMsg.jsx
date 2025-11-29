import React from "react";
import "./ConfirmationMsg.css";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, actionType, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay" onClick={onClose}>
      <div className="confirmation-box" onClick={(e) => e.stopPropagation()}>
        <h3>Confirm {actionType}</h3>
        <p>Are you sure you want to {actionType.toLowerCase()} <strong>{itemName}</strong>?</p>
        <div className="confirmation-buttons">
          <button className="cancel-btn" onClick={onClose}>No</button>
          <button className="confirm-btn" onClick={onConfirm}>Yes</button>
          
        </div>
      </div>
    </div>
  );
}
