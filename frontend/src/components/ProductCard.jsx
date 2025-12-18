// src/components/ProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
// import './ProductCard.css'; // Gumawa ka rin nito para sa styling kung gusto mo

function ProductCard({ product }) {
  const navigate = useNavigate();

  // Handle Buy Button Click
  const handleBuyNow = () => {
    navigate(`/checkout/${product.id}`);
  };

  // Handle Chat Button Click (Dummy for now)
  const handleChat = () => {
    alert(`Chatting seller of: ${product.name}`);
    // navigate(`/chat/${product.seller_id}`); // Future implementation
  };

  return (
    <div className="product-card" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', margin: '10px', width: '250px' }}>
        {/* Product Image */}
        <div className="product-img-wrapper" style={{ position: 'relative', height: '150px', overflow: 'hidden', borderRadius: '5px' }}>
            
            {/* BADGE: Para makita agad kung Buying or Selling */}
            <span className={`status-badge`} style={{
                position: 'absolute', 
                top: '5px', 
                left: '5px', 
                padding: '5px 10px', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#fff',
                backgroundColor: product.listing_type === 'looking_for' ? '#ff9800' : '#4caf50', // Orange for LF, Green for Sell
                borderRadius: '4px'
            }}>
                {product.listing_type === 'looking_for' ? 'LOOKING FOR' : 
                 product.listing_type === 'rent' ? 'FOR RENT' : 
                 product.listing_type === 'swap' ? 'SWAP' : 'SELLING'}
            </span>
            
            <img 
                src={product.image_url || '/placeholder.jpg'} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        </div>

        {/* Product Details */}
        <div className="product-info" style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '5px 0' }}>{product.name}</h3>
            
            <p className="price" style={{ color: '#b12704', fontWeight: 'bold' }}>
                {product.listing_type === 'swap' ? 'Swap Offer' : 
                 product.listing_type === 'looking_for' ? `Budget: ₱${Number(product.price).toLocaleString()}` :
                 `₱${Number(product.price).toLocaleString()}`}
            </p>
            
            <p className="seller" style={{ fontSize: '0.9rem', color: '#555' }}>
                By: {product.seller_name || 'Unknown Seller'}
            </p>

            {/* --- BUTTONS LOGIC --- */}
            <div className="card-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                
                {/* 1. SELLING: Show Buy Button */}
                {(product.listing_type === 'sell' || !product.listing_type) && (
                    <button 
                        onClick={handleBuyNow}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Buy Now
                    </button>
                )}

                {/* 2. LOOKING FOR: Show "Offer Item" instead of Buy */}
                {product.listing_type === 'looking_for' && (
                    <button 
                        onClick={handleChat}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Offer Item
                    </button>
                )}

                {/* 3. RENT: Show Rent Button */}
                {product.listing_type === 'rent' && (
                    <button 
                        onClick={() => alert('Rent logic here')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#388e3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Rent This
                    </button>
                )}

                {/* 4. SWAP: Show Swap Button */}
                {product.listing_type === 'swap' && (
                    <button 
                        onClick={() => alert('Swap logic here')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#f57c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Offer Swap
                    </button>
                )}
            </div>
        </div>
    </div>
  );
}

export default ProductCard;