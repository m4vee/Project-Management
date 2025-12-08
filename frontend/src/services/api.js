const API_URL = "http://127.0.0.1:5000/api";

export const initiateLogin = async (email, password) => {
  const response = await fetch(`${API_URL}/users/login-initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Login failed");
  return data;
};

export const verifyLoginOtp = async (email, otp) => {
  const response = await fetch(`${API_URL}/users/login-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Invalid OTP");
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }
  return response.json();
};

export const sendOTP = async (email, username) => {
  const response = await fetch(`${API_URL}/users/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send OTP");
  return data;
};

export const verifyOTP = async (email, otp_code) => {
  const response = await fetch(`${API_URL}/users/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: otp_code }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Invalid OTP");
  return data;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }
  return data;
};

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
  const isFormData = productData instanceof FormData;
  const options = {
    method: "POST",
    body: isFormData ? productData : JSON.stringify(productData),
  };

  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }

  const response = await fetch(`${API_URL}/products`, options);
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

export const addProductPhoto = async (productId, photoUrl) => {
  const response = await fetch(`${API_URL}/products/${productId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      body: JSON.stringify(availabilityList),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(
      errorBody.error ||
        `Failed to save availability (Status: ${response.status})`
    );
  }
  return response.json();
};

export const fetchProductDetails = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error ${response.status}: ${
          errorText || "Server returned an error."
        }`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Critical API Fetch Failure:", error.message);
    throw new Error(
      `Failed to load product details. Details: ${error.message}`
    );
  }
};

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

export const createTransaction = async (transactionPayload) => {
  const response = await fetch(`${API_URL}/transactions`, {
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

export const fetchTransactionDetails = async (transactionId) => {
  const response = await fetch(`${API_URL}/transactions/${transactionId}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Server returned non-JSON error:", errorText);
    throw new Error(`Failed to fetch transaction details: ${response.status}`);
  }

  return response.json();
};

export const sendForgotPasswordOTP = async (email) => {
  const response = await fetch(`${API_URL}/users/forgot-password-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send code");
  return data;
};

export const resetPasswordConfirm = async (email, otp, new_password) => {
  const response = await fetch(`${API_URL}/users/reset-password-confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, new_password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to reset password");
  return data;
};

// [NEW] PROFILE APIs
export const fetchUserProfile = async (userId) => {
  const response = await fetch(`${API_URL}/users/profile/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
};

export const updateUserProfile = async (formData) => {
  // Use FormData for file upload support
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    body: formData, // No headers needed, browser sets boundary
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
};