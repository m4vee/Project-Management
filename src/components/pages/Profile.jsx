import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
// REMOVED: import { fetchProducts, deleteProduct } from "../../services/api";
import PostItemModal from "./PostItemModal";
import "./Profile.css";
import RatingBox from "./RatingBox";
import PostActionModal from "./PostActionModal";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop&crop=entropy";
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop&crop=faces";

// --- MOCK DATA (Sample posts para may makita ka sa UI) ---
const INITIAL_POSTS = [
  {
    id: 1,
    title: "Engineering Calculator (Casio fx-991EX)",
    desc: "Used for 1 semester, good condition. No scratches.",
    price: 950,
    category: "Buy/Sell",
    img: "https://images.unsplash.com/photo-1594729095022-e2f6d2eece9d?q=80&w=800&auto=format&fit=crop",
    listing_type: "sell",
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Drafting Table",
    desc: "A bit old but sturdy. Adjustable height. Available for rent per week.",
    price: 0,
    rentPrice: "200/week", // Custom field for rent
    category: "Rent",
    img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800&auto=format&fit=crop",
    listing_type: "rent",
    status: "available",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "T-Square & Triangles",
    desc: "Swap with unused bond paper or mechanical pens.",
    price: 0,
    category: "Swap",
    img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
    listing_type: "swap",
    status: "available",
    created_at: new Date().toISOString(),
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [isVisitorView] = useState(false); // true for visitor mode, false for owner

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

  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Posts");
  const [showModal, setShowModal] = useState(false);

  // Modals
  const [profileShowModal, setProfileShowModal] = useState(false);
  const [profileSelectedPost, setProfileSelectedPost] = useState(null);
  const [profileCurrentImage, setProfileCurrentImage] = useState(0);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  function getPostTypeCategory(post) {
    if (!post || !post.category) return "";
    const cat = post.category.toLowerCase();
    if (cat.includes("rent")) return "rent";
    if (cat.includes("swap")) return "swap";
    if (cat.includes("buy")) return "buy";
    return "";
  }

  // Ratings (sample)
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
    // NOTE: You can comment this out if you want to test without logging in
    if (!user.user_id && !user.name) { 
      // alert("Please log in to view your profile");
      // navigate("/login");
      // For testing purposes, we proceed even without user_id
      loadUserPosts();
    } else {
      loadUserPosts();
    }
  }, []);

  // --- MODIFIED: Load Mock Data instead of API ---
  const loadUserPosts = async () => {
    try {
      setLoading(true);
      setError("");

      // Simulate network delay
      setTimeout(() => {
        setPosts(INITIAL_POSTS);
        setLoading(false);
      }, 500);

    } catch (err) {
      setError("Failed to load your posts: " + err.message);
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
    }
  }

  function handleCoverChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setCover(URL.createObjectURL(f));
    }
  }

  // --- MODIFIED: Handle post deletion (Local State Only) ---
  const handleDeletePost = (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    // Update local state directly
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    alert("Post deleted successfully (Frontend Only)!");
    setActionModalOpen(false); // Close modal if open
  };

  // Handle post editing
  const handleEditPost = (postId) => {
    navigate(`/products/${postId}/edit`);
  };

  // Inline name editing save
  function saveName() {
    setEditingName(false);
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
            <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <Link to="/my-profile" className="dd-item" onClick={() => setDropdownOpen(false)}>
                My Profile
              </Link>
              <Link to="/cart" className="dd-item" onClick={() => setDropdownOpen(false)}>
                My Cart
              </Link>
              <Link
                to="/rentalrequests"
                className="dd-item"
                onClick={() => setDropdownOpen(false)}
              >
                My Rentals
              </Link>
              <Link
                to="/swaprequests"
                className="dd-item"
                onClick={() => setDropdownOpen(false)}
              >
                My Swaps
              </Link>
              <Link
                to="/account-settings"
                className="dd-item"
                onClick={() => setDropdownOpen(false)}
              >
                Account Settings
              </Link>
              <Link to="/feedback" className="dd-item" onClick={() => setDropdownOpen(false)}>
                Give Feedback
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
          <div className="profile-layout">
            {/* CENTER COLUMN — Profile Info */}
            <div className="center-col">
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
                    <span className="stat-label"> Total Posts</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{activePosts}</span>
                    <span className="stat-label"> Active</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{soldPosts}</span>
                    <span className="stat-label"> Sold</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT COLUMN — Rating Box */}
            <div className="right-col">
              <div className="profile-info">
                <RatingBox
                  sellerId="krislyn"
                  reviews={[
                    { id: 1, user: "Anna", rating: 5, comment: "Very smooth transaction!" },
                    { id: 2, user: "Mark", rating: 4, comment: "Item in good condition." },
                    { id: 3, user: "Joan", rating: 5, comment: "Super bait seller!" },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="content-column"
          style={{ marginTop: "0px", marginLeft: "-270px" }}
        >
          <div className="filters-row">
            <div
              className="filter-buttons"
              style={{ gap: "50px", marginLeft: "70px" }}
            >
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

            <div className="search-create-wrapper">
              {!isVisitorView && (
                <button
                  className="btn primary create-post-btn"
                  onClick={() => setShowModal(true)}
                >
                  Create Post
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <i className="fa-solid fa-spinner fa-spin"></i> Loading your posts...
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

          {/* POSTS SECTION */}
          {!loading && !error && (
            <div className="posts-section">
              {filteredPosts.length === 0 && (
                <div className="no-posts">
                  <i className="fa-solid fa-box-open"></i>
                  <p>No posts to show.</p>
                  {!isVisitorView && (
                    <button
                      className="btn primary"
                      onClick={() => setShowModal(true)}
                    >
                      Create your first post
                    </button>
                  )}
                </div>
              )}

              {/* BUY/SELL */}
              {activeFilter === "Buy/Sell" && (
                <div className="buy-posts-container">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="buy-post-card"
                      onClick={() => {
                        setProfileSelectedPost(post);
                        setProfileCurrentImage(0);
                        setProfileShowModal(true);
                      }}
                    >
                      <div className="buy-post-image">
                        <img src={post.img} alt={post.title} />
                      </div>

                      <div className="buy-post-details">
                        <h4 className="buy-post-title">{post.title}</h4>

                        <div className="buy-post-actions">
                          <button className="btn small">
                            {post.category === "Buy/Sell"
                              ? `₱${post.price}`
                              : post.category}
                          </button>

                          {isVisitorView ? (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `Chat with ${nickname} about "${post.title}"`
                                );
                              }}
                            >
                              Chat
                            </button>
                          ) : (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setActionModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RENT */}
              {activeFilter === "Rent" && (
                <div className="rent-posts-container">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="rent-post-card"
                      onClick={() => {
                        setProfileSelectedPost(post);
                        setProfileCurrentImage(0);
                        setProfileShowModal(true);
                      }}
                    >
                      <div className="rent-post-image">
                        <img src={post.img} alt={post.title} />
                      </div>

                      <div className="rent-post-details">
                        <h4 className="rent-post-title">{post.title}</h4>

                        <div className="rent-post-actions">
                          <button className="btn small">
                            {post.category === "Rent" ? "Rent" : post.category}
                          </button>

                          {isVisitorView ? (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `Chat with ${nickname} about "${post.title}"`
                                );
                              }}
                            >
                              Chat
                            </button>
                          ) : (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setActionModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SWAP */}
              {activeFilter === "Swap" && (
                <div className="swap-posts-container">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="swap-post-card"
                      onClick={() => {
                        setProfileSelectedPost(post);
                        setProfileCurrentImage(0);
                        setProfileShowModal(true);
                      }}
                    >
                      <div className="swap-post-image">
                        <img src={post.img} alt={post.title} />
                      </div>

                      <div className="swap-post-details">
                        <h4 className="swap-post-title">{post.title}</h4>

                        <div className="swap-post-actions">
                          <button className="btn small">Swap</button>

                          {isVisitorView ? (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `Chat with ${nickname} about "${post.title}"`
                                );
                              }}
                            >
                              Chat
                            </button>
                          ) : (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setActionModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ALL POSTS */}
              {activeFilter === "All Posts" && (
                <div className="all-posts-container">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="all-post-card"
                      onClick={() => {
                        setProfileSelectedPost(post);
                        setProfileCurrentImage(0);
                        setProfileShowModal(true);
                      }}
                    >
                      <div className="all-post-image">
                        <img src={post.img} alt={post.title} />
                      </div>

                      <div className="all-post-details">
                        <h4 className="all-post-title">{post.title}</h4>

                        <div className="all-post-actions">
                          <button className="btn small">
                            {post.category === "Buy/Sell"
                              ? `₱${post.price}`
                              : post.category === "Rent"
                              ? "Rent"
                              : "Swap"}
                          </button>

                          {isVisitorView ? (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `Chat with ${nickname} about "${post.title}"`
                                );
                              }}
                            >
                              Chat
                            </button>
                          ) : (
                            <button
                              className="btn small ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setActionModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>


      {profileShowModal && profileSelectedPost && (
  <div
    className="profile-modal-overlay"
    onClick={() => setProfileShowModal(false)}
  >
    <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
      <button
        className="profile-close-btn"
        onClick={() => setProfileShowModal(false)}
      >
        ×
      </button>

      {/* LEFT IMAGE */}
      <div className="profile-modal-left">
        <img
          src={profileSelectedPost.img || profileSelectedPost.images?.[0] || "/images/default.png"}
          alt={profileSelectedPost.title || ""}
          className="profile-modal-img"
        />
      </div>

      {/* RIGHT INFO */}
      <div className="profile-modal-right scrollable">
        <h2>{profileSelectedPost.title}</h2>

        {(() => {
          const typeCategory = getPostTypeCategory(profileSelectedPost);

          return (
            <>
              {typeCategory === "rent" && (
                <>
                  <p><strong>Rent Price: </strong> {profileSelectedPost.rentPrice}</p>
                  <p><strong>Renting Time: </strong> {profileSelectedPost.rentTime}</p>
                </>
              )}

              {typeCategory === "swap" && (
                <>
                  <p><strong>Item Offered: </strong> {profileSelectedPost.title}</p>
                  <p><strong>Item Wanted: </strong> {profileSelectedPost.swapFor || "Not specified"}</p>
                </>
              )}

              <p><strong>Posted by: </strong> {profileSelectedPost.poster || "You"}</p>
              <p><strong>Date Posted: </strong> {profileSelectedPost.datePosted || "N/A"}</p>
              <p><strong>Category: </strong> {profileSelectedPost.category}</p>
              {profileSelectedPost.itemCategory && (
                <p><strong>Item Category: </strong> {profileSelectedPost.itemCategory}</p>)}
              <p><strong>Condition: </strong> {profileSelectedPost.condition || "N/A"}</p>

              {profileSelectedPost.availability && (
                <p><strong>Meet-Up Availability: </strong> 
                  {profileSelectedPost.availability.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                </p>
              )}

              {/* Description for all types */}
              {["buy", "rent", "swap"].includes(typeCategory) && (
                <p><strong>Description: </strong> {profileSelectedPost.description || profileSelectedPost.desc || "No description"}</p>
              )}
            </>
          );
        })()}
      </div>
    </div>
  </div>
)}

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

      {/*Updated Create Post using CreatePostModal*/}
      
    {/*}  {showModal && <CreatePostModal onClose={() => setShowModal(false)} onCreate={addPost} />}*/}
    
    {actionModalOpen && (
        <PostActionModal
          post={selectedPost}
          onClose={() => setActionModalOpen(false)}
          onDelete={(id) => handleDeletePost(id)}
          onEdit={(updatedPost) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
            setActionModalOpen(false);
          }}
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