import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../../services/api";
import "./HomePage.css";
// import AppNavbar from "../AppNavbar"; 
import PostItemModal from "./PostItemModal";
import ConfirmationModal from "./ConfirmationMsg";
import { useRentalRequests } from "./RentalRequestContext";
import { useSwapRequests } from "./SwapRequestContext";

const BACKEND_URL = "http://127.0.0.1:5000";

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
  const [wishlist, setWishlist] = useState([]); 

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationItem, setConfirmationItem] = useState(null);
  const [confirmationAction, setConfirmationAction] = useState("");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // GET CURRENT USER ID (To check ownership)
  const currentUserId = parseInt(localStorage.getItem("user_id"));

  const navigate = useNavigate();
  const { addRentalRequest } = useRentalRequests();
  const { addSwapRequest } = useSwapRequests();

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);

    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProducts({});

      const transformedPosts = data.map((product) => {
        let imageUrl = "/images/placeholder.jpg";
        if (product.image_url) {
            imageUrl = product.image_url.startsWith("http") 
                ? product.image_url 
                : `${BACKEND_URL}${product.image_url}`;
        }

        return {
            id: product.id, 
            seller_id: product.seller_id,
            image: imageUrl, 
            name: product.name,
            profile: "/images/default-profile.jpg", 
            poster: product.seller_name || "Unknown",
            type: getTypeDisplay(product),
            description: product.description,
            condition: product.condition,
            datePosted: new Date(product.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            }),
            category: product.category,
            availability: product.availability ? product.availability.split(",") : [],
            listing_type: product.listing_type,
            price: product.price,
            status: product.status,
        };
      });

      setPosts(transformedPosts);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const handleFocus = () => loadProducts();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const getTypeDisplay = (product) => {
    if (product.listing_type === "sell") return `₱${parseFloat(product.price || 0).toLocaleString()}`;
    if (product.listing_type === "rent") return `Rent: ₱${product.price || 0}/day`;
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
      alert(`Rent request sent!`);
      addRentalRequest({
        product_id: confirmationItem.id, 
        product_name: confirmationItem.name,
        renter_name: username,
      });
    } else if (confirmationAction === "Swap") {
      alert(`Swap request sent!`);
      addSwapRequest({
        product_id: confirmationItem.id, 
        offer_description: "Offer to swap",
        requester_name: username,
      });
    }
    setIsConfirmationOpen(false);
  };

  const handleAddToCart = (post) => {
    const priceStr = String(post.type); 
    const price = priceStr.includes("₱") ? parseFloat(priceStr.replace(/[^\d.]/g, "")) : 0;
    
    addToCart({
      id: post.id,
      name: post.name,
      img: post.image,
      price: price,
      type: post.listing_type,
    });
    alert(`${post.name} added to cart!`);
  };

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
  
  const goToSellerProfile = (e, sellerId) => {
      e.stopPropagation();
      navigate(`/profile/${sellerId}`); 
  };
  
  const getButtonText = () => {
    switch (filter) {
      case "buy/sell": return "Sell Item";
      case "rent": return "Rent Item";
      case "swap": return "Swap Item";
      default: return "Post Item";
    }
  };
  
  const sortedAndFilteredPosts = useMemo(() => {
    let tempPosts = posts
      .filter((post) => {
        if (filter !== "all") {
            if (filter === "buy/sell" && post.listing_type !== "sell") return false;
            if (filter === "rent" && post.listing_type !== "rent") return false;
            if (filter === "swap" && post.listing_type !== "swap") return false;
        }
        if (category && post.category !== category) return false;
        if (searchTerm && !post.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOption === "newest") {
            return new Date(b.datePosted) - new Date(a.datePosted);
        }
        if (sortOption === "price_asc") {
           return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        }
        if (sortOption === "price_desc") {
           return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        }
        return 0;
      });
      return tempPosts;
  }, [posts, filter, category, searchTerm, sortOption]);

  const renderSkeletons = () => (
    Array(6).fill(0).map((_, index) => (
      <div key={index} className="post-card skeleton-card">
        <div className="skeleton-image"></div>
        <div className="skeleton-text title"></div>
        <div className="skeleton-text subtitle"></div>
      </div>
    ))
  );

  const getCategoryIcon = (cat) => {
    if(!cat) return 'fa-solid fa-layer-group';
    const map = {
        'electronics': 'fa-bolt',
        'books': 'fa-book',
        'clothing': 'fa-shirt',
        'furniture': 'fa-chair',
        'gadgets': 'fa-mobile-screen',
        'sports': 'fa-basketball',
        'others': 'fa-box'
    };
    return `fa-solid ${map[cat.toLowerCase()] || 'fa-layer-group'}`;
  };

  return (
    <div className="homepage">
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
          
          <button className="my-posts-btn" onClick={() => navigate("/my-posts")}>
            <i className="fa-solid fa-store"></i> My Posts
          </button>
        </div>
      </div>

      <div className="homepage-container">
        <div className={`sidebar ${showFilters ? "show" : ""}`}>
            <div className="sidebar-header">
                <h3>Filters</h3>
                <button className="close-filter-btn" onClick={() => setShowFilters(false)}>&times;</button>
            </div>
            <div className="filter-section">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Books">Books</option>
                <option value="Clothing">Clothing</option>
                <option value="Furniture">Furniture</option>
                <option value="Gadgets">Gadgets</option>
                <option value="Sports">Sports</option>
                <option value="Others">Others</option>
                </select>
            </div>
            
            <div className="filter-section">
                <label>Availability</label>
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
        </div>

        <main className="posts-container">
          {loading ? (
            <div className="posts-grid">{renderSkeletons()}</div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadProducts} className="retry-btn">Retry</button>
            </div>
          ) : sortedAndFilteredPosts.length === 0 ? (
            <div className="no-products">
              <i className="fa-solid fa-box-open fa-3x" style={{color: '#ccc', marginBottom: '15px'}}></i>
              <p>No items found.</p>
              <button className="post-item-btn" onClick={() => setIsPostModalOpen(true)}>
                Post the first item!
              </button>
            </div>
          ) : (
            <div className="posts-grid">
              {sortedAndFilteredPosts.map((post) => {
                // Check if the current user is the owner of the post
                const isOwner = post.seller_id === currentUserId;

                return (
                  <div key={post.id} className="post-card" onClick={() => setSelectedPost(post)}>
                    <div className="card-image-container">
                      <img src={post.image} alt={post.name} loading="lazy" onError={(e) => { e.target.src = "/images/placeholder.jpg"; }} />
                      <span className={`badge ${post.listing_type}`}>{post.listing_type}</span>
                      
                      {!isOwner && (
                        <button 
                            className={`wishlist-btn ${wishlist.includes(post.id) ? 'active' : ''}`}
                            onClick={(e) => handleToggleWishlist(post, e)}
                        >
                            <i className={`fa-heart ${wishlist.includes(post.id) ? 'fa-solid' : 'fa-regular'}`}></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="post-info">
                      <div className="poster-meta" onClick={(e) => goToSellerProfile(e, post.seller_id)} style={{cursor: 'pointer'}}>
                        <img src={post.profile} alt="User" onError={(e) => e.target.src='/images/default-profile.jpg'} />
                        <span className="poster-name">{isOwner ? "You" : post.poster}</span>
                      </div>

                      <h4>{post.name}</h4>
                      
                      <div className="item-details-row">
                          <span className="condition-tag">{post.condition || "Used"}</span>
                          <span className="category-tag"><i className={getCategoryIcon(post.category)}></i> {post.category}</span>
                      </div>

                      <p className="post-date"><i className="fa-regular fa-clock"></i> {post.datePosted}</p>
                      
                      <div className="post-actions">
                           <span style={{fontWeight: 'bold', color: '#8B0000'}}>{post.type}</span>
                           
                           {/* LOGIC: Hide buttons if owner, show badge instead */}
                           {isOwner ? (
                               <span className="owner-badge">Your Item</span>
                           ) : (
                               <>
                                   {post.listing_type === 'sell' && (
                                       <button className="action-btn buy-btn" onClick={(e) => { e.stopPropagation(); handleAddToCart(post); }}>
                                          <i className="fa-solid fa-cart-plus"></i>
                                       </button>
                                   )}
                                   <button className="action-btn chat-card-btn" onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}>
                                        <i className="fa-solid fa-comment-dots"></i>
                                   </button>
                               </>
                           )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

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

                <div className="seller-card" onClick={(e) => goToSellerProfile(e, selectedPost.seller_id)} style={{cursor: 'pointer'}}>
                  <img src={selectedPost.profile} alt="Seller" onError={(e) => e.target.src='/images/default-profile.jpg'} />
                  <div>
                    <p className="seller-label">Listed by</p>
                    <p className="seller-name">
                        {selectedPost.seller_id === currentUserId ? "You" : selectedPost.poster}
                    </p>
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
                  {/* LOGIC: Hide Action Buttons in Modal if Owner */}
                  {selectedPost.seller_id === currentUserId ? (
                      <button className="secondary-action-btn" style={{width: '100%', cursor: 'default', background: '#f0f0f0', border: 'none'}}>
                        This is your item
                      </button>
                  ) : (
                      <>
                        {selectedPost.listing_type === 'sell' ? (
                            <button className="primary-action-btn" onClick={() => handleActionClick(selectedPost, "Buy")}>
                            Buy Now
                            </button>
                        ) : (
                            <button className="primary-action-btn" onClick={() => handleActionClick(selectedPost, selectedPost.listing_type === 'rent' ? "Rent" : "Swap")}>
                            Request {selectedPost.listing_type === 'rent' ? "Rent" : "Swap"}
                            </button>
                        )}
                        <button className="secondary-action-btn" onClick={() => navigate("/chat")}>
                            <i className="fa-solid fa-comment-dots"></i> Message Seller
                        </button>
                      </>
                  )}
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