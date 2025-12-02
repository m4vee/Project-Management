import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts, deleteProduct } from "../../services/api";
import PostItemModal from "./PostItemModal";
import RatingBox from "./RatingBox";
import CreatePostModal from "./CreatePostModal";
import "./Profile.css";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop&crop=entropy";
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop&crop=faces";

export default function Profile() {
  const navigate = useNavigate();

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // User state
  const [nickname, setNickname] = useState(user.name || "User");
  const [editingName, setEditingName] = useState(false);
  const [university] = useState(
    "Technological University of the Philippines - Manila"
  );
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [cover, setCover] = useState(DEFAULT_COVER);

  // Posts state - from backend
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Posts");
  const [showModal, setShowModal] = useState(false);

  // Ratings (sample - you can add this to backend later)
  const [ratings] = useState([5, 5, 4, 5, 4]);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : 0;

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Theme (dark mode)
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Refs for file inputs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Search states
  const [globalQuery, setGlobalQuery] = useState("");

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (!user.user_id) {
      alert("Please log in to view your profile");
      navigate("/login");
    } else {
      loadUserPosts();
    }
  }, []);

  // Load user's posts from backend
  const loadUserPosts = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all products
      const allProducts = await fetchProducts({ status: "available" });

      // Filter to only show current user's products
      const userProducts = allProducts.filter(
        (p) => p.posted_by === user.user_id
      );

      // Transform to match your format
      const transformedPosts = userProducts.map((product) => ({
        id: product.product_id,
        title: product.name,
        desc: product.description || "No description",
        price: product.price || product.rental_price || 0,
        category: getCategoryName(product.listing_type),
        img:
          product.photos?.[0]?.photo_url ||
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
        // Keep backend data
        product_id: product.product_id,
        listing_type: product.listing_type,
        condition: product.condition,
        status: product.status,
        created_at: product.created_at,
      }));

      setPosts(transformedPosts);
    } catch (err) {
      setError("Failed to load your posts: " + err.message);
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert listing_type to category name
  const getCategoryName = (listingType) => {
    const map = {
      sell: "Buy/Sell",
      rent: "Rent",
      swap: "Swap",
    };
    return map[listingType] || "Buy/Sell";
  };

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const matchCategory =
      activeFilter === "All Posts" || p.category === activeFilter;
    return matchCategory;
  });

  // File upload handlers
  function handleAvatarChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setAvatar(URL.createObjectURL(f));
      // TODO: Upload to backend
    }
  }

  function handleCoverChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setCover(URL.createObjectURL(f));
      // TODO: Upload to backend
    }
  }

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deleteProduct(postId);
      alert("Post deleted successfully!");
      loadUserPosts(); // Refresh the list
    } catch (err) {
      alert("Failed to delete post: " + err.message);
    }
  };

  // Handle post editing
  const handleEditPost = (postId) => {
    navigate(`/products/${postId}/edit`);
  };

  // Inline name editing save
  function saveName() {
    setEditingName(false);
    // TODO: Update user name in backend
    const updatedUser = { ...user, name: nickname };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen((prevState) => !prevState);
  };

  // Click outside dropdown to close
  useEffect(() => {
    function onDocClick(e) {
      setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [dropdownOpen]);

  // Calculate stats
  const totalPosts = posts.length;
  const activePosts = posts.filter((p) => p.status === "available").length;
  const soldPosts = posts.filter((p) => p.status === "sold").length;

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="topbar-left">
          <div className="logo">
            <Link
              to="/inside-app"
              className="navbar-logo"
              onClick={() => setMobileMenuOpen(false)}
            >
              TUPulse <i className="fab fa-typo3"></i>
            </Link>
          </div>
          <div className="top-search">
            <input
              type="text"
              placeholder="Search"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="topbar-right">
          <button onClick={handleMobileMenuToggle} className="menu-icon">
            <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
          </button>
          <button
            className="avatar-btn"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((s) => !s);
            }}
          >
            <img src={avatar} alt="avatar" />
          </button>

          {dropdownOpen && (
            <div
              className="profile-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <Link to="/profile" className="dd-item">
                View Profile
              </Link>
              <Link to="/cart" className="dd-item">
                🛒 My Cart
              </Link>

              <div className="dd-item toggle-row">
                <span>Dark Mode</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={() =>
                      setTheme((t) => (t === "dark" ? "light" : "dark"))
                    }
                  />
                  <span className="slider" />
                </label>
              </div>

              <button className="dd-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="profile-main">
        <div className="cover-avatar-container">
          <div
            className="cover"
            style={{ backgroundImage: `url(${cover})` }}
            onClick={() => coverInputRef.current?.click()}
            title="Click to change cover"
          >
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden-file"
              onChange={handleCoverChange}
            />
            <div className="cover-overlay">
              <div className="cover-actions">Change Cover</div>
            </div>
          </div>

          <div
            className="profile-avatar-column"
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="avatar-wrapper">
              <img src={avatar} alt="profile" className="avatar-img" />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden-file"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        <section className="profile-header">
          <div className="profile-info">
            <div className="name-row">
              {editingName ? (
                <input
                  className="name-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  onBlur={saveName}
                  autoFocus
                />
              ) : (
                <h1 onClick={() => setEditingName(true)}>{nickname}</h1>
              )}
              {avgRating >= 4.5 && (
                <span className="verified" title="Verified seller">
                  ✔︎
                </span>
              )}
            </div>

            <p className="subtitle">{user.email}</p>
            <p className="subtitle small">{university}</p>

            {/* Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{totalPosts}</span>
                <span className="stat-label">Total Posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{activePosts}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{soldPosts}</span>
                <span className="stat-label">Sold</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="btn primary"
                onClick={() => setShowModal(true)}
              >
                Create Post
              </button>
              <div className="more-dots" title="More">
                ⋯
              </div>
            </div>
          </div>
        </section>

        <section className="left-column">
          <h3>Photos</h3>
          <div className="photos-grid">
            <img src={avatar} alt="photos" />
          </div>

          <div className="rating-box">
            <h4>Rating</h4>
            <div className="rating-stars">
              <span className="big-rating">{avgRating}</span>
              <div className="stars">{renderStars(avgRating)}</div>
            </div>
            <p className="rating-note">{ratings.length} reviews</p>
          </div>
        </section>

        <section className="content-column">
          <div className="filters-row">
            <div className="filter-buttons">
              {["All Posts", "Buy/Sell", "Rent", "Swap"].map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${activeFilter === f ? "active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <i className="fa-solid fa-spinner fa-spin"></i> Loading your
              posts...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <i className="fa-solid fa-exclamation-circle"></i> {error}
              <button onClick={loadUserPosts} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Posts Grid */}
          {!loading && !error && (
            <div className="posts-grid">
              {filteredPosts.length === 0 ? (
                <div className="no-posts">
                  <i className="fa-solid fa-box-open"></i>
                  <p>No posts to show.</p>
                  <button
                    className="btn primary"
                    onClick={() => setShowModal(true)}
                  >
                    Create your first post
                  </button>
                </div>
              ) : (
                filteredPosts.map((p) => (
                  <article className="post-card" key={p.id}>
                    <div className="post-thumb">
                      <img src={p.img} alt={p.title} />
                      <span className={`status-badge ${p.status}`}>
                        {p.status === "available" ? "Active" : p.status}
                      </span>
                    </div>
                    <div className="post-body">
                      <div className="post-title">{p.title}</div>
                      <div className="post-desc">{p.desc}</div>
                      <div className="post-meta">
                        <span className="price">
                          {p.price > 0 ? `₱${p.price}` : p.category}
                        </span>
                        <span className="category">{p.category}</span>
                      </div>
                      <div className="post-condition">
                        <small>Condition: {p.condition}</small>
                      </div>

                      <div className="post-actions">
                        <button
                          className="btn small"
                          onClick={() => handleEditPost(p.product_id)}
                        >
                          <i className="fa-solid fa-edit"></i> Edit
                        </button>
                        <button
                          className="btn small ghost"
                          onClick={() => handleDeletePost(p.product_id)}
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {/* Use PostItemModal instead of CreatePostModal */}
      {showModal && (
        <PostItemModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            loadUserPosts(); // Refresh posts after creating
          }}
          activeFilter={
            activeFilter === "All Posts"
              ? "buy/sell"
              : activeFilter.toLowerCase().replace("/", "/")
          }
        />
      )}
    </div>
  );
}

// Helper function to render star ratings
function renderStars(avg) {
  const stars = [];
  const full = Math.floor(avg);
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else stars.push("☆");
  }
  return <span className="star-string">{stars.join("")}</span>;
}
