import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../../services/api";
import "./HomePage.css";
import AppNavbar from "../AppNavbar";
import PostItemModal from "./PostItemModal";
import ConfirmationModal from "./ConfirmationMsg";
import { useRentalRequests } from "./RentalRequestContext";
import { useSwapRequests } from "./SwapRequestContext";

export default function HomePage() {
  const { addToCart } = useCart();
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isSticky, setIsSticky] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [username, setUsername] = useState("User");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Confirmation Modal States
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationItem, setConfirmationItem] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState("");

  // Backend Data States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState([]); // NEW FEATURE: Wishlist State

  const navigate = useNavigate();
  const { addRentalRequest } = useRentalRequests();
  const { addSwapRequest } = useSwapRequests();

  // Scroll & User Effect
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);

    // Load wishlist from storage on mount
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Products
  useEffect(() => {
    loadProducts();
    const handleFocus = () => loadProducts();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProducts({});

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
          month: "short", day: "numeric", year: "numeric",
        }),
        category: product.category_name,
        availability: product.availability?.map((day) => day.toLowerCase()) || [],
        product_id: product.product_id,
        listing_type: product.listing_type,
        price: product.price,
        rental_price: product.rental_price,
        posted_by: product.posted_by,
        status: product.status,
      }));

      setPosts(transformedPosts);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeDisplay = (product) => {
    if (product.listing_type === "sell" && product.price) return `₱${parseFloat(product.price).toLocaleString()}`;
    if (product.listing_type === "rent" && product.rental_price) return "Rent";
    if (product.listing_type === "swap") return "Swap";
    return "N/A";
  };

  const handleActionClick = (post, actionType) => {
    setConfirmationItem(post);
    setConfirmationAction(actionType);
    setIsConfirmationOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmationItem || !confirmationAction) return;

    if (confirmationAction === "Buy") {
      navigate(`/checkout/${confirmationItem.id}`);
    } else if (confirmationAction === "Rent") {
      alert(`Your rent request is being processed!`);
      addRentalRequest({
        request_id: Date.now(),
        product_name: confirmationItem.name,
        renter_name: username,
        rentee_name: confirmationItem.poster,
        rent_start: new Date().toISOString(),
        rent_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
      });
    } else if (confirmationAction === "Swap") {
      alert(`Your swap request is being processed!`);
      addSwapRequest({
        swap_id: Date.now(),
        requester_name: username,
        receiver_name: confirmationItem.poster,
        product_offered_name: confirmationItem.name,
        product_requested_name: confirmationItem.swapFor || "Not specified",
        status: "pending",
      });
    }
    setIsConfirmationOpen(false);
  };

  const handleAddToCart = (post) => {
    const price = post.type.includes("₱") ? parseFloat(post.type.replace(/[₱,]/g, "")) || 0 : 0;
    addToCart({
      id: post.id,
      name: post.name,
      img: post.image,
      price: price,
      type: post.type,
    });
    alert(`${post.name} added to cart!`);
  };

  // NEW: Wishlist Toggle Logic
  const handleToggleWishlist = (post, e) => {
    e.stopPropagation();
    const isWished = wishlist.includes(post.id);
    let newWishlist;
    if (isWished) {
      newWishlist = wishlist.filter(id => id !== post.id);
    } else {
      newWishlist = [...wishlist, post.id];
    }
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  };
  
  const getButtonText = () => {
    switch (filter) {
      case "buy/sell": return "Sell Item";
      case "rent": return "Rent Item";
      case "swap": return "Swap Item";
      default: return "Post Item";
    }
  };
  
  // PERFORMANCE FIX: Use useMemo for heavy filtering/sorting
  const sortedAndFilteredPosts = useMemo(() => {
    let tempPosts = posts
      .filter((post) => {
        const serviceMatch = filter === "all" ? true :
          filter === "buy/sell" ? post.type.includes("₱") :
          post.type.toLowerCase() === filter;

        const categoryMatch = !category || (post.category && post.category.toLowerCase() === category.toLowerCase());
        
        const availabilityMatch = availability.length === 0 ||
          (post.availability && availability.some((day) => post.availability.includes(day)));
        
        const searchMatch = post.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            post.description.toLowerCase().includes(searchTerm.toLowerCase());

        return serviceMatch && categoryMatch && availabilityMatch && searchMatch;
      })
      .sort((a, b) => {
        if (sortOption === "price_asc") {
          const priceA = parseFloat(a.price || a.rental_price || 0);
          const priceB = parseFloat(b.price || b.rental_price || 0);
          return priceA - priceB;
        }
        if (sortOption === "price_desc") {
          const priceA = parseFloat(a.price || a.rental_price || 0);
          const priceB = parseFloat(b.price || b.rental_price || 0);
          return priceB - priceA;
        }
        // Default: newest (by datePosted or created_at)
        return new Date(b.datePosted) - new Date(a.datePosted);
      });
      return tempPosts;
  }, [posts, filter, category, availability, searchTerm, sortOption]); // Dependencies

  // Render Skeleton Loader
  const renderSkeletons = () => (
    Array(6).fill(0).map((_, index) => (
      <div key={index} className="post-card skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-text title"></div>
        <div className="skeleton-text subtitle"></div>
      </div>
    ))
  );

  // Helper function for Category Icon
  const getCategoryIcon = (cat) => {
    switch(cat.toLowerCase()) {
        case 'electronics': return 'fa-solid fa-bolt';
        case 'books': return 'fa-solid fa-book';
        case 'clothing': return 'fa-solid fa-shirt';
        case 'furniture': return 'fa-solid fa-chair';
        default: return 'fa-solid fa-layer-group';
    }
  };

  return (
    <div className="homepage">
      <AppNavbar />

      {/* Hero Welcome Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome back, <span>{username}</span>! 👋</h1>
          <p>Find what you need or give your items a new home.</p>
        </div>
      </div>

      <div className={`service-navbar ${isSticky ? "scrolled" : ""}`}>
        <div className="filter-tabs">
          {["all", "buy/sell", "rent", "swap"].map((type) => (
            <button
              key={type}
              className={`service-btn ${filter === type ? "active" : ""}`}
              onClick={() => setFilter(type)}
            >
              {type === "buy/sell" ? "Buy/Sell" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Search and Sort Group */}
        <div className="search-sort-group">
          
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
          </div>

          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="sort-dropdown">
            <option value="newest">Newest</option>
            <option value="price_asc">Price Low → High</option>
            <option value="price_desc">Price High → Low</option>
          </select>
          
          <button className="post-item-btn desktop-only" onClick={() => setIsPostModalOpen(true)}>
            {getButtonText()} <i className="fa-solid fa-plus"></i>
          </button>
          
          {/* NEW: My Posts Shortcut */}
          <button className="my-posts-btn" onClick={() => navigate("/my-posts")}>
            <i className="fa-solid fa-store"></i> My Posts
          </button>

        </div>

      </div>

      <div className="homepage-container">
        {/* Sidebar Filters */}
        <div className={`sidebar ${showFilters ? "show" : ""}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="close-filter-btn" onClick={() => setShowFilters(false)}>&times;</button>
          </div>

          <div className="filter-section">
            <label><i className="fa-solid fa-layer-group"></i> Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="clothing">Clothing</option>
              <option value="furniture">Furniture</option>
              <option value="sports & outdoors">Sports & Outdoors</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="filter-section">
            <label><i className="fa-regular fa-calendar-check"></i> Availability</label>
            <div className="availability-options">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <label key={day} className="availability-checkbox">
                  <input
                    type="checkbox"
                    checked={availability.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) setAvailability([...availability, day]);
                      else setAvailability(availability.filter((d) => d !== day));
                    }}
                  />
                  <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* NEW: Show Only Available Toggle */}
          <div className="filter-section">
            <label><i className="fa-solid fa-check-circle"></i> Stock</label>
            <label className="availability-checkbox">
                <input type="checkbox" />
                <span>Show Only Available</span>
            </label>
          </div>

        </div>

        <main className="posts-container">
          {loading ? (
            <div className="posts-grid">{renderSkeletons()}</div>
          ) : error ? (
            <div className="error-message">
              <img src="/images/error-icon.png" alt="Error" width="50" />
              <p>{error}</p>
              <button onClick={loadProducts} className="retry-btn">
                <i className="fa-solid fa-rotate-right"></i> Retry
              </button>
            </div>
          ) : sortedAndFilteredPosts.length === 0 ? (
            <div className="no-products">
              <i className="fa-solid fa-box-open fa-3x"></i>
              <p>No items found matching your criteria.</p>
              <button className="post-item-btn" onClick={() => setIsPostModalOpen(true)}>
                Post an Item
              </button>
            </div>
          ) : (
            <div className="posts-grid">
              {sortedAndFilteredPosts.map((post) => (
                <div key={post.id} className="post-card" onClick={() => setSelectedPost(post)}>
                  <div className="card-image-container">
                    <img src={post.image} alt={post.name} loading="lazy" />
                    <span className={`badge ${post.listing_type}`}>{post.type}</span>
                    
                    {/* NEW: Wishlist Icon */}
                    <button 
                        className={`wishlist-btn ${wishlist.includes(post.id) ? 'active' : ''}`}
                        onClick={(e) => handleToggleWishlist(post, e)}
                    >
                        <i className={`fa-heart ${wishlist.includes(post.id) ? 'fa-solid' : 'fa-regular'}`}></i>
                    </button>

                  </div>
                  
                  <div className="post-info">
                    <div className="poster-meta">
                      <img src={post.profile} alt="User" onError={(e) => e.target.src='/images/default-profile.jpg'} />
                      <span className="poster-name">{post.poster}</span>
                      {/* Optional: Verified Badge Icon here */}
                    </div>
                    <h4>{post.name}</h4>
                    
                    {/* NEW: Condition and Category Chip */}
                    <div className="item-details-row">
                        <span className="condition-tag">{post.condition || "Used"}</span>
                        <span className="category-tag"><i className={getCategoryIcon(post.category)}></i> {post.category}</span>
                    </div>

                    <p className="post-date"><i className="fa-regular fa-clock"></i> {post.datePosted}</p>
                    
                    <div className="post-actions">
                      {post.type.startsWith("₱") && (
                        <button 
                          className="action-btn buy-btn"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(post); }}
                        >
                          <i className="fa-solid fa-cart-plus"></i> Add
                        </button>
                      )}
                      {/* NEW: Chat Button on Card */}
                      <button 
                          className="action-btn chat-card-btn"
                          onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}
                      >
                          <i className="fa-solid fa-comment-dots"></i> Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <button className="fab-post mobile-only" onClick={() => setIsPostModalOpen(true)}>
        <i className="fa-solid fa-plus"></i>
      </button>

      {/* Product Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedPost(null)}>&times;</button>
            
            <div className="product-modal-grid">
              <div className="product-image-section">
                <img src={selectedPost.image} alt={selectedPost.name} />
              </div>
              
              <div className="product-details-section">
                <div className="modal-header">
                  <span className={`status-badge ${selectedPost.listing_type}`}>{selectedPost.type}</span>
                  <h2>{selectedPost.name}</h2>
                </div>

                <div className="seller-card">
                  <img src={selectedPost.profile} alt="Seller" />
                  <div>
                    <p className="seller-label">Listed by</p>
                    <p className="seller-name">{selectedPost.poster}</p>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <i className="fa-solid fa-layer-group"></i>
                    <span>{selectedPost.category || "General"}</span>
                  </div>
                  <div className="info-item">
                    <i className="fa-solid fa-star-half-stroke"></i>
                    <span>{selectedPost.condition || "Used"}</span>
                  </div>
                  <div className="info-item">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{selectedPost.datePosted}</span>
                  </div>
                </div>

                <div className="description-box">
                  <h4>Description</h4>
                  <p>{selectedPost.description || "No description provided."}</p>
                </div>

                <div className="modal-footer-actions">
                  {selectedPost.type.startsWith("₱") ? (
                    <button className="primary-action-btn" onClick={() => handleActionClick(selectedPost, "Buy")}>
                      Buy Now
                    </button>
                  ) : (
                    <button className="primary-action-btn" onClick={() => handleActionClick(selectedPost, selectedPost.listing_type === 'rent' ? "Rent" : "Swap")}>
                      Request {selectedPost.listing_type === 'rent' ? "Rent" : "Swap"}
                    </button>
                  )}
                  {/* NEW: Chat Seller Button in Modal */}
                  <button className="secondary-action-btn" onClick={() => navigate("/chat")}>
                    <i className="fa-solid fa-comment-dots"></i> Message Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          loadProducts();
        }}
        activeFilter={filter}
      />

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirm}
        actionType={confirmationAction}
        itemName={confirmationItem?.name}
      />
    </div>
  );
}