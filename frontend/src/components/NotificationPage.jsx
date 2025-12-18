import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markNotificationsRead } from "../services/api"; 
import { FaBell, FaCheckCircle, FaRedo, FaList } from 'react-icons/fa';
import './NotificationPage.css';

const BACKEND_URL = "http://127.0.0.1:5000";

function highlightNotification(message) {
    const typeKeywords = [
        "swap offer", "rental request", "new post", "listing", "transaction", "payment", "review"
    ];
    const statusKeywords = [
        "accepted", "declined", "confirmed", "failed", "pending", "rejected", "due", "success", "error", "complete", "returned"
    ];

    let highlightedMessage = message;
    
    typeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi'); 
        highlightedMessage = highlightedMessage.replace(regex, (match) => 
            `<span class="highlight-maroon">${match}</span>`
        );
    });

    statusKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        highlightedMessage = highlightedMessage.replace(regex, (match) => 
            `<span class="highlight-status">${match}</span>`
        );
    });

    return { __html: highlightedMessage };
}

function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return then.toLocaleDateString();
}

function NotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false); 
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 600);
    
    const notifRef = useRef(null); 
    const dropdownRef = useRef(null); 
    
    const navigate = useNavigate();
    const userId = localStorage.getItem("user_id");

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await fetchNotifications(userId); 
            
            const processedData = (data || []).map(n => {
                let profileUrl = n.sender_profile_url;
                
                // FIX: If profileUrl is null/undefined, set default path first.
                if (!profileUrl) {
                    profileUrl = '/images/default-profile.jpg';
                }
                
                // Then prepend BACKEND_URL only if it's a relative path and not the default
                if (profileUrl !== '/images/default-profile.jpg' && !profileUrl.startsWith("http")) {
                    profileUrl = `${BACKEND_URL}${profileUrl}`;
                }
                
                return { ...n, sender_profile_url: profileUrl };
            });

            setNotifications(processedData);
            
            if (filter === "unread" && processedData.filter(n => !n.is_read).length === 0) {
                 setFilter("all");
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        loadNotifications();

    }, [userId]); 
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && notifRef.current.contains(e.target)) {
                return; 
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const checkMobile = () => {
            setIsMobileView(window.innerWidth < 600);
        };

        const handleResize = () => {
            setOpen(false); 
            checkMobile();
        };

        checkMobile();

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", handleResize);
        };
    }, []);


    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAllAsRead = async () => {
        if (unreadCount === 0 || isLoading) return; 
        
        setIsLoading(true);
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            await markNotificationsRead(null, true, userId);
            
        } catch (error) {
             console.error("Failed to mark all as read:", error);
        } finally {
            setIsLoading(false);
            setFilter("all");
        }
    };

    const markSingleRead = async (id) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        try {
            await markNotificationsRead([id], false, userId);
        } catch (error) {
            console.error("Failed to mark single as read:", error);
        }
    };

    const handleNotifClick = (n) => {
        if (!n.is_read) markSingleRead(n.id);
        setOpen(false);

        if (n.deep_link) {
            navigate(n.deep_link);
        } else if (n.type.includes("rental") || n.type.includes("swap")) {
            navigate(n.type.includes("rental") ? "/rentalrequests" : "/swaprequests");
        } else if (n.type.includes("transaction") || n.type.includes("order")) {
            navigate("/transactions");
        } else if (n.type === "new_rating") {
            navigate(`/user-ratings/${userId}`);
        } else if (n.type === "item_deleted" || n.type === "item_updated" || n.type === "new_post") {
            navigate("/my-posts");
        } else {
            navigate("/profile");
        }
    };
    
    const handleViewAllClick = () => {
        setOpen(false); 
        navigate("/notifications"); 
    };
    
    const handleFilterChange = (newFilter) => {
        if (isLoading) return; 
        setFilter(newFilter);
    };

    const filtered = filter === "unread"
        ? notifications.filter(n => !n.is_read)
        : notifications;
    
    const portalPositionStyles = notifRef.current ? (
        () => {
            const iconRect = notifRef.current.getBoundingClientRect();
            return {
                top: iconRect.bottom + 10 + "px",
                right: isMobileView ? "5%" : window.innerWidth - iconRect.right + "px",
                left: isMobileView ? "5%" : "auto", 
                width: isMobileView ? "90%" : "380px",
                zIndex: 9999,
            };
        }
    )() : {};


    return (
        <div className="notification-container" ref={notifRef}>
            
            <button className="notif-icon" onClick={() => setOpen(!open)} aria-expanded={open}>
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && <span className="notif-red-dot"></span>}
            </button>

            {open && notifRef.current && 
                ReactDOM.createPortal(
                    <div className="notif-portal-wrapper" 
                        style={{ 
                            position: 'fixed', 
                            ...portalPositionStyles
                        }}
                        ref={dropdownRef} 
                    >
                        
                        <div id="notif-dropdown" className="notif-dropdown"> 
                        
                            <div className="notif-header-box">
                                <div className="notif-header">
                                    <h4><FaBell className="header-icon" /> Notifications</h4>
                                </div>

                                <div className="notif-tabs">
                                    <button 
                                        className="mark-read-btn action-btn" 
                                        onClick={markAllAsRead}
                                        disabled={unreadCount === 0 || isLoading}
                                        aria-label="Mark all"
                                    >
                                        <FaCheckCircle /> Mark all
                                    </button>
                                    
                                    <button
                                        className={`action-btn tab-btn ${filter === "all" ? "active" : ""}`}
                                        onClick={() => handleFilterChange("all")}
                                        disabled={isLoading}
                                    >
                                        All
                                    </button>
                                    
                                    <button
                                        className={`action-btn tab-btn ${filter === "unread" ? "active" : ""}`}
                                        onClick={() => handleFilterChange("unread")}
                                        disabled={isLoading} 
                                    >
                                        Unread ({unreadCount})
                                    </button>
                                    
                                    <button
                                        className="refresh-btn action-btn"
                                        onClick={loadNotifications}
                                        disabled={isLoading}
                                        title="Refresh"
                                        aria-label="Refresh"
                                    >
                                        <FaRedo className={isLoading ? 'fa-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            
                            <ul className="notif-list">
                                {isLoading ? (
                                    <li className="loading-msg">Loading...</li>
                                ) : filtered.length === 0 ? (
                                    <li className="empty-msg">No notifications.</li>
                                ) : (
                                    filtered.map((n) => (
                                        <li 
                                            key={n.id} 
                                            onClick={() => handleNotifClick(n)}
                                            className={!n.is_read ? "unread" : "read"}
                                        >
                                            <div className="notif-item">
                                                <div className="notif-icon-wrapper">
                                                    <img 
                                                        src={n.sender_profile_url} 
                                                        alt="User" 
                                                        className="notif-profile" 
                                                        onError={(e) => { e.target.onError = null; e.target.src="/images/default-profile.jpg"; }}
                                                    />
                                                </div>
                                                
                                                <div className="notif-content">
                                                    <p 
                                                        className="notif-text"
                                                        dangerouslySetInnerHTML={highlightNotification(n.message)}
                                                    />
                                                    <span className="notif-timestamp">
                                                        <i className="fa-regular fa-clock"></i> {formatTime(n.created_at)}
                                                    </span>
                                                </div>
                                                
                                                {!n.is_read && <div className="unread-dot-indicator"></div>}
                                            </div>
                                        </li>
                                    ))
                                )}
                                
                                <div className="notif-list-divider"></div>
                                
                                <li className="notif-view-all-item" onClick={handleViewAllClick}>
                                    <FaList className="view-all-icon" /> View All
                                </li>
                            </ul>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default NotificationPage;