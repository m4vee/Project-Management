import React, { useState, useEffect } from "react";
import { useSwapRequests } from "./SwapRequestContext"; 
import "./SwapOfferModal.css"; 
import { FaTimes } from 'react-icons/fa';

const SwapOfferModal = ({ isOpen, onClose, targetItem }) => {
    const { addSwapRequest } = useSwapRequests();
    const [offerText, setOfferText] = useState("");
    const [note, setNote] = useState("");
    const [offerImage, setOfferImage] = useState(null); 
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const currentUserId = parseInt(localStorage.getItem("user_id"));

    useEffect(() => {
        if (isOpen) {
            setOfferText("");
            setNote("");
            setOfferImage(null);
            setImagePreview(null);
        }
    }, [isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOfferImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setOfferImage(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!offerText.trim()) {
            alert("Please type what you want to offer.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("product_id", targetItem.id);
        formData.append("offered_item_id", ""); 
        formData.append("requester_id", currentUserId);
        
        // Pinagsama ang offerText at note (tulad ng original logic mo)
        formData.append("offer_description", offerText + (note ? ` (Note: ${note})` : ""));
        
        if (offerImage) {
            formData.append("image", offerImage);
        }

        try {
            const success = await addSwapRequest(formData); 
            
            if (success) {
                alert("Swap offer sent successfully!");
                onClose(); 
            } else {
                alert("Failed to send request.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !targetItem) return null;

    return (
        <div className="modal-overlay">
            <div className="swap-modal-container">
                <div className="modal-header">
                    <h3>Make a Swap Offer</h3>
                    <button className="close-btn" onClick={onClose} disabled={loading}><FaTimes /></button>
                </div>

                <div className="modal-body">
                    <div className="target-item-summary">
                        <p>You want to swap for:</p>
                        <div className="summary-box">
                            {targetItem.image_url && (
                                <img 
                                    src={targetItem.image_url.startsWith('http') ? targetItem.image_url : `http://127.0.0.1:5000${targetItem.image_url}`} 
                                    alt="Target" 
                                />
                            )}
                            <h4>{targetItem.name}</h4>
                        </div>
                    </div>

                    <div className="offer-selection">
                        <label>What are you offering?</label>
                        <div className="input-group">
                             <input 
                                type="text"
                                placeholder="e.g. My Scientific Calculator"
                                value={offerText}
                                onChange={(e) => setOfferText(e.target.value)}
                            />
                        </div>
                       
                        <div style={{marginTop: '15px'}} className="image-upload-area">
                            <label style={{marginBottom: '5px', fontSize: '0.9rem'}}>Upload Photo (Optional):</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="image-preview-box" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="offer-note">
                        <label>Additional Details (Optional):</label>
                        <textarea 
                            placeholder="Condition, year bought, etc..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
                    <button 
                        className="confirm-swap-btn" 
                        onClick={handleSubmit} 
                        disabled={loading || !offerText.trim()}
                    >
                        {loading ? "Sending..." : "Send Offer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SwapOfferModal;