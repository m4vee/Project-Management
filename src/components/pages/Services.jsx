import { useState } from 'react';
import '../../index.css';
import './Services.css';

export default function Services() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <div className="services-page">
      <img src="/images/services.jpg" alt="Services" className="services-banner" />
      <h1 className="services-title">Our Services</h1>
      <p className="services-subtitle">
        Explore how TUPulse connects students through a smarter, sustainable campus marketplace.
      </p>

      <div className="services-container">
        <div className="service-card" onClick={() => setSelectedService('Buying')}>
          <img src="/images/buy2.jpg" alt="Buying" className="service-img" />
          <h2>Buying</h2>
          <p>Discover affordable items, some are pre-loved, sold by fellow students — from books to gadgets.</p>
        </div>

        <div className="service-card" onClick={() => setSelectedService('Selling')}>
          <img src="/images/sell.webp" alt="Selling" className="service-img" />
          <h2>Selling</h2>
          <p>List your items quickly and easily to earn money while helping others find what they need.</p>
        </div>

        <div className="service-card" onClick={() => setSelectedService('Renting')}>
          <img src="/images/rent2.jpg" alt="Renting" className="service-img" />
          <h2>Renting</h2>
          <p>Offer or borrow items temporarily — ideal for tools, instruments, and materials.</p>
        </div>

        <div className="service-card" onClick={() => setSelectedService('Swapping')}>
          <img src="/images/swap2.jpg" alt="Swapping" className="service-img" />
          <h2>Swapping</h2>
          <p>Exchange items with classmates and promote a more eco-friendly student community.</p>
        </div>
      </div>

      {selectedService && (
        <div className="popup-overlay" onClick={() => setSelectedService(null)}>
          <div className="popup-box show" onClick={(e) => e.stopPropagation()}>
            {selectedService === 'Buying' && (
              <>
                <h2>BUYING</h2>
                <img src="/images/buy2.jpg" alt="Buying" className="popup-img" />
                <p>
                  Our buying service allows students to purchase verified, pre-owned items within the
                  TUP community. Enjoy safe and affordable transactions with trusted student sellers.
                </p>
              </>
            )}
            {selectedService === 'Selling' && (
              <>
                <h2>SELLING</h2>
                <img src="/images/sell.webp" alt="Selling" className="popup-img" />
                <p>
                  Easily list your items for sale within the campus community. Turn unused belongings
                  into earnings while helping other students find great deals.
                </p>
              </>
            )}
            {selectedService === 'Renting' && (
              <>
                <h2>RENTING</h2>
                <img src="/images/rent2.jpg" alt="Renting" className="popup-img" />
                <p>
                  Need something for a short time? Rent tools, uniforms, or materials from other
                  students — save money and resources by sharing.
                </p>
              </>
            )}
            {selectedService === 'Swapping' && (
              <>
                <h2>SWAPPING</h2>
                <img src="/images/swap2.jpg" alt="Swapping" className="popup-img" />
                <p>
                  Swap items with fellow students — books, gadgets, or clothes — to promote
                  sustainability and reduce waste within the TUP community.
                </p>
              </>
            )}
            <button className="close-btn" onClick={() => setSelectedService(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
