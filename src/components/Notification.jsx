import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Notification.css";

function Notification() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Aiah added a book to cart",
      type: "cart",
      read: false,
      profile: "/images/aiah.webp",
    },
    {
      id: 2,
      text: "Colet rented your item",
      type: "rent",
      read: true,
      profile: "/images/colet.webp",
    },
    {
      id: 3,
      text: "Jhoanna bought your posted item",
      type: "buy",
      read: false,
      profile: "/images/jhoanna.webp",
    },
    {
      id: 4,
      text: "Sheena swapped with you",
      type: "swap",
      read: true,
      profile: "/images/sheena.webp",
    },
    {
      id: 5,
      text: "Aiah rated you 5 stars",
      type: "rate",
      read: false,
      profile: "/images/aiah.webp",
    },
    {
      id: 6,
      text: "Aiah added a book to cart",
      type: "cart",
      read: false,
      profile: "/images/aiah.webp",
    },
    {
      id: 7,
      text: "Colet rented your item",
      type: "rent",
      read: true,
      profile: "/images/colet.webp",
    },
    {
      id: 8,
      text: "Jhoanna bought your posted item",
      type: "buy",
      read: false,
      profile: "/images/jhoanna.webp",
    },
    {
      id: 9,
      text: "Sheena swapped with you",
      type: "swap",
      read: true,
      profile: "/images/sheena.webp",
    },
    {
      id: 10,
      text: "Aiah rated you 5 stars",
      type: "rate",
      read: false,
      profile: "/images/aiah.webp",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [showMenu, setShowMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpen(false);
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setShowMenu(false);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-container" ref={notifRef}>
      {/* Bell Icon */}
      <button className="notif-icon" onClick={() => setOpen(!open)}>
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>Notifications</h4>

            <div className="notif-menu-wrapper">
              <button
                className="notif-dot-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ...
              </button>

              {showMenu && (
                <div className="notif-menu">
                  <button onClick={markAllAsRead}>Mark all as read</button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="notif-tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              Unread
            </button>
          </div>

          {/* Notifications List */}
          <ul>
            {filteredNotifications.length === 0 ? (
              <li className="empty-msg">No notifications</li>
            ) : (
              filteredNotifications.map((n) => (
                <li
                  key={n.id}
                  onClick={!n.read ? () => markAsRead(n.id) : undefined}
                  className={n.read ? "read" : "unread"}
                >
                  <div className="notif-item">
                    <img
                      src={n.profile}
                      alt="profile"
                      className="notif-profile"
                    />
                    <span className="notif-text">{n.text}</span>
                    {!n.read && <span className="notif-dot"></span>}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Notification;
