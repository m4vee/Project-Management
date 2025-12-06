import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts, deleteProduct } from "../../services/api";
import PostItemModal from "./PostItemModal";
import RatingBox from "./RatingBox";
//import CreatePostModal from "./CreatePostModal";
import "./Profile.css";
//import RatingBox from "./RatingBox";
import PostActionModal from "./PostActionModal";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop&crop=entropy";
const DEFAULT_AVATAR = "images/no_profile.jpg";

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

  // Posts state - from backend
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Posts");
  const [showModal, setShowModal] = useState(false);

  //i dont know if needed to pero kasi nag eerror if diko nilagay
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

  const handleDeletePost = async (productId) => {
    console.log("🗑️ Delete button clicked for product:", productId);

    if (!window.confirm("Are you sure you want to delete this post?")) {
      console.log("❌ User cancelled deletion");
      return;
    }

    try {
      console.log("🚀 Calling deleteProduct API...");
      const result = await deleteProduct(productId);
      console.log("✅ Delete API response:", result);

      // Update UI by removing the deleted post
      setPosts((prevPosts) => {
        const updatedPosts = prevPosts.filter(
          (post) => post.product_id !== productId
        );
        console.log("📝 Posts after deletion:", updatedPosts);
        return updatedPosts;
      });

      alert("Post successfully deleted!");
      setActionModalOpen(false);
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert(`Deletion failed: ${error.message}`);
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

          {/*<div className="top-search">
            <input
              type="text"
              placeholder="Search"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
            />
          </div>*/}
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
              <Link
                to="/cart"
                className="dd-item"
                onClick={() => setDropdownOpen(false)}
              >
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
            {/*<div className="right-col">
              <div className="profile-info">
                <RatingBox
                  sellerId="krislyn"
                  reviews={[
                    {
                      id: 1,
                      user: "Anna",
                      rating: 5,
                      comment: "Very smooth transaction!",
                    },
                    {
                      id: 2,
                      user: "Mark",
                      rating: 4,
                      comment: "Item in good condition.",
                    },
                    {
                      id: 3,
                      user: "Joan",
                      rating: 5,
                      comment: "Super bait seller!",
                    },
                  ]}
                />
              </div>
            </div>*/}

            {/*}
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
            </div>*/}
          </div>
        </section>
        {/*}
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
*/}
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
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-close-btn"
              onClick={() => setProfileShowModal(false)}
            >
              ×
            </button>

            {/* LEFT IMAGE */}
            <div className="profile-modal-left">
              <img
                src={
                  profileSelectedPost.img ||
                  profileSelectedPost.images?.[0] ||
                  "/images/default.png"
                }
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
                        <p>
                          <strong>Rent Price: </strong>{" "}
                          {profileSelectedPost.rentPrice}
                        </p>
                        <p>
                          <strong>Renting Time: </strong>{" "}
                          {profileSelectedPost.rentTime}
                        </p>
                      </>
                    )}

                    {typeCategory === "swap" && (
                      <>
                        <p>
                          <strong>Item Offered: </strong>{" "}
                          {profileSelectedPost.title}
                        </p>
                        <p>
                          <strong>Item Wanted: </strong>{" "}
                          {profileSelectedPost.swapFor || "Not specified"}
                        </p>
                      </>
                    )}

                    <p>
                      <strong>Posted by: </strong>{" "}
                      {profileSelectedPost.poster || "You"}
                    </p>
                    <p>
                      <strong>Date Posted: </strong>{" "}
                      {profileSelectedPost.datePosted || "N/A"}
                    </p>
                    <p>
                      <strong>Category: </strong> {profileSelectedPost.category}
                    </p>
                    {profileSelectedPost.itemCategory && (
                      <p>
                        <strong>Item Category: </strong>{" "}
                        {profileSelectedPost.itemCategory}
                      </p>
                    )}
                    <p>
                      <strong>Condition: </strong>{" "}
                      {profileSelectedPost.condition || "N/A"}
                    </p>

                    {profileSelectedPost.availability && (
                      <p>
                        <strong>Meet-Up Availability: </strong>
                        {profileSelectedPost.availability
                          .map(
                            (day) => day.charAt(0).toUpperCase() + day.slice(1)
                          )
                          .join(", ")}
                      </p>
                    )}

                    {/* Description for all types */}
                    {["buy", "rent", "swap"].includes(typeCategory) && (
                      <p>
                        <strong>Description: </strong>{" "}
                        {profileSelectedPost.description || "No description"}
                      </p>
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
          onDelete={async (id) => {
            // 1. Call the API handler and wait for it to confirm the deletion
            const successfullyDeleted = await handleDeletePost(id);

            if (successfullyDeleted) {
              // 2. Only update the UI state if the API call succeeded
              setPosts((prev) => prev.filter((p) => p.id !== id));
              // You can add an alert here for success if you haven't already: alert("Post successfully deleted!");
              setActionModalOpen(false);
            }
            // If successfullyDeleted is false, the modal stays open, and the user sees the error alert from handleDeletePost
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
