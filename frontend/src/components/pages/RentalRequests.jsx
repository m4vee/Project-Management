import React, { useEffect, useState } from "react";
import "./RentalRequests.css";
import AppNavbar from "../AppNavbar";
import { useNavigate } from "react-router-dom";
import { useRentalRequests } from './RentalRequestContext';



/*
// Sample data for testing
const sampleRenterRequests = [
  {
    request_id: 1,
    product_name: "Canon DSLR Camera",
    renter_name: "John Doe",
    rentee_name: "Alice Santos",
    rent_start: "2025-11-20T10:00:00",
    rent_end: "2025-11-22T18:00:00",
    status: "pending",
  },
  {
    request_id: 2,
    product_name: "Graphing Calculator",
    renter_name: "John Doe",
    rentee_name: "Mark Reyes",
    rent_start: "2025-11-15T09:00:00",
    rent_end: "2025-11-16T12:00:00",
    status: "accepted",
  },
  {
    request_id: 3,
    product_name: "Canon DSLR Camera",
    renter_name: "John Doe",
    rentee_name: "Alice Santos",
    rent_start: "2025-11-20T10:00:00",
    rent_end: "2025-11-22T18:00:00",
    status: "pending",
  },
  {
    request_id: 4,
    product_name: "Canon DSLR Camera",
    renter_name: "John Doe",
    rentee_name: "Alice Santos",
    rent_start: "2025-11-20T10:00:00",
    rent_end: "2025-11-22T18:00:00",
    status: "pending",
  },
  {
    request_id: 5,
    product_name: "Canon DSLR Camera",
    renter_name: "John Doe",
    rentee_name: "Alice Santos",
    rent_start: "2025-11-20T10:00:00",
    rent_end: "2025-11-22T18:00:00",
    status: "pending",
  },
];

const sampleRenteeRequests = [
  {
    request_id: 3,
    product_name: "Laptop Dell XPS 13",
    renter_name: "Mary Jane",
    rentee_name: "John Doe",
    rent_start: "2025-11-19T09:00:00",
    rent_end: "2025-11-20T17:00:00",
    status: "pending",
  },
  {
    request_id: 4,
    product_name: "Textbook: Data Analytics",
    renter_name: "Alex Tan",
    rentee_name: "John Doe",
    rent_start: "2025-11-12T08:00:00",
    rent_end: "2025-11-14T16:00:00",
    status: "declined",
  },
];
*/

//const RentalRequests = ({ userId, fetchRequestsAPI, updateRequestAPI }) => {
  const RentalRequests = ({ userId, fetchRequestsAPI }) => {
  //const [renterRequests, setRenterRequests] = useState(sampleRenterRequests);
 // const [renteeRequests, setRenteeRequests] = useState(sampleRenteeRequests);
  
  const { renterRequests, renteeRequests, updateRequestAPI } = useRentalRequests();
  const navigate = useNavigate();
  const currentUser = "Krislyn Sayat"; // replace this with your actual logged-in username
  const [activeTab, setActiveTab] = useState("renter");
  /*const [renterRequests, setRenterRequests] = useState([]);
  const [renteeRequests, setRenteeRequests] = useState([]);
*/

  // Fetch rental requests from backend (pass your API functions)
 /* const fetchRequests = async () => {
    try {
      const renterData = await fetchRequestsAPI({ renterId: userId });
      const renteeData = await fetchRequestsAPI({ renteeId: userId });
      setRenterRequests(renterData);
      setRenteeRequests(renteeData);
    } catch (err) {
      console.error(err);
    }
  };*/
/*
  useEffect(() => {
    fetchRequests();
  }, [userId]);
*/
/*
  const handleAction = async (requestId, action) => {
    try {
      await updateRequestAPI(requestId, action); // accept or decline
      fetchRequests(); // refresh data
    } catch (err) {
      console.error(err);
    }
  };*/

  const handleAction = (requestId, action) => {
      updateRequestAPI(requestId, action); // directly update context state
  };

  const getStatus = (status, start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (status === "cancelled") return "cancelled";
    if (status !== "pending" && status !== "declined" && now >= startDate && now <= endDate) return "ongoing";
    if (status !== "pending" && now > endDate) return "ended"; 
    return status;
  };

  const renderRequests = (requests, isRentee = false) =>
    requests.length === 0 ? (
      <p>No requests found.</p>
    ) : (
      requests.map((req) => {
        const status = getStatus(req.status, req.rent_start, req.rent_end);
        return (
          <div key={req.request_id} className="request-card">
            <div className="request-info">
              <p><strong>Product:</strong> {req.product_name}</p>
              <p><strong>Renter:</strong> {req.renter_name}</p>
              <p><strong>Rentee:</strong> {req.rentee_name}</p>
              <p>
                <strong>Period:</strong> {new Date(req.rent_start).toLocaleString()} - {new Date(req.rent_end).toLocaleString()}
              </p>
            </div>

            <div className="request-card-header">
                <span className={`request-status ${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>

            {isRentee && req.status === "pending" && (
              <div className="request-actions">
                <button className="accept-btn" onClick={() => handleAction(req.request_id, "accepted")}>Accept</button>
                <button className="decline-btn" onClick={() => handleAction(req.request_id, "declined")}>Decline</button>
              </div>
            )}

                {!isRentee && req.status === "pending" && (
          <div className="request-actions">
            <button className="cancl-btn" onClick={() => handleAction(req.request_id, "cancelled")}>
              Cancel
            </button>
          </div>
        )}

        {isRentee && req.status !== "pending" && req.status !== "ended" && (
          <div className="request-actions">
            <button className="done-btn" onClick={() => handleAction(req.request_id, "ended")}>
              Done
            </button>
          </div>
        )}

          </div>
        );
      })
    );

    // Filter requests based on current user
const myRenterRequests = renterRequests.filter(req => req.renter_name === currentUser);
const myRenteeRequests = renteeRequests.filter(req => req.rentee_name === currentUser);

  return (
    <div className="rental-requests-wrapper">
      <AppNavbar />
      <button
          className="floating-home-btn" onClick={() => navigate("/inside-app")}>
          <i class="fa-solid fa-house"></i> 
      </button>

    <div className="rental-requests-page scroll-box">
      <h2>Rentals Inventory</h2>

            <div className="tabs-wrapper">
              <div className="tabs">
              <button
                className={activeTab === "renter" ? "active" : ""}
                onClick={() => setActiveTab("renter")}
              >
                My Rentals
              </button>

              <button
                className={activeTab === "rentee" ? "active" : ""}
                onClick={() => setActiveTab("rentee")}
              >
                My Items Lent
              </button>
          </div>
        </div>


      <div className="requests-container">
        {activeTab === "renter"
          ? renderRequests(myRenterRequests)
          : renderRequests(myRenteeRequests, true)}
      </div>
    </div>
        </div>
  );
};

export default RentalRequests;
