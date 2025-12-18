import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useRentalRequests } from "./RentalRequestContext";
import "./RentModal.css";

const RentModal = ({ isOpen, onClose, product }) => {
    const { addRentalRequest } = useRentalRequests();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date().toISOString().split("T")[0];

    if (!isOpen || !product || !product.id) return null;

    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffTime = Math.abs(endTime - startTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        return diffDays;
    }

    const calculateTotal = () => {
        const diffDays = calculateDays(startDate, endDate);
        // FIX: Tinitiyak na ang product.price ay Number (float) para sa tamang kalkulasyon
        const itemPrice = parseFloat(product.price) || 0;
        return diffDays * itemPrice;
    };

    const handleRent = async () => {
        const daysRequested = calculateDays(startDate, endDate);

        if (daysRequested < 2) { 
            alert("Rental request must be for at least 2 days (e.g., Dec 13 to Dec 14).");
            return;
        }

        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            alert("Please select valid start and end dates.");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            product_id: product.id,
            product_name: product.name, 
            startDate: startDate, 
            endDate: endDate,
            comment: comment.trim() || null
        };

        const success = await addRentalRequest(payload);

        setIsSubmitting(false);

        if (success) {
            onClose(); 
        }
    };
    
    const isConfirmDisabled = (
        isSubmitting || 
        !startDate || 
        !endDate || 
        (startDate && endDate && new Date(startDate) > new Date(endDate)) ||
        calculateDays(startDate, endDate) < 2
    );

    // FIX: Tinitiyak na ang product name ay tama, o gumamit ng default
    const modalTitle = product.name && product.name.trim() !== 'sds' 
        ? `Rent ${product.name}` 
        : (product.name === 'sds' ? 'Rent Item' : `Rent ${product.name}`);


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                
                <div className="modal-header-container">
                    <button className="close-btn" onClick={onClose} disabled={isSubmitting}>&times;</button>
                    {/* Gumamit ng modalTitle variable */}
                    <h3>{modalTitle}</h3> 
                </div>
                
                <div className="modal-body">
                    
                    <label>Start Date:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        min={today} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />

                    <label>End Date:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        min={startDate || today} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />

                    <label>Description / Special Request (Optional):</label>
                    <textarea
                        rows="3"
                        placeholder="e.g., Need it delivered early, or specific quantity required."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>

  

                    {calculateDays(startDate, endDate) < 2 && startDate && endDate && (
                        <p className="error-message">Minimum rental period is 2 days.</p>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button className="confirm-btn" onClick={handleRent} disabled={isConfirmDisabled}>
                        {isSubmitting ? "Sending..." : "Confirm Request"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RentModal;