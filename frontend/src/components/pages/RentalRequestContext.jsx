import React, { createContext, useContext, useState, useEffect } from "react";
import { createRentalRequest, fetchRentalRequests, updateRentalStatus } from "../../services/api";

const RentalRequestContext = createContext();

export const RentalRequestProvider = ({ children }) => {
  const [renterRequests, setRenterRequests] = useState([]);
  const [renteeRequests, setRenteeRequests] = useState([]);

  // Load existing requests when the app starts
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (userId) {
          const data = await fetchRentalRequests(userId);
          // Assuming backend returns a list, you might need to split them based on role later
          // For now, we just store them to avoid errors
          setRenterRequests(data); 
        }
      } catch (error) {
        console.error("Failed to load rental requests", error);
      }
    };
    loadRequests();
  }, []);

  const addRentalRequest = async (requestDetails) => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        alert("You must be logged in to rent an item.");
        return;
      }

      // Prepare payload for Backend
      // Note: HomePage passes confirmationItem details. We need product_id.
      // Assuming requestDetails has 'product_id' or 'id'
      const payload = {
        product_id: requestDetails.product_id || requestDetails.id, 
        renter_id: userId
      };

      const response = await createRentalRequest(payload);
      
      // Update local state to reflect change immediately
      const newRequest = { ...requestDetails, status: 'pending', id: response.id };
      setRenterRequests((prev) => [...prev, newRequest]);
      
      console.log("Rental request saved to DB:", response);

    } catch (error) {
      console.error("Error creating rental request:", error);
      alert("Failed to send rental request.");
    }
  };

  const updateRequestAPI = async (requestId, newStatus) => {
    try {
      await updateRentalStatus(requestId, newStatus);
      
      setRenterRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
      setRenteeRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
    } catch (error) {
      console.error("Error updating rental status:", error);
    }
  };

  return (
    <RentalRequestContext.Provider
      value={{
        renterRequests,
        renteeRequests,
        addRentalRequest,
        updateRequestAPI,
      }}
    >
      {children}
    </RentalRequestContext.Provider>
  );
};

export const useRentalRequests = () => useContext(RentalRequestContext);