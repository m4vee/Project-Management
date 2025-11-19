import React, { createContext, useContext, useState } from "react";

const RentalRequestContext = createContext();

export const RentalRequestProvider = ({ children }) => {
  const [renterRequests, setRenterRequests] = useState([]);
  const [renteeRequests, setRenteeRequests] = useState([]);

  const addRentalRequest = (request) => {
    setRenterRequests((prev) => [...prev, request]);
    setRenteeRequests((prev) => [...prev, request]);
  };

  const updateRequestAPI = (requestId, newStatus) => {
    setRenterRequests((prev) =>
      prev.map((req) =>
        req.request_id === requestId ? { ...req, status: newStatus } : req
      )
    );
    setRenteeRequests((prev) =>
      prev.map((req) =>
        req.request_id === requestId ? { ...req, status: newStatus } : req
      )
    );
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
