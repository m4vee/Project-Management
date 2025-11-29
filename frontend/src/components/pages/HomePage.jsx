import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../../services/api";
import "./HomePage.css";
import AppNavbar from "../AppNavbar";
import PostItemModal from "./PostItemModal";

export default function HomePage() {
  const { addToCart } = useCart();
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 9999]);
  const [availability, setAvailability] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isSticky, setIsSticky] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // New states for backend data
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch products from database
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadProducts(); // Refresh products when tab/window gains focus
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Starting to load products...");

      const data = await fetchProducts({});

      console.log("📦 Raw data from backend:", data);
      console.log("📊 Number of products:", data.length);
      console.log("📝 First product (if any):", data[0]);

      const transformedPosts = data.map((product) => ({
        id: product.product_id,
        image: product.photos?.[0]?.photo_url || "/images/placeholder.jpg",
        name: product.name,
        profile: "/images/default-profile.jpg",
        poster: product.seller_name,
        type: getTypeDisplay(product),
        description: product.description,
        condition: product.condition,
        rentTime: "Contact seller for details",
        datePosted: new Date(product.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        category: product.category_name,
        availability:
          product.availability?.map((a) => a.day_of_week.toLowerCase()) || [],
        product_id: product.product_id,
        listing_type: product.listing_type,
        price: product.price,
        rental_price: product.rental_price,
        posted_by: product.posted_by,
        status: product.status,
      }));

      console.log("✅ Transformed posts:", transformedPosts);
      console.log("✅ Number of transformed posts:", transformedPosts.length);
      setPosts(transformedPosts);
    } catch (err) {
      console.error("❌ Error loading products:", err);
      setError("Failed to load products: " + err.message);
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to display type (price, Rent, Swap)
  const getTypeDisplay = (product) => {
    if (product.listing_type === "sell" && product.price) {
      return `₱${parseFloat(product.price).toLocaleString()}`;
    } else if (product.listing_type === "rent" && product.rental_price) {
      return "Rent";
    } else if (product.listing_type === "swap") {
      return "Swap";
    }
    return "N/A";
  };

  const filteredPosts = posts.filter((post) => {
    const serviceMatch =
      filter === "all"
        ? true
        : filter === "buy/sell"
        ? post.type.includes("₱")
        : post.type.toLowerCase() === filter;

    const categoryMatch =
      !category ||
      (post.category && post.category.toLowerCase() === category.toLowerCase());

    const numericPrice = parseFloat(post.type.replace(/[₱,]/g, "")) || 0;
    const priceMatch =
      !post.type.includes("₱") ||
      (numericPrice >= priceRange[0] && numericPrice <= priceRange[1]);

    const availabilityMatch =
      availability.length === 0 ||
      (post.availability &&
        availability.some((day) => post.availability.includes(day)));

    return serviceMatch && categoryMatch && priceMatch && availabilityMatch;
  });

  const handleAddToCart = (post) => {
    const price = post.type.includes("₱")
      ? parseFloat(post.type.replace(/[₱,]/g, "")) || 0
      : 0;
    const item = {
      id: post.id,
      name: post.name,
      img: post.image,
      price: price,
      type: post.type,
    };
    addToCart(item);
    alert(`${post.name} added to cart!`);
  };

  const openModal = (post) => setSelectedPost(post);
  const closeModal = () => setSelectedPost(null);

  const getButtonText = () => {
    switch (filter) {
      case "buy/sell":
        return "Sell Item";
      case "rent":
        return "Rent Item";
      case "swap":
        return "Swap Item";
      default:
        return null;
    }
  };

  const buttonText = getButtonText();

  return (
    <div className="homepage">
      <AppNavbar />

      <div className={`service-navbar ${isSticky ? "scrolled" : ""}`}>
        <div>
          <button
            className={`service-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`service-btn ${filter === "buy/sell" ? "active" : ""}`}
            onClick={() => setFilter("buy/sell")}
          >
            Buy
          </button>
          <button
            className={`service-btn ${filter === "rent" ? "active" : ""}`}
            onClick={() => setFilter("rent")}
          >
            Rent
          </button>
          <button
            className={`service-btn ${filter === "swap" ? "active" : ""}`}
            onClick={() => setFilter("swap")}
          >
            Swap
          </button>
        </div>

        {buttonText && (
          <button
            className="post-item-btn"
            onClick={() => setIsPostModalOpen(true)}
          >
            {buttonText} <i className="fa-solid fa-plus"></i>
          </button>
        )}
      </div>

      <div className="homepage-container">
        <button className="filter-toggle" onClick={() => setShowFilters(true)}>
          <i className="fas fa-filter"></i>
        </button>

        <div className={`sidebar ${showFilters ? "show" : ""}`}>
          <button
            className="close-filter-btn"
            onClick={() => setShowFilters(false)}
          >
            &times;
          </button>

          <h3>Filters</h3>

          <div className="filter-section">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="clothing">Clothing</option>
              <option value="furniture">Furniture</option>
              <option value="sports & outdoors">Sports & Outdoors</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="filter-section">
            <label>Availability</label>
            <div className="availability-options">
              {[
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ].map((day) => (
                <label key={day} className="availability-checkbox">
                  <input
                    type="checkbox"
                    value={day}
                    checked={availability.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAvailability([...availability, day]);
                      } else {
                        setAvailability(availability.filter((d) => d !== day));
                      }
                    }}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        <main className="posts-container">
          {/* Loading State */}
          {loading && (
            <div className="loading-message">
              <i className="fa-solid fa-spinner fa-spin"></i> Loading
              products...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-message">
              <i className="fa-solid fa-exclamation-circle"></i> {error}
              <button onClick={loadProducts} className="retry-btn">
                <i className="fa-solid fa-rotate-right"></i> Retry
              </button>
            </div>
          )}

          {/* No Products */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="no-products">
              <i className="fa-solid fa-box-open"></i>
              <p>No products found</p>
              <button
                className="post-item-btn"
                onClick={() => setIsPostModalOpen(true)}
              >
                Be the first to post!
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading &&
            !error &&
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => openModal(post)}
              >
                <img src={post.image} alt={post.name} className="post-image" />
                <div className="post-info">
                  <div className="poster-info">
                    <img
                      src={post.profile}
                      alt={post.poster}
                      className="poster-pic"
                    />
                    <span className="poster-name">{post.poster}</span>
                  </div>
                  <h4>{post.name}</h4>
                  <div className="post-actions">
                    <button className="price-btn">{post.type}</button>
                    <button
                      className="addtocart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(post);
                      }}
                    >
                      <i className="fa-solid fa-cart-plus"></i>
                    </button>
                    <button
                      className="chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/chat");
                      }}
                    >
                      <i className="fa-solid fa-comment"></i> Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </main>
      </div>

      {/* Product Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPost.image}
              alt={selectedPost.name}
              className="modal-image"
            />
            <div className="modal-details">
              <h2>{selectedPost.name}</h2>
              <p>
                <strong>Category:</strong> {selectedPost.category}
              </p>
              <p>
                <strong>Posted by:</strong> {selectedPost.poster}
              </p>
              <p>
                <strong>Date Posted:</strong> {selectedPost.datePosted}
              </p>
              <p>
                <strong>Condition:</strong> {selectedPost.condition}
              </p>
              {selectedPost.availability &&
                selectedPost.availability.length > 0 && (
                  <p>
                    <strong>Availability:</strong>{" "}
                    {selectedPost.availability.join(", ")}
                  </p>
                )}
              {selectedPost.rentTime && (
                <p>
                  <strong>Renting Time:</strong> {selectedPost.rentTime}
                </p>
              )}
              <p>
                <strong>Description:</strong>{" "}
                {selectedPost.description || "No description provided."}
              </p>
              <div className="modal-actions">
                <button className="price-btn">{selectedPost.type}</button>
                <button
                  className="addtocart-btn"
                  onClick={() => handleAddToCart(selectedPost)}
                >
                  <i className="fa-solid fa-cart-plus"></i>
                </button>
                <button
                  className="chat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/chat");
                  }}
                >
                  <i className="fa-solid fa-comment"></i> Chat
                </button>
              </div>
            </div>
            <button className="close-btn" onClick={closeModal}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Post Item Modal */}
      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          loadProducts(); // Refresh products after posting
        }}
        activeFilter={filter}
      />
    </div>
  );
}
