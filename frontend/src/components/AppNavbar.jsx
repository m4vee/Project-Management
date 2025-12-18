import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useCart } from "../context/CartContext.jsx";
import Notification from "./NotificationPage.jsx"; 
import PostItemModal from "./pages/PostItemModal"; 
import { fetchUserThreads } from "../services/api"; 
import "./AppNavbar.css";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function AppNavbar() {
    const navigate = useNavigate();
    const location = useLocation(); 
    const { cartItems } = useCart();
    const currentUserId = localStorage.getItem("user_id");

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [profileImage, setProfileImage] = useState("/images/default-profile.jpg");
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false); 
    const [unreadMessages, setUnreadMessages] = useState(0); 
    
    const isOnChatPage = location.pathname === '/chat';
    
    const cartCount = cartItems.length;
    const totalNotifications = cartCount + unreadMessages;

    const menuRef = useRef(null);

    const fetchUnreadCount = async () => {
        if (!currentUserId) return;
        try {
            const threads = await fetchUserThreads(currentUserId);
            
            let count = 0;
            threads.forEach(thread => {
                if (!thread.is_read && thread.last_sender_id !== parseInt(currentUserId)) {
                    count += 1;
                }
            });
            setUnreadMessages(count);
        } catch (err) {
            console.error("Error fetching unread count:", err);
            setUnreadMessages(0);
        }
    };
    
    useEffect(() => {
        const updateImage = () => {
            const storedImage = localStorage.getItem("profile_image");
            if (storedImage && storedImage !== "undefined" && storedImage !== "null") {
                if (storedImage.startsWith("http")) {
                     setProfileImage(storedImage);
                } else {
                     setProfileImage(`${BACKEND_URL}${storedImage}`);
                }
            } else {
                setProfileImage("/images/default-profile.jpg");
            }
        };
        updateImage(); 
        window.addEventListener("profile-updated", updateImage);
        
        fetchUnreadCount(); 
        const interval = setInterval(fetchUnreadCount, 10000); 
        
        return () => {
             window.removeEventListener("profile-updated", updateImage);
             clearInterval(interval);
        };
    }, [currentUserId, location.pathname]); 

    const handleLogout = (e) => {
        if (e) e.stopPropagation(); 
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
        localStorage.removeItem("profile_image");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("wishlist");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("local-storage-update"));
        navigate("/login");
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    
    const handleProfileClick = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(false); 
        navigate("/profile"); 
    };
    
    // --- FIX IS HERE ---
    const handleSettingsClick = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(false); 
        navigate("/account-settings"); 
    };

    const handleFabClick = (action) => {
        setIsFabOpen(false); 
        if (action === 'chat') navigate('/chat');
        if (action === 'cart') navigate('/cart');
        if (action === 'post') setShowCreateModal(true);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <>
            <nav className="app-navbar">
                <div className="app-navbar-left">
                    <div className="app-logo" onClick={() => navigate("/inside-app")}>
                        <h2>TUPulse <i className="fab fa-typo3"></i></h2>
                    </div>
                </div>

                <div className="app-navbar-right">
                    
                    <Notification /> 
                    
                    <div className="profile-menu-container" style={{ position: "relative" }} ref={menuRef}>
                        <div className="profile-icon" onClick={toggleDropdown}>
                            <img 
                                src={profileImage} 
                                alt="User" 
                                onError={(e) => e.target.src = "/images/default-profile.jpg"}
                                style={{objectFit: 'cover'}}
                            />
                        </div>

                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item" onClick={handleProfileClick}>
                                    <i className="fa-solid fa-user"></i> My Profile
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item" onClick={handleSettingsClick}>
                                    <i className="fa-solid fa-gear"></i> Settings
                                </div>
                                <div className="dropdown-item logout" onClick={handleLogout}>
                                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {!isOnChatPage && (
                <div className={`fab-container ${isFabOpen ? 'open' : ''}`}>
                    
                    {isFabOpen && <div className="fab-overlay" onClick={() => setIsFabOpen(false)}></div>}

                    <div className="fab-menu">
                        
                        <div className="fab-item" onClick={() => handleFabClick('chat')}>
                            <div className="fab-chat-floating-icon" aria-hidden="true">
                                <i className="fa-solid fa-comments"></i>
                                {unreadMessages > 0 && <span className="mini-badge">{unreadMessages}</span>}
                            </div>
                            <span className="fab-label">Messages</span>
                            <div className="fab-btn-wrapper">
                                <button className="fab-btn-mini fab-chat" aria-hidden="true" title="Messages"></button>
                            </div>
                        </div>

                        <div className="fab-item" onClick={() => handleFabClick('cart')}>
                            <div className="fab-cart-floating-icon" aria-hidden="true">
                                <i className="fa-solid fa-shopping-cart"></i>
                                {cartCount > 0 && <span className="mini-badge">{cartCount}</span>}
                            </div>
                            <span className="fab-label">Cart</span>
                            <div className="fab-btn-wrapper">
                                <button className="fab-btn-mini fab-cart-mini" aria-hidden="true" title="Cart"></button>
                            </div>
                        </div>

                        <div className="fab-item" onClick={() => handleFabClick('post')}>
                            <div className="fab-post-floating-icon" aria-hidden="true">
                                <i className="fa-solid fa-pen-to-square"></i>
                            </div>
                            <span className="fab-label">Create Post</span>
                            <div className="fab-btn-wrapper">
                                <button className="fab-btn-mini fab-post" aria-hidden="true" title="Create Post"></button>
                            </div>
                        </div>
                    </div>

                    <div className="fab-trigger-wrapper">
                        <button 
                            className={`fab-main-trigger ${isFabOpen ? 'active' : ''}`} 
                            onClick={() => setIsFabOpen(!isFabOpen)}
                        >
                            <i className={`fa-solid ${isFabOpen ? 'fa-xmark' : 'fa-plus'}`}></i>
                        </button>
                        
                        {!isFabOpen && totalNotifications > 0 && (
                            <span className="main-fab-badge">{totalNotifications}</span>
                        )}
                    </div>
                </div>
            )}

            <PostItemModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                activeFilter="sell" 
            />
        </>
    );
}