import React, { createContext, useContext, useState, useEffect } from "react";
import { createSwapRequest, fetchSwapRequests, updateSwapStatus } from "../../services/api";

const SwapRequestContext = createContext();

export const SwapRequestProvider = ({ children }) => {
  const [swapRequests, setSwapRequests] = useState([]);

  // Load existing swap requests
  useEffect(() => {
    const loadSwaps = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (userId) {
          const data = await fetchSwapRequests(userId);
          setSwapRequests(data);
        }
      } catch (error) {
        console.error("Failed to load swap requests", error);
      }
    };
    loadSwaps();
  }, []);

  const addSwapRequest = async (requestDetails) => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        alert("You must be logged in to swap.");
        return;
      }

      // Payload for Backend
      const payload = {
        product_id: requestDetails.product_id || requestDetails.id,
        requester_id: userId,
        offer_description: requestDetails.offer_description || "Requesting Swap" 
      };

      const response = await createSwapRequest(payload);

      // Update local state
      const newSwap = { ...requestDetails, status: 'pending', id: response.id };
      setSwapRequests((prev) => [...prev, newSwap]);
      
      console.log("Swap request saved to DB:", response);

    } catch (error) {
      console.error("Error creating swap request:", error);
      alert("Failed to send swap request.");
    }
  };

  const updateSwapRequest = async (swapId, action) => {
    try {
      await updateSwapStatus(swapId, action);
      
      setSwapRequests((prev) =>
        prev.map((swap) =>
          swap.id === swapId ? { ...swap, status: action } : swap
        )
      );
    } catch (error) {
      console.error("Error updating swap status:", error);
    }
  };

  return (
    <SwapRequestContext.Provider value={{ swapRequests, updateSwapRequest, addSwapRequest }}>
      {children}
    </SwapRequestContext.Provider>
  );
};

export const useSwapRequests = () => useContext(SwapRequestContext);