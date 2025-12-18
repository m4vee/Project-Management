import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// FIX 1: Import updateProduct here
import { fetchProducts, deleteProduct, updateProduct, uploadProfileImage } from "../../services/api";
import PostItemModal from "./PostItemModal";
import PostActionModal from "./PostActionModal";
import "./Profile.css";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop";
const DEFAULT_AVATAR = "/images/default-profile.jpg";
const BACKEND_URL = "http://127.0.0.1:5000";

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const storedName = localStorage.getItem("username");

  const [profileData, setProfileData] = useState({
    name: storedName || "User",
    bio: "No bio yet.",
    course: "TUP Student",
    year: "",
    avatar: DEFAULT_AVATAR,
    cover: DEFAULT_COVER,
    followers: 0,
    following: 0,
    isVerified: true, 
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    loadProfile();
    loadUserPosts();
  }, [userId]);

  const loadProfile = async () => {
      try {
          const response = await fetch(`${BACKEND_URL}/api/users/profile/${userId}`);
          if(response.ok) {
              const data = await response.json();
              
              let avatarUrl = DEFAULT_AVATAR;
              if (data.profile_image) {
                  avatarUrl = data.profile_image.startsWith("http") 
                      ? data.profile_image 
                      : `${BACKEND_URL}${data.profile_image}`;
              }

              setProfileData(prev => ({
                  ...prev,
                  name: data.username || storedName,
                  bio: data.bio || "No bio yet.",
                  course: data.course || "TUP Student",
                  year: data.year_level || "",
                  avatar: avatarUrl,
              }));

              localStorage.setItem("profile_image", data.profile_image);
              window.dispatchEvent(new Event("profile-updated"));
          }
      } catch (err) {
          console.error(err);
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
        image: p.image_url ? (p.image_url.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`) : "/images/placeholder.jpg",
        type: p.listing_type || 'sell',
        status: p.status || 'available',
        date: new Date(p.created_at).toLocaleDateString(),
        // Make sure description/category are passed if needed for editing
        description: p.description,
        category: p.category,
        condition: p.condition
      }));

      setPosts(transformed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeFilter === "All") return true;
    return post.type.toLowerCase() === activeFilter.toLowerCase();
  });

  // --- FIX 2: CREATE THE HANDLE EDIT FUNCTION ---
  const handleEditPost = async (updatedData) => {
    try {
        // updatedData should contain { id, name, price, description, etc. }
        await updateProduct(updatedData.id, {
            name: updatedData.title, // Backend expects 'name', make sure keys match
            price: updatedData.price,
            description: updatedData.description,
            category: updatedData.category,
            condition: updatedData.condition,
            listing_type: updatedData.type
        });

        alert("Post updated successfully!");
        
        // Refresh posts to show changes
        loadUserPosts();
        setActionModalOpen(false);
    } catch (error) {
        console.error("Update failed:", error);
        alert("Failed to update post.");
    }
  };

  const handleDeletePost = async (id) => {
    if(!window.confirm("Delete this item permanently?")) return;
    try {
      await deleteProduct(id); 
      setPosts(prev => prev.filter(p => p.id !== id));
      setActionModalOpen(false);
    } catch (err) {
      alert("Failed to delete item.");
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'avatar') {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("user_id", userId);

        try {
            const data = await uploadProfileImage(formData); 
            const fullUrl = `${BACKEND_URL}${data.image_url}`;
            setProfileData(prev => ({ ...prev, avatar: fullUrl }));
            localStorage.setItem("profile_image", data.image_url);
            window.dispatchEvent(new Event("profile-updated"));
            alert("Profile picture updated!");
        } catch (err) {
            console.error(err);
            alert("Error uploading image.");
        }
    } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setProfileData(prev => ({ ...prev, [type]: ev.target.result }));
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-header-card">
        <div 
          className="profile-cover" 
          style={{ backgroundImage: `url(${profileData.cover})` }}
        >
          <div className="cover-overlay"></div>
          <button className="edit-cover-btn" onClick={() => coverInputRef.current.click()}>
            <i className="fa-solid fa-camera"></i> <span>Edit Cover</span>
          </button>
          <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        <div className="profile-info-section">
          <div className="profile-avatar-wrapper" onClick={() => avatarInputRef.current.click()}>
             <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
             <div className="edit-avatar-badge"><i className="fa-solid fa-camera"></i></div>
             <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="profile-text">
             <div className="name-badge-row">
                <h1>{profileData.name}</h1>
                {profileData.isVerified && <i className="fa-solid fa-circle-check verified-icon" title="Verified"></i>}
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

             <div className="profile-action-buttons">
                <button className="action-btn-outline" onClick={() => navigate('/swaprequests')}>
                  <i className="fa-solid fa-right-left"></i> Swap Requests
                </button>
                <button className="action-btn-outline" onClick={() => navigate('/rentalrequests')}>
                  <i className="fa-solid fa-clock-rotate-left"></i> Rental Requests
                </button>
                <button className="action-btn-outline" onClick={() => navigate('/transactions')}>
                  <i className="fa-solid fa-receipt"></i> Transactions
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
                 <div className="loading-state"><i className="fa-solid fa-spinner fa-spin"></i> Loading...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-folder-open"></i>
                    <p>No posts yet.</p>
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
                        <button className="pro-card-opt" onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedPost(post); 
                            setActionModalOpen(true); 
                        }}>
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>


      <PostItemModal 
        isOpen={showCreateModal} 
        onClose={() => { setShowCreateModal(false); loadUserPosts(); }} 
        activeFilter={activeFilter === 'All' ? 'sell' : activeFilter.toLowerCase()}
      />

      {actionModalOpen && selectedPost && (
        <PostActionModal 
          post={selectedPost} 
          onClose={() => setActionModalOpen(false)}
          onDelete={handleDeletePost}
          onEdit={handleEditPost} 
        />
      )}
    </div>
  );
}