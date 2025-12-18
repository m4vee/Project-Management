import React from 'react';
import CardItem from "./CardItem";
import './Cards.css';

function Cards() {
  return (
    <div className="cards">
      <h1>Check out these Amazing Features!</h1>
      <div className="cards__container">
        <div className="cards__wrapper">

          <ul className="cards__items">
            <CardItem
              src="images/buy.jpg"
              text="Buy items easily from trusted schoolmates."
              label="Buying"
              path="/services" 
            />
            <CardItem
              src="images/unif.jpg"
              text="Sell your pre-loved school stuff and earn quickly."
              label="Selling"
              path="/services"
            />
          </ul>
          
          <ul className="cards__items">
            <CardItem
              src="images/rent.jpg"
              text="Rent tools, uniforms, or gadgets safely."
              label="Renting"
              path="/services"
            />
            <CardItem
              src="images/swap.jpg"
              text="Swap items conveniently with other students."
              label="Swapping"
              path="/services"
            />
            <CardItem
              src="images/tup.jpg"
              text="Join the TUPulse community marketplace!"
              label="Community"
              path="/sign-up"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Cards;