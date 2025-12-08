import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProducts } from "../../services/api";
import PostItemModal from "./PostItemModal"; // Reuse modal for viewing items
import "./Profile.css"; // Reuse Profile CSS

const DEFAULT_COVER = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop";
const DEFAULT_AVATAR = "/images/no_profile.jpg";
const BACKEND_URL = "http://127.0.0.1:5000";

export default function UserProfile() {
  const { userId } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("user_id");

  // Redirect to my profile if viewing myself
  useEffect(() => {
    if (userId === currentUserId) {
        navigate("/profile");
    }
  }, [userId, currentUserId, navigate]);

  const [profileData, setProfileData] = useState({
    name: "Loading...",
    bio: "",
    course: "",
    year: "",
    avatar: DEFAULT_AVATAR,
    cover: DEFAULT_COVER,
    followers: 0,
    following: 0,
    isVerified: true, 
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    loadProfile();
    loadUserPosts();
  }, [userId]);

  const loadProfile = async () => {
      try {
          const response = await fetch(`${BACKEND_URL}/api/users/profile/${userId}`);
          if(response.ok) {
              const data = await response.json();
              setProfileData(prev => ({
                  ...prev,
                  name: data.username,
                  bio: data.bio || "No bio yet.",
                  course: data.course || "Student",
                  year: data.year_level || "",
                  avatar: data.profile_image ? `${BACKEND_URL}${data.profile_image}` : DEFAULT_AVATAR,
              }));
          }
      } catch (err) {
          console.error("Failed to load profile", err);
      }
  };

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const allProducts = await fetchProducts({});
      const userProducts = allProducts.filter(p => Number(p.seller_id) === Number(userId));

      const transformed = userProducts.map(p => ({
        id: p.id,
        title: p.name,
        price: p.price || 0,
        image: p.image_url ? `${BACKEND_URL}${p.image_url}` : "/images/placeholder.jpg",
        type: p.listing_type || 'sell',
        status: p.status || 'available',
        date: new Date(p.created_at).toLocaleDateString()
      }));

      setPosts(transformed);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
      setIsFollowing(!isFollowing);
      // TODO: Add backend API for follow
  };

  const filteredPosts = posts.filter(post => {
    if (activeFilter === "All") return true;
    return post.type.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="profile-page fade-in">
      <div className="profile-header-card">
        <div className="profile-cover" style={{ backgroundImage: `url(${profileData.cover})` }}>
           <div className="cover-overlay"></div>
        </div>

        <div className="profile-info-section">
          <div className="profile-avatar-wrapper">
             <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
          </div>

          <div className="profile-text">
             <div className="name-badge-row">
                <h1>{profileData.name}</h1>
                {profileData.isVerified && <i className="fa-solid fa-circle-check verified-icon"></i>}
             </div>
             <p className="profile-role">{profileData.course} {profileData.year ? `• ${profileData.year}` : ''}</p>
             <p className="profile-bio">{profileData.bio}</p>
             
             <div className="profile-stats">
                <div className="stat-box">
                    <span className="stat-num">{posts.length}</span>
                    <span className="stat-label">Posts</span>
                </div>
                <div className="stat-box">
                    <span className="stat-num">{profileData.followers}</span>
                    <span className="stat-label">Followers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-num">{profileData.following}</span>
                    <span className="stat-label">Following</span>
                </div>
             </div>

             <div className="profile-actions-row">
                <button 
                    className={`btn-follow ${isFollowing ? 'following' : ''}`} 
                    onClick={handleFollow}
                >
                    {isFollowing ? "Following" : "Follow"}
                </button>
                <button className="btn-edit" onClick={() => navigate("/chat")}>
                    <i className="fa-solid fa-message"></i> Message
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs-wrapper">
             <div className="tabs-list">
                {['All', 'Sell', 'Rent', 'Swap'].map(tab => (
                    <button 
                    key={tab} 
                    className={`profile-tab ${activeFilter === tab ? 'active' : ''}`}
                    onClick={() => setActiveFilter(tab)}
                    >
                    {tab}
                    </button>
                ))}
             </div>
        </div>

        <div className="profile-grid">
            {loading ? (
                 <div className="loading-state">Loading...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-folder-open"></i>
                    <p>No items posted yet.</p>
                </div>
            ) : (
                filteredPosts.map(post => (
                    <div key={post.id} className="pro-card">
                        <div className="pro-card-img">
                            <img src={post.image} alt={post.title} onError={(e) => e.target.src="/images/placeholder.jpg"} />
                            <span className={`pro-badge ${post.type}`}>{post.type}</span>
                        </div>
                        <div className="pro-card-info">
                            <h4>{post.title}</h4>
                            <div className="pro-card-meta">
                                <span className="price">{post.type === 'sell' ? `₱${post.price}` : post.type.toUpperCase()}</span>
                                <span className="date">{post.date}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}