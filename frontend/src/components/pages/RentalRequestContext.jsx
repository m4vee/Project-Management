import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createRentalRequest, fetchRentalRequests, updateRentalStatus } from "../../services/api";

const RentalRequestContext = createContext();

export const RentalRequestProvider = ({ children }) => {
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem("user_id"); 
            if (userId && userId !== 'null' && userId !== 'undefined') {
                const data = await fetchRentalRequests(userId);
                if (Array.isArray(data)) {
                    setAllRequests(data);
                } else {
                    setAllRequests([]);
                }
            } else {
                 setAllRequests([]);
            }
        } catch (error) {
            console.error("Failed to load rental requests:", error);
            setAllRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const checkAvailability = (productId, startDate, endDate) => {
        const userStart = new Date(startDate).getTime();
        const userEnd = new Date(endDate).getTime();

        const hasConflict = allRequests.some((req) => {
            if (String(req.product_id) !== String(productId)) return false;
            if (req.status === "declined" || req.status === "cancelled") return false;

            const existingStart = new Date(req.rent_start).getTime();
            const existingEnd = new Date(req.rent_end).getTime();

            return userStart < existingEnd && userEnd > existingStart;
        });

        return !hasConflict;
    };

    const addRentalRequest = async (requestDetails) => {
        try {
            const userId = localStorage.getItem("user_id");
            
            if (!userId || userId === 'null' || userId === 'undefined') {
                alert("Renter ID is missing. Please log in again.");
                return false;
            }
            
            const productId = requestDetails.product_id; 
            const startDate = requestDetails.startDate;
            const endDate = requestDetails.endDate;
            
            // CRITICAL CHECK: Ensure all required fields exist before API call
            if (!productId || !startDate || !endDate) {
                 alert("Missing product ID or rental dates. Cannot proceed."); // Match the error image
                 return false;
            }

            const isAvailable = checkAvailability(
                productId, 
                startDate, 
                endDate
            );

            if (!isAvailable) {
                alert("This item is already booked for these dates.");
                return false;
            }

            // Final payload structure matching Flask requirements (product_id, renter_id, start_date, end_date)
            const payload = {
                product_id: productId,
                renter_id: parseInt(userId), 
                start_date: startDate,
                end_date: endDate
            };
            
            const response = await createRentalRequest(payload);
            
            await loadRequests();
            
            alert("Rental request sent successfully!");
            return true;

        } catch (error) {
            console.error("Error creating rental request:", error);
            
            let errorMessage = "Failed to send rental request.";
            if (error.message) {
                 // Check if the error is the exact one from Flask
                errorMessage = error.message.includes("Missing required fields") 
                                ? "Missing dates or product ID. Please check the form." 
                                : error.message; 
            } else if (error.response && error.response.status === 409) {
                errorMessage = "Dates are not available (409 Conflict).";
            }

            alert(errorMessage);
            return false;
        }
    };

    const updateRequestAPI = async (requestId, newStatus) => {
        try {
            await updateRentalStatus(requestId, newStatus);
            setAllRequests((prevList) => 
                prevList.map((req) => 
                    req.id === requestId ? { ...req, status: newStatus } : req
                )
            );
            return true;
        } catch (error) {
            console.error("Error updating rental status:", error);
            alert("Failed to update status.");
            return false;
        }
    };

    return (
        <RentalRequestContext.Provider
            value={{
                allRequests,
                loading,
                addRentalRequest,
                updateRequestAPI,
                checkAvailability,
                refreshRequests: loadRequests
            }}
        >
            {children}
        </RentalRequestContext.Provider>
    );
};

export const useRentalRequests = () => useContext(RentalRequestContext);