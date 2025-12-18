import React, { createContext, useContext, useState } from 'react';
// IMPORT THE REAL API FUNCTION
import { createSwapRequest } from '../../services/api'; 

const SwapRequestContext = createContext();

export const useSwapRequests = () => {
  return useContext(SwapRequestContext);
};

export const SwapRequestProvider = ({ children }) => {
  const [swapRequests, setSwapRequests] = useState([]);

  // Function to add request to the REAL DATABASE
  const addSwapRequest = async (requestData) => {
    try {
      console.log("Sending Swap Request to API...", requestData);
      
      // CALL THE BACKEND
      const response = await createSwapRequest(requestData);
      
      // If successful, you can optionally update local state, 
      // but usually fetching fresh data on the requests page is enough.
      if (response) {
          console.log("Swap request saved to DB:", response);
          return true; // Success
      }
    } catch (error) {
      console.error("Error adding swap request:", error);
      return false; // Failed
    }
  };

  const value = {
    swapRequests,
    addSwapRequest
  };

  return (
    <SwapRequestContext.Provider value={value}>
      {children}
    </SwapRequestContext.Provider>
  );
};