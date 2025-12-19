const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";
// ====================================================================
// AUTH & USER ENDPOINTS
// ====================================================================
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

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

export const fetchUserProfile = async (userId, currentUserId) => {
  const url = `${API_URL}/users/profile/${userId}?current_user_id=${currentUserId}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch profile");
  }
  return response.json();
};

export const updateUserProfile = async (formData) => {
  // Note: FormData does not need explicit Content-Type header when using fetch
  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
};

export const uploadProfileImage = async (formData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/users/profile-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to upload image");
  return data;
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

export const fetchFollowStatus = async (currentUserId, targetUserId) => {
  const response = await fetch(
    `${API_URL}/users/${targetUserId}/relationships?current_user_id=${currentUserId}`
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to fetch relationship status");
  return data;
};

export const followUser = async (currentUserId, targetUserId) => {
  const response = await fetch(`${API_URL}/users/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      follower_id: currentUserId,
      followed_id: targetUserId,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to follow user");
  return data;
};

export const unfollowUser = async (currentUserId, targetUserId) => {
  const response = await fetch(`${API_URL}/users/unfollow`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      follower_id: currentUserId,
      followed_id: targetUserId,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to unfollow user");
  return data;
};

// ====================================================================
// PRODUCT & TRANSACTION ENDPOINTS
// ====================================================================

export const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_URL}/products?${params}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
};

export const fetchProductDetails = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error ${response.status}: ${errorText || "Server error"}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Critical API Fetch Failure:", error.message);
    throw error;
  }
};

export const fetchProduct = fetchProductDetails;

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

// --- THIS IS NEEDED FOR EDITING POSTS ---
export const updateProduct = async (productId, productData) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

// --- THIS IS NEEDED FOR DELETING POSTS ---
export const deleteProduct = async (productId) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(), // Added auth headers for security
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
    throw new Error(errorBody.error || "Failed to save availability");
  }
  return response.json();
};

export const createTransaction = async (transactionPayload) => {
  const response = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactionPayload),
  });

  const data = await response.json().catch(() => {
    throw new Error(
      "Server returned an invalid JSON response or status 500/400."
    );
  });

  if (!response.ok) throw new Error(data.error || "Transaction failed");
  return data;
};

export const fetchTransactionDetails = async (transactionId) => {
  const response = await fetch(
    `${API_URL}/transactions/receipt/${transactionId}`
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: `Failed to fetch receipt ${transactionId}` }));
    throw new Error(errorBody.error || "Failed to fetch transaction details");
  }
  return response.json();
};

export const fetchUserTransactions = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}/transactions`);
  if (!response.ok) throw new Error("Failed to fetch user transactions");
  return response.json();
};

export const markTransactionCompleted = async (transactionId) => {
  const response = await fetch(
    `${API_URL}/transactions/${transactionId}/complete`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to complete transaction");
  return data;
};

export const reportTransactionIssue = async (transactionId, reason) => {
  const response = await fetch(
    `${API_URL}/transactions/${transactionId}/report`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to report transaction");
  return data;
};

// ====================================================================
// CART ENDPOINTS
// ====================================================================

export const fetchCart = async (userId) => {
  const response = await fetch(`${API_URL}/cart?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch cart");
  return response.json();
};

export const addToCart = async (payload) => {
  const response = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to add to cart");
  return response.json();
};

export const updateCartQuantity = async (productId, payload) => {
  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update cart");
  return response.json();
};

export const removeFromCart = async (productId, userId) => {
  const response = await fetch(
    `${API_URL}/cart/${productId}?user_id=${userId}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) throw new Error("Failed to remove item");
  return response.json();
};

// ====================================================================
// RENTAL, SWAP, MESSAGE, NOTIFICATIONS
// ====================================================================

export const createRentalRequest = async (rentalData) => {
  const response = await fetch(`${API_URL}/rentals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rentalData),
  });
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || "Failed to create rental request");
  }
  return response.json();
};

export const fetchRentalRequests = async (userId) => {
  const response = await fetch(`${API_URL}/rentals/requests/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch rental requests");
  return response.json();
};

export const updateRentalStatus = async (
  requestId,
  status,
  currentUserId,
  reason = null
) => {
  const response = await fetch(
    `${API_URL}/rentals/requests/${requestId}/status`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        current_user_id: currentUserId,
        rejection_reason: reason,
      }),
    }
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to update rental status");

  return data;
};

export const createSwapRequest = async (swapData) => {
  const isFormData = swapData instanceof FormData;
  const options = {
    method: "POST",
    body: isFormData ? swapData : JSON.stringify(swapData),
  };

  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }

  const response = await fetch(`${API_URL}/swaps`, options);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to create swap request");
  return data;
};

export const fetchSwapRequests = async (userId) => {
  const response = await fetch(`${API_URL}/swaps/requests/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch swap requests");
  return response.json();
};

export const updateSwapStatus = async (
  swapId,
  status,
  currentUserId,
  reason = null
) => {
  const response = await fetch(`${API_URL}/swaps/requests/${swapId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      status: status,
      current_user_id: currentUserId,
      rejection_reason: reason,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to update swap status");
  }

  return data;
};

export const fetchUserThreads = async (userId, query = "") => {
  const params = new URLSearchParams();
  if (query) {
    params.append("q", query);
  }
  const url = `${API_URL}/messages/threads/${userId}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch threads");
  return response.json();
};

export const fetchThreadMessages = async (otherUserId, currentUserId) => {
  const response = await fetch(
    `${API_URL}/messages/thread/${otherUserId}?current_user_id=${currentUserId}`
  );
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

export const sendMessage = async (messageData) => {
  const isFormData = messageData instanceof FormData;
  const options = {
    method: "POST",
    body: messageData,
  };

  if (!isFormData) {
    options.headers = { "Content-Type": "application/json" };
  }

  const response = await fetch(`${API_URL}/messages`, options);
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: "Unknown server error" }));
    throw new Error(err.error || "Failed to send message");
  }
  return response.json();
};

export const fetchNotifications = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/notifications/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markNotificationsRead = async (
  ids = null,
  markAll = false,
  userId
) => {
  try {
    const payload = {
      user_id: userId,
      mark_all: markAll,
      ids: ids,
    };
    const response = await fetch(`${API_URL}/notifications/mark_read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to mark notifications");
    return response.json();
  } catch (error) {
    console.error("Error marking notifications:", error);
    return { message: "Error" };
  }
};

// ====================================================================
// RATINGS ENDPOINTS
// ====================================================================

export const submitRating = async (ratingData) => {
  const response = await fetch(`${API_URL}/ratings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ratingData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to submit rating");
  return data;
};

export const fetchUserAverageRating = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}/ratings/average`);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to fetch average rating");
  return data;
};

export const fetchAllUserReviews = async (userId) => {
  const response = await fetch(`${API_URL}/users/${userId}/reviews/all`);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Failed to fetch user reviews");
  return data;
};

export const reactToReview = async (ratingId, type) => {
  const response = await fetch(`${API_URL}/ratings/${ratingId}/react`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }), // 'like' or 'dislike'
  });
  if (!response.ok) throw new Error("Failed to update reaction");
  return response.json();
};

export const updateUserSettings = async (settingsData) => {
  const response = await fetch(`${API_URL}/users/settings/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settingsData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to update settings");
  return data;
};

export const changeUserPassword = async (passwordData) => {
  const response = await fetch(`${API_URL}/users/settings/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passwordData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to change password");
  return data;
};
