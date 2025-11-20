import React, { useState } from "react";
import "./PhotosSection.css";
export default function PhotosSection({ photos = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Default fallback images
  const defaultImages = [
    "https://picsum.photos/300/200?random=1",
    "https://picsum.photos/300/200?random=2",
    "https://picsum.photos/300/200?random=3",
    "https://picsum.photos/300/200?random=4",
  ];

  // Merge and limit to max of 6 images
  const allPhotos = [...photos, ...defaultImages].slice(0, 6);

  return (
    <div className="photos-section">
      <h3 className="photos-title">Photos</h3>

      <div className="photo-grid">
        {allPhotos.map((src, i) => (
          <div key={i} className="photo-item" onClick={() => setLightboxIndex(i)}>
            <img src={src} alt="photo" />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <img src={allPhotos[lightboxIndex]} alt="preview" className="lightbox-img" />
        </div>
      )}
    </div>
  );
}
