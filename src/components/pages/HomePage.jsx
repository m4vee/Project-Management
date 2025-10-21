import React, { useState, useEffect } from 'react';
import './HomePage.css';
import AppNavbar from '../AppNavbar';
import PostItemModal from './PostItemModal';

export default function HomePage() {
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 9999]);
  const [availability, setAvailability] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isSticky, setIsSticky] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- MODIFIED DATA: Added 'availability' arrays to some posts ---
  const posts = [
      { id: 1, image: "/images/laptop.jpg", name: "Vintage Camera", profile: "/images/aiah.webp", poster: "Aiah Arceta", type: "Rent", description: "A classic film camera in great condition, perfect for photography students.", condition: "Good", rentTime: "3 days minimum", datePosted: "Oct 10, 2025", category: "Electronics", availability: ['monday', 'wednesday', 'friday'] },
      { id: 2, image: "/images/pc.jpg", name: "Wireless Headphones", profile: "/images/colet.webp", poster: "Colet Vergara", type: "Swap", availability: ['tuesday', 'thursday'] },
      { id: 3, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "₱600", availability: ['saturday', 'sunday'] },
      { id: 4, image: "/images/laptop.jpg", name: "Vintage Camera", profile: "/images/aiah.webp", poster: "Aiah Arceta", type: "₱6000", description: "A classic film camera in great condition, perfect for photography students.", condition: "Good", availability: "Monday to Friday", rentTime: "3 days minimum", datePosted: "Oct 10, 2025", category: "Electronics", availability: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      { id: 5, image: "/images/pc.jpg", name: "Wireless Headphones", profile: "/images/colet.webp", poster: "Colet Vergara", type: "₱800" }, // No availability set
      { id: 6, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "₱600", availability: ['wednesday'] },
      { id: 7, image: "/images/laptop.jpg", name: "Vintage Camera", profile: "/images/aiah.webp", poster: "Aiah Arceta", type: "Rent", availability: ['tuesday', 'thursday'] },
      { id: 8, image: "/images/pc.jpg", name: "Wireless Headphones", profile: "/images/colet.webp", poster: "Colet Vergara", type: "₱800", availability: ['friday'] },
      { id: 9, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "Swap" },
      { id: 10, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "₱600", availability: ['saturday', 'sunday'] },
      { id: 11, image: "/images/laptop.jpg", name: "Vintage Camera", profile: "/images/aiah.webp", poster: "Aiah Arceta", type: "₱1,500" },
      { id: 12, image: "/images/pc.jpg", name: "Wireless Headphones", profile: "/images/colet.webp", poster: "Colet Vergara", type: "₱800", availability: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      { id: 13, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "₱600" },
      { id: 14, image: "/images/laptop.jpg", name: "Vintage Camera", profile: "/images/aiah.webp", poster: "Aiah Arceta", type: "Rent", availability: ['wednesday'] },
      { id: 15, image: "/images/pc.jpg", name: "Wireless Headphones", profile: "/images/colet.webp", poster: "Colet Vergara", type: "₱800", availability: ['tuesday', 'thursday'] },
      { id: 16, image: "/images/bag.jpg", name: "Laptop Bag", profile: "/images/jhoanna.webp", poster: "Jhoanna Robles", type: "Swap", availability: ['monday', 'friday'] },
  ];

  const filteredPosts = posts.filter((post) => {
    const serviceMatch =
      filter === "all"
        ? true
        : filter === "buy/sell"
        ? post.type.includes("₱")
        : post.type.toLowerCase() === filter;
    const categoryMatch =
      !category || (post.category && post.category.toLowerCase() === category.toLowerCase());
    const numericPrice = parseFloat(post.type.replace(/[₱,]/g, "")) || 0;
    const priceMatch =
      !post.type.includes("₱") || (numericPrice >= priceRange[0] && numericPrice <= priceRange[1]);

    // --- UPDATED FILTER LOGIC for Availability ---
    const availabilityMatch =
      availability.length === 0 || // If no filter is set, show all
      (post.availability && // Check if the post has an availability array
        availability.some(day => post.availability.includes(day))); // Show if the post is available on AT LEAST ONE of the selected days

    return serviceMatch && categoryMatch && priceMatch && availabilityMatch;
  });


  const openModal = (post) => setSelectedPost(post);
  const closeModal = () => setSelectedPost(null);

  const getButtonText = () => {
    switch (filter) {
      case 'buy/sell': return 'Sell Item';
      case 'rent': return 'Rent Item';
      case 'swap': return 'Swap Item';
      default: return null;
    }
  };
  const buttonText = getButtonText();

  return (
    <div className="homepage">
      <AppNavbar />

      <div className={`service-navbar ${isSticky ? "scrolled" : ""}`}>
        <div>
            <button className={`service-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`service-btn ${filter === "buy/sell" ? "active" : ""}`} onClick={() => setFilter("buy/sell")}>Buy</button>
            <button className={`service-btn ${filter === "rent" ? "active" : ""}`} onClick={() => setFilter("rent")}>Rent</button>
            <button className={`service-btn ${filter === "swap" ? "active" : ""}`} onClick={() => setFilter("swap")}>Swap</button>
        </div>
        {buttonText && (
          <button className="post-item-btn" onClick={() => setIsPostModalOpen(true)}>
            {buttonText} <i className="fa-solid fa-plus"></i>
          </button>
        )}
      </div>

      <div className="homepage-container">
        <button className="filter-toggle" onClick={() => setShowFilters(true)}>
          <i className="fas fa-filter"></i>
        </button>

        <div className={`sidebar ${showFilters ? "show" : ""}`}>
          <button className="close-filter-btn" onClick={() => setShowFilters(false)}>&times;</button>
          <h3>Filters</h3>

          <div className="filter-section">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              <option value="arts">Arts and Crafts</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="uniform">Uniform</option>
              <option value="gadgets">Gadgets</option>
              <option value="others">Others School Stuffs</option>
            </select>
          </div>

          <div className="filter-section">
            <label>Price Range</label>
            <input type="range" min="0" max="9999" value={priceRange[1]} onChange={(e) => setPriceRange([0, e.target.value])}/>
            <p>Up to ₱{priceRange[1]}</p>
          </div>

          <div className="filter-section">
            <label>Availability</label>
              <div className="availability-options">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <label key={day} className="availability-checkbox">
                    <input type="checkbox" value={day} checked={availability.includes(day)}
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
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card" onClick={() => openModal(post)}>
              <img src={post.image} alt={post.name} className="post-image" />
              <div className="post-info">
                <div className="poster-info">
                  <img src={post.profile} alt={post.poster} className="poster-pic" />
                  <span className="poster-name">{post.poster}</span>
                </div>
                <h4>{post.name}</h4>
                <div className="post-actions">
                  <button className="price-btn">{post.type}</button>
                  <button className="addtocart-btn">
                    <i className="fa-solid fa-cart-plus"></i>
                  </button>
                  <button className="chat-btn">
                    <i className="fa-solid fa-comment"></i> Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>

      {selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPost.image} alt={selectedPost.name} className="modal-image" />
            <div className="modal-details">
              <h2>{selectedPost.name}</h2>
              <p><strong>Category:</strong> {selectedPost.category}</p>
              <p><strong>Posted by:</strong> {selectedPost.poster}</p>
              <p><strong>Date Posted:</strong> {selectedPost.datePosted}</p>
              <p><strong>Condition:</strong> {selectedPost.condition}</p>
              {/* Display availability if it exists */}
              {selectedPost.availability && <p><strong>Availability:</strong> {selectedPost.availability.join(', ')}</p>}
              <p><strong>Renting Time:</strong> {selectedPost.rentTime}</p>
              <p><strong>Description:</strong> {selectedPost.description}</p>
              <div className="modal-actions">
                <button className="price-btn">{selectedPost.type}</button>
                <button className="addtocart-btn">
                  <i className="fa-solid fa-cart-plus"></i>
                </button>
                <button className="chat-btn">
                  <i className="fa-solid fa-comment"></i> Chat
                </button>
              </div>
            </div>
            <button className="close-btn" onClick={closeModal}>×</button>
          </div>
        </div>
      )}

      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        activeFilter={filter}
      />
    </div>
  );
}

