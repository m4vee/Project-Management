import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from "react-router-dom";
import './HomePage.css';
import AppNavbar from '../AppNavbar';
import PostItemModal from './PostItemModal';
import ConfirmationModal from './ConfirmationMsg';
import { useRentalRequests } from './RentalRequestContext';
import { useSwapRequests } from './SwapRequestContext';


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
  const navigate = useNavigate();
  const getPostTypeCategory = (post) => {
  if (post.type === "Rent") return "rent";
  if (post.type === "Swap") return "swap";
  if (post.type.startsWith("₱")) return "buy"; 
  return "unknown";
  };

  const [currentImage, setCurrentImage] = useState(0);

  const showNextImage = () => {
    if (!selectedPost.images) return;
    setCurrentImage((prev) => (prev + 1) % selectedPost.images.length);
  };

  const showPrevImage = () => {
    if (!selectedPost.images) return;
    setCurrentImage((prev) =>
      (prev - 1 + selectedPost.images.length) % selectedPost.images.length
    );
  };

const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
const [confirmationItem, setConfirmationItem] = useState(null);
const [confirmationAction, setConfirmationAction] = useState("");

const handleActionClick = (post, actionType) => {
  setConfirmationItem(post);
  setConfirmationAction(actionType);
  setIsConfirmationOpen(true);
};

const { addRentalRequest } = useRentalRequests();
const { addSwapRequest } = useSwapRequests();

const handleConfirm = () => {
  if (!confirmationItem || !confirmationAction) return;

  if (confirmationAction === "Buy") {
    //handleAddToCart(confirmationItem);
    alert(`You have successfully purchased ${confirmationItem.name}!`);
  }

  if (confirmationAction === "Rent") {
    alert(`Your rent request is being processed!`);
    
    // Add request to rental requests
    const newRequest = {
      request_id: Date.now(), // temp unique id
      product_name: confirmationItem.name,
      renter_name: "Krislyn Sayat", // replace with logged-in user
      rentee_name: confirmationItem.poster,
      rent_start: new Date().toISOString(),
      rent_end: new Date(Date.now() + 3*24*60*60*1000).toISOString(), // example 3 days
      status: "pending",
    };

    addRentalRequest(newRequest);
  }

  if (confirmationAction === "Swap") {
    alert(`Your swap request is being processed!`);

     addSwapRequest({
    swap_id: Date.now(),
    requester_name: "Krislyn Sayat",
    receiver_name: confirmationItem.poster,
    product_offered_name: confirmationItem.name,
    product_requested_name: confirmationItem.swapFor || "Not specified",
    status: "pending",
  });
  }

  setIsConfirmationOpen(false);
};





  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const posts = [
  {
    id: 1,
    image: "/images/laptop.jpg",
    name: "Vintage Camera",
    profile: "/images/aiah.webp",
    poster: "Aiah Arceta",
    type: "Rent",
    description: "A classic film camera in great condition, perfect for photography students.",
    condition: "Good",
    rentTime: "3 days minimum",
    rentPrice: "₱300/day",
    datePosted: "Oct 10, 2025",
    category: "Electronics",
    availability: ["monday", "wednesday", "friday"]
  },

  {
    id: 2,
    image: "/images/pc.jpg",
    name: "Wireless Headphones",
    swapFor: "Any Bluetooth Speaker",         // what they want
    profile: "/images/colet.webp",
    poster: "Colet Vergara",
    type: "Swap",
    description: "Looking to trade these headphones for a Bluetooth speaker.",
    condition: "Good",
    datePosted: "Oct 11, 2025",
    category: "Electronics",
    availability: ["tuesday", "thursday"]
  },

  {
    id: 3,
    image: "/images/bag.jpg",
    name: "Laptop Bag",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "₱600",
    description: "Durable laptop bag with spacious compartments.",
    condition: "Very Good",
    datePosted: "Oct 12, 2025",
    category: "Others",
    availability: ["saturday", "sunday"]
  },

  {
    id: 4,
    image: "/images/laptop.jpg",
    name: "Vintage Camera",
    profile: "/images/aiah.webp",
    poster: "Aiah Arceta",
    type: "₱6000",
    description: "Film camera in great condition, very collectible.",
    condition: "Good",
    datePosted: "Oct 10, 2025",
    category: "Electronics",
    availability: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },

  {
    id: 5,
    image: "/images/pc.jpg",
    name: "Wireless Headphones",
    profile: "/images/colet.webp",
    poster: "Colet Vergara",
    type: "₱800",
    description: "Noise-cancelling headphones, lightly used.",
    condition: "Good",
    datePosted: "Oct 14, 2025",
    category: "Electronics",
    availability: []
  },

  {
    id: 6,
    image: "/images/bag.jpg",
    name: "Laptop Bag",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "₱600",
    description: "Sturdy laptop bag with waterproof lining.",
    condition: "Good",
    datePosted: "Oct 9, 2025",
    category: "Others",
    availability: ["wednesday"]
  },

  {
    id: 7,
    image: "/images/laptop.jpg",
    name: "Vintage Camera",
    profile: "/images/aiah.webp",
    poster: "Aiah Arceta",
    type: "Rent",
    description: "Old-school camera ideal for film photography lessons.",
    condition: "Good",
    rentTime: "2 days minimum",
    rentPrice: "₱250/day",
    datePosted: "Oct 5, 2025",
    category: "Electronics",
    availability: ["tuesday", "thursday"]
  },

  {
    id: 8,
    image: "/images/pc.jpg",
    name: "Wireless Headphones",
    profile: "/images/colet.webp",
    poster: "Colet Vergara",
    type: "₱800",
    description: "Comfortable wireless headphones with clear bass.",
    condition: "Good",
    datePosted: "Oct 3, 2025",
    category: "Electronics",
    availability: ["friday"]
  },

  {
    id: 9,
    image: "/images/bag.jpg",
    name: "Laptop Bag",
    swapFor: "Sling Bag",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "Rent",
    description: "Laptop bag to swap for any sling bag.",
    condition: "Good",
    datePosted: "Oct 2, 2025",
    category: "Others",
    availability: ["monday"]
  },

  {
    id: 10,
    image: "/images/bag.jpg",
    name: "Laptop Bag",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "₱600",
    description: "Simple but stylish laptop bagffgggggg.",
    condition: "Good",
    datePosted: "Oct 1, 2025",
    category: "Others",
    availability: ["saturday", "sunday"]
  },

  {
    id: 11,
    image: "/images/laptop.jpg",
    name: "Vintage Camera",
    profile: "/images/aiah.webp",
    poster: "Aiah Arceta",
    type: "₱1500",
    description: "Mini point-and-shoot film camera.",
    condition: "Good",
    datePosted: "Oct 15, 2025",
    category: "Electronics",
    availability: []
  },

  {
    id: 12,
    image: "/images/pc.jpg",
    name: "Wireless Headphones",
    profile: "/images/colet.webp",
    poster: "Colet Vergara",
    type: "₱800",
    description: "Great battery life and clear sound.",
    condition: "Good",
    datePosted: "Oct 4, 2025",
    category: "Electronics",
    availability: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },

  {
    id: 13,
    image: "/images/bag.jpg",
    name: "Laptop Bag",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "₱600",
    description: "Perfect for 14–15 inch laptops.",
    condition: "Good",
    datePosted: "Oct 8, 2025",
    category: "Others",
    availability: []
  },

  {
    id: 14,
    image: "/images/laptop.jpg",
    name: "Vintage Camera",
    profile: "/images/aiah.webp",
    poster: "Aiah Arceta",
    type: "Rent",
    description: "Compact film camera for beginners.",
    condition: "Good",
    rentTime: "1 week minimum",
    rentPrice: "₱200/day",
    datePosted: "Oct 6, 2025",
    category: "Electronics",
    availability: ["wednesday"]
  },

  {
    id: 15,
    image: "/images/pc.jpg",
    name: "Wireless Headphones",
    profile: "/images/colet.webp",
    poster: "Colet Vergara",
    type: "₱800",
    description: "Lightweight headphones for daily use.",
    condition: "Good",
    datePosted: "Oct 13, 2025",
    category: "Electronics",
    availability: ["tuesday", "thursday"]
  },

  {
    id: 16,
    image: ["/images/bag.jpg", "/images/pc.jpg", "/images/laptop.jpg", "/images/pc.jpg", "/images/pc.jpg", "/images/pc.jpg", "/images/pc.jpg"],
    name: "Laptop Bag",
    swapFor: "Brown Backpack",
    profile: "/images/jhoanna.webp",
    poster: "Jhoanna Robles",
    type: "Swap",
    description: "Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack. Laptop bag available to trade for brown backpack.",
    condition: "Good",
    datePosted: "Oct 7, 2025",
    category: "Others",
    availability: ["monday", "friday"]
  }
];


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

    const numericPrice =
      parseFloat(post.type.replace(/[₱,]/g, "")) || 0;
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

  const openModal = (post) => {
    setSelectedPost({
    ...post,
    images: Array.isArray(post.image) ? post.image : [post.image] // ensure array
    });
    setCurrentImage(0); // start at first image
  };


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
          <button className="close-filter-btn" onClick={() => setShowFilters(false)}>
            &times;
          </button>

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
            <input
              type="range"
              min="0"
              max="9999"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, e.target.value])}
            />
            <p>Up to ₱{priceRange[1]}</p>
          </div>

          <div className="filter-section">
            <label>Availability</label>
            <div className="availability-options">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
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
        
        <div className="logout-wrapper">
    <button 
      className="logout-btn"
      onClick={() => {
        // Clear auth/session
        navigate('/login');
      }}
    >
      Log Out
    </button>
  </div>

        <main className="posts-container">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card" onClick={() => openModal(post)}>
              <img src={Array.isArray(post.image) ? post.image[0] : post.image} alt={post.name} className="post-image" />
              <div className="post-info">
                <div className="poster-info">
                  <img src={post.profile} alt={post.poster} className="poster-pic" />
                  <span className="poster-name">{post.poster}</span>
                </div>
                <h4>{post.name}</h4>
                <div className="post-actions">
                  <button className="price-btn">{post.type}</button>
                  
                  {post.type !== "Rent" && post.type !== "Swap" && post.type.startsWith("₱") && (
                  <button
                    className="addtocart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(post)
                    }}
                  >
                    <i className="fa-solid fa-cart-plus"></i>
                  </button>
                )}

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

      {selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-scrollable">
            <div className="modal-image-wrapper">
            <img 
              src={selectedPost.images?.[currentImage] || selectedPost.image}
              className="carousel-main-img"
              alt="Post"
            />

            {/* Prev / Next */}
            {selectedPost.images && selectedPost.images.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={showPrevImage}> <i class="fa-solid fa-arrow-left"></i> </button>
                <button className="carousel-btn next" onClick={showNextImage}> <i class="fa-solid fa-arrow-right"></i> </button>
              </>
            )}

            {/* Thumbnails */}
            {selectedPost.images && selectedPost.images.length > 1 && (
              <div className="carousel-thumbnails">
                {selectedPost.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    className={`carousel-thumb ${index === currentImage ? "active" : ""}`}
                    onClick={() => setCurrentImage(index)}
                    ref={(el) => {
                    if (index === currentImage && el) {
                      el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                    }
                  }}
                  />
                ))}
              </div>
            )}
          </div>

            <div className="modal-details scrollable">
              <h2>{selectedPost.name}</h2>
              
              {(() => {
              const typeCategory = getPostTypeCategory(selectedPost);

              return (
                <>
                  {typeCategory === "rent" && (
                    <>
                      <p><strong>Rent Price:</strong> {selectedPost.rentPrice}</p>
                      <p><strong>Renting Time:</strong> {selectedPost.rentTime}</p>
                    </>
                  )}

                  {typeCategory === "swap" && (
                    <>
                      <p><strong>Item Offered:</strong> {selectedPost.name}</p>
                      <p><strong>Item Wanted:</strong> {selectedPost.swapFor || "Not specified"}</p>
                    </>
                  )}

                  <p><strong>Posted by:</strong> {selectedPost.poster}</p>
                  <p><strong>Date Posted:</strong> {selectedPost.datePosted}</p>
                  <p><strong>Category:</strong> {selectedPost.category}</p>
                  <p><strong>Condition:</strong> {selectedPost.condition}</p>

                  {selectedPost.availability && (
                    <p><strong>Meet-Up Availability: </strong> 
                    {selectedPost.availability.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}</p>
                  )}

                  {/* BUY / SELL */}
                  {typeCategory === "buy" && (
                    <>
                      {/* Buy/Sell has NO renting fields */}
                      <p><strong>Description:</strong> {selectedPost.description}</p>
                    </>
                  )}

                  {typeCategory === "rent" && (
                    <>
                      <p><strong>Description:</strong> {selectedPost.description}</p>
                    </>
                  )}

                  {/* SWAP */}
                  {typeCategory === "swap" && (
                    <>
                      <p><strong>Description:</strong> {selectedPost.description}</p>
                    </>
                  )}
                </>
              );
            })()}

              <div className="modal-actions">
                <button
                  className="price-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedPost.type.startsWith("₱")) handleActionClick(selectedPost, "Buy");
                    if (selectedPost.type === "Rent") handleActionClick(selectedPost, "Rent");
                    if (selectedPost.type === "Swap") handleActionClick(selectedPost, "Swap");
                  }}
                >
                  {selectedPost.type}
                </button>
                  

                  {selectedPost.type !== "Rent" && selectedPost.type !== "Swap" && selectedPost.type.startsWith("₱") && (
                  <button
                    className="addtocart-btn"
                    onClick={() => handleAddToCart(selectedPost)}
                  >
                    <i className="fa-solid fa-cart-plus"></i>
                  </button>
                )}

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

            
            <button className="close-btn" onClick={closeModal}>×</button>
          </div>
          </div>
        </div>
      )}

      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
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
