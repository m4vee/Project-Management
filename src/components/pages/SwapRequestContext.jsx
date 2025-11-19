import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const SwapRequestContext = createContext();

// Sample swap requests for testing
const sampleSwaps = [
  {
    swap_id: 1,
    requester_name: "Krislyn Sayat",
    product_requested: "Canon DSLR Camera",
    product_offered: "Laptop Dell XPS 13",
    status: "pending",
  },
  {
    swap_id: 2,
    requester_name: "Mary Jane",
    product_requested: "Graphing Calculator",
    product_offered: "Textbook: Data Analytics",
    status: "accepted",
  },
  {
    swap_id: 3,
    requester_name: "Alex Tan",
    product_requested: "Headphones",
    product_offered: "Bluetooth Speaker",
    status: "pending",
  },
];

// Provider component
export const SwapRequestProvider = ({ children }) => {
  const [swapRequests, setSwapRequests] = useState([]);

  /*
  // Simulate fetching swap requests
  useEffect(() => {
    setSwapRequests(sampleSwaps);
  }, []);
*/
  // Update swap request status
  const updateSwapRequest = (swapId, action) => {
    setSwapRequests((prev) =>
      prev.map((swap) =>
        swap.swap_id === swapId ? { ...swap, status: action } : swap
      )
    );
  };

  const addSwapRequest = (newSwap) => {
    setSwapRequests((prev) => [...prev, newSwap]);
    };

  return (
    <SwapRequestContext.Provider value={{ swapRequests, updateSwapRequest, addSwapRequest }}>
      {children}
    </SwapRequestContext.Provider>
  );
};

// Hook for easier access
export const useSwapRequests = () => useContext(SwapRequestContext);
