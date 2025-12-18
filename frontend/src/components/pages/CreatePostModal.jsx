import React, { useState, useRef, useEffect } from "react";
import "./CreatePostModal.css";

export default function CreatePostModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [rentDuration, setRentDuration] = useState("");
  const [itemWanted, setItemWanted] = useState("");
  const [category, setCategory] = useState("Buy/Sell");

  const [imgPreview, setImgPreview] = useState([]);
  const [error, setError] = useState("");

  const fileRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function submit(e) {
  e.preventDefault();
  setError("");

  if (!title) {
    setError("Please add a product name.");
    return;
  }

  const payload = {
    title,
    description: desc,             // corrected key
    price: price ? Number(price) : 0,
    rentTime: rentDuration || null, // match your Profile code
    swapFor: itemWanted || null,    // match your Profile code
    category,                       // main category: Buy/Sell, Rent, Swap
    itemCategory,                   // detailed item category
    condition,
    availability,                   // corrected key
    img: imgPreview[0] || "/images/default.png", // match Profile
  };

  onCreate(payload);
}


  const [condition, setCondition] = useState("Good"); // default
  const [availability, setAvailability] = useState([]); // array of selected days
  const [itemCategory, setItemCategory] = useState(""); // for detailed category




  function handleFile(e) {
    const files = Array.from(e.target.files);
    const previewURLs = files.map((f) => URL.createObjectURL(f));
    setImgPreview(previewURLs);
  }

  return (
    <div className="cp-backdrop" onClick={() => onClose && onClose()}>
      <form
        className="cp-modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <button
          className="cp-close-btn"
          type="button"
          aria-label="Close"
          title="Close"
          onClick={() => onClose && onClose()}
        >
          <span aria-hidden>×</span>
        </button>
        <h3 className="cp-title">Create New Post</h3>

        {error && <div className="cp-error">{error}</div>}

        {/* PRODUCT NAME */}
        <div className="cp-group">
          <label>Product Name</label>
          <input
            className="cp-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* CATEGORY */}
        <div className="cp-group">
          <label>Category</label>
          <select
            className="cp-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Buy/Sell</option>
            <option>Rent</option>
            <option>Swap</option>
          </select>
        </div>
        
        {/* ITEM CATEGORY */}
        <div className="cp-group">
          <label>Item Category</label>
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          >
            <option value="" disabled hidden>
              Select Category
            </option>
            <option value="arts">Arts and Crafts</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="uniform">Uniform</option>
            <option value="gadgets">Gadgets</option>
            <option value="others">Other School Stuffs</option>
          </select>
        </div>


        {/* PRICE FIELD — Buy/Sell or Rent */}
        {(category === "Buy/Sell" || category === "Rent") && (
          <div className="cp-group">
            <label>Price (₱)</label>
            <input
              type="number"
              className="cp-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        )}
        
        
        {/* RENT DURATION */}
        {category === "Rent" && (
          <div className="cp-group">
            <label>Rent Duration (days)</label>
            <input
              type="number"
              className="cp-input"
              value={rentDuration}
              onChange={(e) => setRentDuration(e.target.value)}
            />
          </div>
        )}

        {/* SWAP ITEM */}
        {category === "Swap" && (
          <div className="cp-group">
            <label>Looking to Swap For</label>
            <input
              className="cp-input"
              value={itemWanted}
              onChange={(e) => setItemWanted(e.target.value)}
              placeholder="Example: Black hoodie, scientific calculator..."
            />
          </div>
        )}
        
        {/* CONDITION */}
        
          <div className="cp-group">
            <label>Condition</label>
            <select
              className="cp-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option>New</option>
              <option>Good</option>
              <option>Used</option>
            </select>
          </div>

        {/* MEETUP AVAILABILITY */}
          <div className="cp-group">
            <label>Meetup Availability</label>
            <div className="availability-options">
              {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((day) => (
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



        {/* DESCRIPTION */}
        <div className="cp-group">
          <label>Description</label>
          <textarea
            className="cp-textarea"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

      

        {/* IMAGES */}
        <div className="cp-group">
          <label>Images</label>
          <input
            ref={fileRef}
            type="file"
            className="cp-file"
            accept="image/*"
            multiple
            onChange={handleFile}
          />

          {imgPreview.length > 0 && (
            <div className="cp-preview-row">
              {imgPreview.map((src, i) => (
                <img key={i} src={src} alt="" className="cp-thumb" />
              ))}
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="cp-actions">
          <button type="button" className="cp-btn ghost" onClick={() => onClose && onClose()}>
            Cancel
          </button>
          <button type="submit" className="cp-btn primary">
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
