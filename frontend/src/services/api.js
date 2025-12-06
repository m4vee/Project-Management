const API_URL = "http://127.0.0.1:5000/api";

// Users API
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }), // ← Make sure it's sending BOTH
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }
  return response.json();
};

// Products API
export const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_URL}/products?${params}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
};

export const fetchProduct = async (productId) => {
  const response = await fetch(`${API_URL}/products/${productId}`);
  if (!response.ok) throw new Error("Failed to fetch product");
  return response.json();
};

export const createProduct = async (productData) => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to create product");
  return response.json();
};

export const updateProduct = async (productId, productData) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

export const deleteProduct = async (productId) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
};

// Messages API
export const fetchUserThreads = async (userId) => {
  const response = await fetch(`${API_URL}/messages/threads/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch threads");
  return response.json();
};

export const fetchThreadMessages = async (threadId) => {
  const response = await fetch(`${API_URL}/messages/thread/${threadId}`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

export const sendMessage = async (messageData) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageData),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
};

// Rentals API
export const createRentalRequest = async (rentalData) => {
  const response = await fetch(`${API_URL}/rentals/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rentalData),
  });
  if (!response.ok) throw new Error("Failed to create rental request");
  return response.json();
};

export const fetchRentalRequests = async (userId) => {
  const response = await fetch(`${API_URL}/rentals/requests/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch rental requests");
  return response.json();
};

export const updateRentalStatus = async (requestId, status) => {
  const response = await fetch(
    `${API_URL}/rentals/requests/${requestId}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  if (!response.ok) throw new Error("Failed to update rental status");
  return response.json();
};

// Swaps API
export const createSwapRequest = async (swapData) => {
  const response = await fetch(`${API_URL}/swaps/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(swapData),
  });
  if (!response.ok) throw new Error("Failed to create swap request");
  return response.json();
};

export const fetchSwapRequests = async (userId) => {
  const response = await fetch(`${API_URL}/swaps/requests/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch swap requests");
  return response.json();
};

export const updateSwapStatus = async (swapId, status) => {
  const response = await fetch(`${API_URL}/swaps/requests/${swapId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update swap status");
  return response.json();
};

export const sendOTP = async (email) => {
  const response = await fetch(`${API_URL}/users/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error("Failed to send OTP");
  return response.json();
};

export const verifyOTP = async (email, otp_code) => {
  const response = await fetch(`${API_URL}/users/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp_code }),
  });
  if (!response.ok) throw new Error("Invalid OTP");
  return response.json();
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }
  return response.json();
};

export const addProductPhoto = async (productId, photoUrl) => {
  const response = await fetch(`${API_URL}/products/${productId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    //body: JSON.stringify({ product_id: productId, photo_url: photoUrl }),
    body: JSON.stringify({ photo_url: photoUrl }),
  });
  if (!response.ok) throw new Error("Failed to add photo");
  return response.json();
};

export const saveProductAvailability = async (productId, availabilityList) => {
  const response = await fetch(
    `${API_URL}/products/${productId}/availability`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // CRITICAL: Send the list of days directly as the request body.
      body: JSON.stringify(availabilityList),
    }
  );

  if (!response.ok) {
    // This will catch 400 or 500 errors from the server
    const errorBody = await response.json();
    throw new Error(
      errorBody.error ||
        `Failed to save availability (Status: ${response.status})`
    );
  }
  return response.json();
};

export const fetchProductDetails = async (productId) => {
  const API_URL = "http://127.0.0.1:5000/api/products"; // Confirm this base URL is correct

  try {
    const response = await fetch(`${API_URL}/${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Try to read a specific error message from the backend response body
      const errorText = await response.text();
      // Throw a clear error message that the frontend can display
      throw new Error(
        `API Error ${response.status}: ${
          errorText || "Server returned an error."
        }`
      );
    }

    return response.json();
  } catch (error) {
    // This catches network failures or the specific API error thrown above
    console.error("Critical API Fetch Failure:", error.message);
    throw new Error(
      `Failed to load product details. Details: ${error.message}`
    );
  }
};

export const createTransaction = async (transactionPayload) => {
  const response = await fetch(`${API_URL}/transactions`, {
    // <-- Updated URL
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transactionPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to communicate with transaction service."
    );
  }

  return data;
};

// src/services/api.js

export const fetchTransactionDetails = async (transactionId) => {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Server returned non-JSON error:", errorText);
    throw new Error(`Failed to fetch transaction details: ${response.status}`);
  }

  return response.json();
};
