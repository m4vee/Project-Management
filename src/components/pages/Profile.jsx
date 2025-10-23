  import React, { useState, useEffect, useRef } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import "./Profile.css"; // Ensure this file contains the updated CSS code

  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop&crop=entropy";
  const DEFAULT_AVATAR =
    "/images/mikha.webp";

  const samplePosts = [
    {
      id: 1,
      title: "Black Notebook",
      desc: "College notebook, good condition",
      price: 120,
      category: "Buy/Sell",
      img:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "School Uniform Set",
      desc: "Complete uniform, swap preferred",
      price: 0,
      category: "Swap",
      img:
        "https://images.unsplash.com/photo-1600180758890-7d9d2b8f8b0b?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Assorted Pens",
      desc: "Pens for rent (project use)",
      price: 20,
      category: "Rent",
      img:
        "https://images.unsplash.com/photo-1524594154907-7f2935cc8a5d?q=80&w=800&auto=format&fit=crop",
    },
  ];

  export default function Profile() {
    const navigate = useNavigate();

    // User state
    const [nickname, setNickname] = useState("Krislyn Sayat");
    const [editingName, setEditingName] = useState(false);
    const [university] = useState("Technological University of the Philippines - Manila");
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
    const [cover, setCover] = useState(DEFAULT_COVER);

    // Posts state
    const [posts, setPosts] = useState(samplePosts);
    const [activeFilter, setActiveFilter] = useState("All Posts");
    const [showModal, setShowModal] = useState(false); // Modal state for creating posts

    // Ratings (sample)
    const [ratings] = useState([5, 5, 4, 5, 4]); // sample ratings
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    // Dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Theme (dark mode)
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }, [theme]);

    // Refs for file inputs
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // --- ADJUSTMENT: Separated search states ---
    const [query, setQuery] = useState(""); // For filtering posts
    const [globalQuery, setGlobalQuery] = useState(""); // For header search
    // --- END ADJUSTMENT ---

    // Filtered posts (uses 'query' state)
    const filteredPosts = posts.filter((p) => {
      const matchCategory = activeFilter === "All Posts" || p.category === activeFilter;
      const matchQuery =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.desc.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });

    // File upload handlers
    function handleAvatarChange(e) {
      const f = e.target.files?.[0];
      if (f) {
        setAvatar(URL.createObjectURL(f));
      }
    }

    function handleCoverChange(e) {
      const f = e.target.files?.[0];
      if (f) {
        setCover(URL.createObjectURL(f));
      }
    }

    // Create post handler (modal will pass data)
    function addPost(newPost) {
      const id = Date.now();
      setPosts((prev) => [{ id, ...newPost }, ...prev]);
      setShowModal(false); // Hide modal after post is added
      setActiveFilter("All Posts");
    }

    // Inline name editing save
    function saveName() {
      setEditingName(false);
    }

    // Logout (placeholder - navigate to login)
    function handleLogout() {
      navigate("/login");
    }

    // Mobile Menu Toggle
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleMobileMenuToggle = () => {
      setMobileMenuOpen((prevState) => !prevState);
    };

    // Click outside dropdown to close
    useEffect(() => {
      function onDocClick(e) {
        setDropdownOpen(false);
      }
      if (dropdownOpen) document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }, [dropdownOpen]);

    return (
      <div className="profile-page">
        <header className="profile-topbar">
          <div className="topbar-left">
            <div className="logo">
              <Link to="/inside-app" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
                TUPulse <i className="fab fa-typo3"></i>
              </Link>
            </div>
            <div className="top-search">
              <input
                type="text"
                placeholder="Search"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-right">
            <button onClick={handleMobileMenuToggle} className="menu-icon">
              <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
            </button>
            <button
              className="avatar-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((s) => !s);
              }}
            >
              <img src={avatar} alt="avatar" />
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <Link to="/my-profile" className="dd-item" onClick={() => setDropdownOpen(false)}>
                  My Profile
                </Link>
                <Link to="/account-settings" className="dd-item" onClick={() => setDropdownOpen(false)}>
                  Account Settings
                </Link>
                <Link to="/feedback" className="dd-item" onClick={() => setDropdownOpen(false)}>
                  Give Feedback
                </Link>

                <div className="dd-item toggle-row">
                  <span>Dark Mode</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <button className="dd-item logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="profile-main">
          <div className="cover-avatar-container">
            <div
              className="cover"
              style={{ backgroundImage: `url(${cover})` }}
              onClick={() => coverInputRef.current?.click()}
              title="Click to change cover"
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden-file"
                onChange={handleCoverChange}
              />
              <div className="cover-overlay">
                <div className="cover-actions">Change Cover</div>
              </div>
            </div>

            <div className="profile-avatar-column" onClick={() => avatarInputRef.current?.click()}>
              <div className="avatar-wrapper">
                <img src={avatar} alt="profile" className="avatar-img" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden-file"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          <section className="profile-header">
            <div className="profile-info">
              <div className="name-row">
                {editingName ? (
                  <input
                    className="name-input"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    onBlur={saveName}
                    autoFocus
                  />
                ) : (
                  <h1 onClick={() => setEditingName(true)}>{nickname}</h1>
                )}
                {avgRating >= 4.5 && (
                  <span className="verified" title="Verified seller">
                    ✔︎
                  </span>
                )}
              </div>

              <p className="subtitle">Bini Member</p>
              <p className="subtitle small">{university}</p>

              <div className="profile-actions">
                <button className="btn primary" onClick={() => setShowModal(true)}>
                  Create Post
                </button>
              </div>
            </div>
          </section>

          <section className="left-column">
            <h3>Photos</h3>
            <div className="photos-grid">
              <img
                src="/images/mikha.webp"
                alt="photos"
              />
            </div>

            <div className="rating-box">
              <h4>Rating</h4>
              <div className="rating-stars">
                <span className="big-rating">{avgRating}</span>
                <div className="stars">{renderStars(avgRating)}</div>
              </div>
              <p className="rating-note">{ratings.length} reviews</p>
            </div>
          </section>

          <section className="content-column">
            <div className="filters-row">
              <div className="filter-buttons">
                {["All Posts", "Buy/Sell", "Rent", "Swap"].map((f) => (
                  <button
                    key={f}
                    className={`filter-btn ${activeFilter === f ? "active" : ""}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <input
                placeholder="Search posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="posts-grid">
              {filteredPosts.length === 0 ? (
                <div className="no-posts">No posts to show.</div>
              ) : (
                filteredPosts.map((p) => (
                  <article className="post-card" key={p.id}>
                    <div className="post-thumb">
                      <img src={p.img} alt={p.title} />
                    </div>
                    <div className="post-body">
                      <div className="post-title">{p.title}</div>
                      <div className="post-desc">{p.desc}</div>
                      <div className="post-meta">
                        <span className="price">₱{p.price}</span>
                        <span className="category">{p.category}</span>
                      </div>

                      <div className="post-actions">
                        <button className="btn small">Chat</button>
                        <button className="btn small ghost">More</button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>

        {showModal && <CreatePostModal onClose={() => setShowModal(false)} onCreate={addPost} />}
      </div>
    );
  }

  // Helper function to render star ratings
  function renderStars(avg) {
    const stars = [];
    const full = Math.floor(avg);
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push("★");
      else stars.push("☆");
    }
    return <span className="star-string">{stars.join("")}</span>;
  }

  // Modal for creating posts
  function CreatePostModal({ onClose, onCreate }) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Buy/Sell");
    const [imgPreview, setImgPreview] = useState(null);
    const [error, setError] = useState("");
    const fileRef = useRef(null);

    function submit(e) {
      e.preventDefault();
      setError("");

      if (!title) {
        setError("Please add a product name.");
        return;
      }

      onCreate({
        title,
        desc,
        price: price ? Number(price) : 0,
        category,
        img: imgPreview || "",
      });
    }

    function handleFile(e) {
      const f = e.target.files?.[0];
      if (f) setImgPreview(URL.createObjectURL(f));
    }

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <form
          className="modal-card"
          onSubmit={submit}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Create Post</h3>

          {error && (
            <div style={{ color: 'var(--brand-red)', marginBottom: '10px', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <div className="form-row">
            <label>Product Name</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="form-row">
            <label>Price (₱)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Buy/Sell</option>
              <option>Rent</option>
              <option>Swap</option>
            </select>
          </div>

          <div className="form-row">
            <label>Image</label>
            <div className="file-row">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} />
              {imgPreview && <img src={imgPreview} alt="preview" className="thumb-small" />}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">Post</button>
          </div>
        </form>
      </div>
    );
  } /*s*/
