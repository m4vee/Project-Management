import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    fetchProducts, 
    fetchUserProfile,
    followUser,
    unfollowUser,
    fetchUserAverageRating
} from "../../services/api";
import PostItemModal from "./PostItemModal"; 
import { FaStar } from 'react-icons/fa';
import "./Profile.css"; 

const DEFAULT_COVER = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop";
const DEFAULT_AVATAR = "/images/default-profile.jpg";
const BACKEND_URL = "http://127.0.0.1:5000";

export default function UserProfile() {
    const { userId } = useParams(); 
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem("user_id");

    // NEW STATE FOR HOVER EFFECT
    const [isFollowHover, setIsFollowHover] = useState(false);
    const [isMessageHover, setIsMessageHover] = useState(false);
    // END NEW STATE

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

    const [ratings, setRatings] = useState({
        average: 0.0,
        count: 0
    });

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeFilter, setActiveFilter] = useState("All");

    const loadProfile = useCallback(async () => {
        try {
            const data = await fetchUserProfile(userId, currentUserId); 
            
            // Fetch Average Rating
            const ratingData = await fetchUserAverageRating(userId);
            setRatings({
                average: ratingData.average_rating || 0.0,
                count: ratingData.total_reviews || 0
            });

            const avatarUrl = data.profile_image 
                ? (data.profile_image.startsWith("http") ? data.profile_image : `${BACKEND_URL}${data.profile_image}`)
                : DEFAULT_AVATAR;

            setProfileData(prev => ({
                ...prev,
                name: data.username,
                bio: data.bio || "No bio yet.",
                course: data.course || "Student",
                year: data.year_level || "",
                avatar: avatarUrl,
                followers: data.followers || 0,
                following: data.following || 0,
                isFollowing: data.is_following || false,
            }));
            
            setIsFollowing(data.is_following || false);

        } catch (err) {
            console.error("Failed to load profile", err);
            setProfileData(prev => ({...prev, name: "User Not Found"}));
        }
    }, [userId, currentUserId]);

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

    useEffect(() => {
        loadProfile();
        loadUserPosts();
    }, [loadProfile]);

    const handleFollow = async () => {
        if (!currentUserId) {
            alert("Please login to follow users.");
            return;
        }

        const newStatus = !isFollowing;
        setIsFollowing(newStatus); 
        
        try {
            if (newStatus) {
                await followUser(currentUserId, userId); 
                setProfileData(prev => ({...prev, followers: prev.followers + 1}));
            } else {
                await unfollowUser(currentUserId, userId); 
                setProfileData(prev => ({...prev, followers: prev.followers - 1}));
            }
        } catch (error) {
            setIsFollowing(!newStatus);
            setProfileData(prev => ({
                ...prev, 
                followers: prev.followers + (newStatus ? -1 : 1)
            }));
            console.error("Follow/Unfollow failed:", error);
            alert(`Failed to update follow status: ${error.message}`);
        }
    };
    
    const handleMessage = () => {
        navigate(`/chat?user=${userId}`);
    };
    
    const handleViewRatings = () => {
        navigate(`/user-ratings/${userId}`); 
    };

    const filteredPosts = posts.filter(post => {
        if (activeFilter === "All") return true;
        return post.type.toLowerCase() === activeFilter.toLowerCase();
    });

    // Helper to render stars
    const renderStars = (avg) => {
        const fullStars = Math.floor(avg);
        return (
            <span className="star-row">
                {[...Array(5)].map((_, i) => (
                    <FaStar 
                        key={i} 
                        size={18} // Bigger size
                        color={i < fullStars ? '#d63031' : '#e4e5e9'} // Use Red Color (#d63031)
                    />
                ))}
            </span>
        );
    };
    
    // --- STYLE OBJECTS FOR BUTTONS (Transparent BG, Red Hover, Pill Shape) ---
    const BASE_BTN_STYLE = {
        // Shared Button Styles
        padding: '10px 15px', 
        borderRadius: '50px',
        fontWeight: '600',
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flex: 1, // Crucial for alignment
        minWidth: '120px',

        // Custom Transparent Look (Matching the My Posts button style)
        background: 'transparent',
        color: '#222', // Text Dark
        border: '1px solid #ddd', // Light border
        boxShadow: 'none',
    };

    const FOLLOW_HOVER_STYLE = {
        ...BASE_BTN_STYLE,
        background: '#FFF',
        color: '#8B0000', // Primary Red
        border: '1px solid #8B0000',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    };
    
    // Custom style for Following state (filled red)
    const FOLLOWING_STYLE = {
        ...BASE_BTN_STYLE,
        background: '#8B0000',
        color: '#FFF',
        border: '1px solid #8B0000',
        boxShadow: '0 4px 8px rgba(139, 0, 0, 0.2)',
    };


    return (
        <div className="profile-page fade-in user-view">
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
                            {/* RATING STATS */}
                            <div 
                                className="stat-box" 
                                onClick={ratings.count > 0 ? handleViewRatings : null} 
                                style={{
                                    cursor: ratings.count > 0 ? 'pointer' : 'default',
                                    border: ratings.count > 0 ? '1px solid #ffc107' : '1px solid #eee',
                                    backgroundColor: ratings.count > 0 ? '#fffae6' : 'white',
                                    padding: '10px 15px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span className="stat-num" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '5px', 
                                    color: '#8B0000', 
                                    fontWeight: '700'
                                }}>
                                    {ratings.average.toFixed(1)}
                                    {renderStars(ratings.average)}
                                </span>
                                <span 
                                    className="stat-label" 
                                    style={{
                                        color: '#8B0000',
                                        textDecoration: ratings.count > 0 ? 'underline' : 'none'
                                    }}
                                >
                                    {ratings.count} Reviews
                                </span>
                            </div>
                            {/* END RATING STATS */}
                            
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

                        {/* FINAL FIX: FOLLOW / MESSAGE BUTTONS - INLINE STYLES ONLY */}
                        <div className="profile-actions-row" style={{
                            display: 'flex',
                            gap: '12px',
                            marginTop: '20px',
                            width: 'fit-content', // Aligns container to the left
                            maxWidth: '100%',
                            flexWrap: 'wrap',
                        }}>
                            <button 
                                onClick={handleFollow}
                                onMouseEnter={() => setIsFollowHover(true)}
                                onMouseLeave={() => setIsFollowHover(false)}
                                style={
                                    isFollowing 
                                    ? FOLLOWING_STYLE 
                                    : (isFollowHover ? FOLLOW_HOVER_STYLE : BASE_BTN_STYLE)
                                }
                                // No className="btn-follow"
                            >
                                {isFollowing ? "Following" : "Follow"}
                            </button>
                            
                            <button 
                                onClick={handleMessage}
                                onMouseEnter={() => setIsMessageHover(true)}
                                onMouseLeave={() => setIsMessageHover(false)}
                                style={isMessageHover ? FOLLOW_HOVER_STYLE : BASE_BTN_STYLE}
                                // No className="btn-message"
                            >
                                <i className="fa-solid fa-message"></i> Message
                            </button>
                        </div>
                        {/* END FIX */}
                        
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* REMAINDER OF THE PROFILE CONTENT (TABS, GRID) */}
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