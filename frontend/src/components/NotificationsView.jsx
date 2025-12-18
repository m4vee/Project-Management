import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markNotificationsRead } from "../services/api"; 
import { FaBell, FaCheckCircle, FaRedo } from 'react-icons/fa';
import './NotificationPage.css'; 

function highlightNotification(message) {
    const typeKeywords = [
        "swap offer", "rental request", "new post", "listing", "transaction", "payment", "review", "rating", "follower", "comment", "rated"
    ];
    const statusKeywords = [
        "accepted", "declined", "confirmed", "failed", "pending", "rejected", "due", "success", "error", "complete"
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

export default function NotificationsView() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const userId = localStorage.getItem("user_id");

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await fetchNotifications(userId); 
            setNotifications(data || []);
            
            if (filter === "unread" && data && data.filter(n => !n.is_read).length === 0) {
                 setFilter("all");
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

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

        if (n.deep_link) {
            navigate(n.deep_link);
        } else if (n.type.includes("rental") || n.type.includes("swap")) {
             if (n.message.includes("complete") || n.message.includes("returned")) {
                navigate(n.type.includes("rental") ? "/rentalrequests" : "/swaprequests");
            } else {
                 navigate(n.type.includes("rental") ? "/rentalrequests" : "/swaprequests");
            }
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
    
    const handleFilterChange = (newFilter) => {
        if (isLoading) return; 
        setFilter(newFilter);
    };

    const filtered = filter === "unread"
        ? notifications.filter(n => !n.is_read)
        : notifications;
        
    return (
        <div className="notifications-full-page">
            <div className="notifications-content-wrapper">
                
                <div className="notif-header-box">
                    <div className="notif-header">
                        <h4><FaBell className="header-icon" /> All Notifications</h4>
                    </div>

                    <div className="notif-tabs">
                        <button 
                            className="mark-read-btn action-btn" 
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0 || isLoading}
                            aria-label="Mark all notifications as read"
                        >
                            <FaCheckCircle /> Mark all
                        </button>
                        
                        <button
                            className={`action-btn tab-btn ${filter === "all" ? "active" : ""}`}
                            onClick={() => handleFilterChange("all")}
                            disabled={isLoading}
                            aria-pressed={filter === "all"}
                        >
                            All
                        </button>
                        
                        <button
                            className={`action-btn tab-btn ${filter === "unread" ? "active" : ""}`}
                            onClick={() => handleFilterChange("unread")}
                            disabled={isLoading} 
                            aria-pressed={filter === "unread"}
                        >
                            Unread ({unreadCount})
                        </button>
                        
                        <button
                            className="refresh-btn action-btn"
                            onClick={loadNotifications}
                            disabled={isLoading}
                            title="Refresh Notifications"
                            aria-label="Refresh Notifications"
                        >
                            <FaRedo className={isLoading ? 'fa-spin' : ''} />
                        </button>
                    </div>
                </div>
                
                <ul className="notif-list" role="list">
                    {isLoading ? (
                        <li className="loading-msg">Loading notifications...</li>
                    ) : filtered.length === 0 ? (
                        <li className="empty-msg">No notifications found.</li>
                    ) : (
                        filtered.map((n) => (
                            <li 
                                key={n.id} 
                                onClick={() => handleNotifClick(n)}
                                className={!n.is_read ? "unread" : "read"}
                                role="listitem"
                                tabIndex="0" 
                            >
                                <div className="notif-item">
                                    <div className="notif-icon-wrapper">
                                        <img 
                                            src={n.sender_profile_url ? n.sender_profile_url : '/images/no_profile.jpg'} 
                                            alt="Sender Profile" 
                                            className="notif-profile" 
                                            onError={(e) => { e.target.onError = null; e.target.src="/images/no_profile.jpg"; }}
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
                                    
                                    {!n.is_read && <div className="unread-dot-indicator" aria-hidden="true"></div>}
                                </div>
                            </li>
                        ))
                    )}
                </ul>

            </div>
        </div>
    );
}