import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import AppNavbar from "../AppNavbar";
import RatingBox from "./RatingBox";
import PhotosSection from "./PhotosSection"; // adjust path as needed
import PostActionModal from "./PostActionModal";

const DEFAULT_COVER =
"https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop&crop=entropy";
const DEFAULT_AVATAR = "/images/mikha.webp";

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

const [nickname, setNickname] = useState("Krislyn Sayat");
const [editingName, setEditingName] = useState(false);
const [university] = useState("Technological University of the Philippines - Manila");
const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
const [cover, setCover] = useState(DEFAULT_COVER);

const [posts, setPosts] = useState(samplePosts);
const [activeFilter, setActiveFilter] = useState("All Posts");
const [showModal, setShowModal] = useState(false);

const [dropdownOpen, setDropdownOpen] = useState(false);
const [photos, setPhotos] = useState([]);
const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

const [selectedPost, setSelectedPost] = useState(null);
const [actionModalOpen, setActionModalOpen] = useState(false);




useEffect(() => {
document.documentElement.setAttribute("data-theme", theme);
localStorage.setItem("theme", theme);
}, [theme]);

const avatarInputRef = useRef(null);
const coverInputRef = useRef(null);

const [query, setQuery] = useState("");
const [globalQuery, setGlobalQuery] = useState("");

const filteredPosts = posts.filter((p) => {
const matchCategory = activeFilter === "All Posts" || p.category === activeFilter;
const matchQuery =
!query ||
p.title.toLowerCase().includes(query.toLowerCase()) ||
p.desc.toLowerCase().includes(query.toLowerCase());
return matchCategory && matchQuery;
});

function handleAvatarChange(e) {
const f = e.target.files?.[0];
if (f) setAvatar(URL.createObjectURL(f));
}

function handleCoverChange(e) {
const f = e.target.files?.[0];
if (f) setCover(URL.createObjectURL(f));
}

function saveName() {
setEditingName(false);
}

function handleLogout() {
navigate("/login");
}

const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const handleMobileMenuToggle = () => {
setMobileMenuOpen((prevState) => !prevState);
};

useEffect(() => {
function onDocClick() {
setDropdownOpen(false);
}
if (dropdownOpen) document.addEventListener("click", onDocClick);
return () => document.removeEventListener("click", onDocClick);
}, [dropdownOpen]);
const CreatePost = ({ onClose }) => {
  return (
    <div className="cp-overlay">
      <div className="cp-modal">
        <h2 className="cp-title">Create Post</h2>
        {/* your inputs here */}
        <div className="cp-buttons">
          <button className="cp-cancel" onClick={onClose}>Cancel</button>
          <button className="cp-post">Post</button>
        </div>
      </div>
    </div>
  );
};
function Lightbox({ images, index, onClose, setIndex }) {
  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="nav-btn left" onClick={() => setIndex((index - 1 + images.length) % images.length)}>
          ‹
        </button>

        <img src={images[index]} alt="preview" className="lightbox-image" />

        <button className="nav-btn right" onClick={() => setIndex((index + 1) % images.length)}>
          ›
        </button>

      </div>
    </div>
  );
}
function addPost(newPost) {
  const id = Date.now();
  // store the post (existing behavior)
  setPosts((prev) => [{ id, ...newPost }, ...prev]);

  // If newPost.image is an array of preview URLs, add them to the photo grid
  // Accepts either a single string or array
  const imgs = Array.isArray(newPost.image) ? newPost.image : newPost.image ? [newPost.image] : [];
  if (imgs.length > 0) {
    // Prepend latest photos so newest are shown first
    setPhotos((prev) => [...imgs, ...prev]);
  }

  setShowModal(false);
  setActiveFilter("All Posts");
}


return (
<div className="profile-page">
<header className="profile-topbar">
<div className="topbar-left">
<div className="logo">
<Link
to="/inside-app"
className="navbar-logo"
onClick={() => setMobileMenuOpen(false)}
>
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

          <Link to="/cart" className="dd-item" onClick={() => setDropdownOpen(false)}>
            My Cart
          </Link>

          <Link to="/rentalrequests" className="dd-item" onClick={() => setDropdownOpen(false)}>
            My Rentals
          </Link>

          <Link to="/swaprequests" className="dd-item" onClick={() => setDropdownOpen(false)}>
            My Swaps
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
                onChange={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
              />
              <span className="slider" />
            </label>
          </div>

          <button className="dd-item logout" onClick={handleLogout}>
            Logout
          </button>
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

      <div
        className="profile-avatar-column"
        onClick={() => avatarInputRef.current?.click()}
      >
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
  <div className="profile-layout">

    {/* LEFT COLUMN — Photos */}
    <div className="left-col">
      <PhotosSection photos={photos} />
    </div>

    {/* CENTER COLUMN — your EXISTING profile-info (unchanged) */}
    <div className="center-col">
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
            <h1>{nickname}</h1>
          )}
        </div>

        <p className="subtitle">Bini Member</p>
        <p className="subtitle small">{university}</p>
      </div>
    </div>

    {/* RIGHT COLUMN — Move RatingBox here */}
    <div className="right-col">
      <div className="profile-info">
        <RatingBox
          sellerId="krislyn"
          reviews={[
            { id: 1, user: "Anna", rating: 5, comment: "Very smooth transaction!" },
            { id: 2, user: "Mark", rating: 4, comment: "Item in good condition." },
            { id: 3, user: "Joan", rating: 5, comment: "Super bait seller!" },
          ]}
        />
      </div>
    </div>

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

    <div className="search-create-wrapper">
      <input
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="btn primary" onClick={() => setShowModal(true)}>
        Create Post
      </button>
    </div>
  </div>


  <div className="posts-grid">
    {filteredPosts.length === 0 ? (
      <div className="no-posts">No posts to show.</div>
    ) : (
      filteredPosts.map((p) => (
        <article className="post-card" key={p.id}>
          <div className="post-thumb">
            <img a
              src={p.img || (Array.isArray(p.image) ? p.image[0] : p.image)} 
              alt={p.title}
            />
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
<button
  className="btn small ghost"
  onClick={() => {
    setSelectedPost(p); // Store the selected post
    setActionModalOpen(true); // Open the action modal
  }}
>
  More
</button>
            </div>
          </div>
        </article>
      ))
    )}
  </div>
</section>
  </main>
{actionModalOpen && (
  <PostActionModal
    post={selectedPost} // Pass the selected post object to the modal
    onClose={() => setActionModalOpen(false)} // Close the modal when cancel is clicked or clicked outside
    onDelete={(id) => {
      // Delete the post by filtering out the post with the provided ID
      setPosts(prev => prev.filter(p => p.id !== id));
      setActionModalOpen(false); // Close the modal after deleting
    }}
    onEdit={(updatedPost) => {
      // Update the post with the new data from the modal
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      setActionModalOpen(false); // Close the modal after editing
    }}
  />
)}



  {showModal && (
    <CreatePostModal
      onClose={() => setShowModal(false)}
      onCreate={addPost}
    />
  )}
</div>


);
}

function CreatePostModal({ onClose, onCreate }) {
const [title, setTitle] = useState("");
const [desc, setDesc] = useState("");
const [price, setPrice] = useState("");
const [category, setCategory] = useState("Buy/Sell");
const [imgPreview, setImgPreview] = useState([]);
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
  image: imgPreview || "",
});


}

function handleFile(e) {
  const files = Array.from(e.target.files);
  const previews = files.map(file => URL.createObjectURL(file));
  setImgPreview(previews);
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
      <div
        style={{
          color: "var(--brand-red)",
          marginBottom: "10px",
          fontWeight: "bold",
        }}
      >
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
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option>Buy/Sell</option>
        <option>Rent</option>
        <option>Swap</option>
      </select>
    </div>

<div className="form-row">
  <label>Images</label>
  <div className="file-row">
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      multiple
      onChange={handleFile}
    />

    {imgPreview.length > 0 && (
      <div className="preview-row">
        {imgPreview.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`preview-${i}`}
            className="thumb-small"
          />
        ))}
      </div>
    )}
  </div>
</div>


    <div className="modal-actions">
      <button type="button" className="btn ghost" onClick={onClose}>
        Cancel
      </button>
      <button type="submit" className="btn primary">
        Post
      </button>
    </div>
  </form>
</div>


);
}