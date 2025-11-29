import Button from './Button.jsx';
import './Footer.css';

function Footer() {
  return (
    <div className="footer-container">
      <div className="footer-inner">
        {/* LEFT SIDE */}
        <section className='footer-subscription'>
          <h2 className='footer-subscription-heading'>JOIN THE COMMUNITY!</h2>
          <p className="footer-subscription-text">You can join at any time!</p>
          <div className="input-areas">
            <form>
              <input 
                type="email" 
                name="email" 
                placeholder="Your Email" 
                className="footer-input" 
              />
              <Button buttonStyle='btn--outline'>Subscribe</Button>
            </form>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="footer-contact">
          <h2><i class="fa-solid fa-phone"></i>  CONTACT US</h2>
          <ul>
            <li><a href="mailto:krislyn.sayat@tup.edu.ph">krislyn.sayat@tup.edu.ph</a></li>
            <li><a href="mailto:paulangelo.dalipe@tup.edu.ph">paulangelo.dalipe@tup.edu.ph</a></li>
            <li><a href="mailto:brian.dapito@tup.edu.ph">brian.dapito@tup.edu.ph</a></li>
            <li><a href="mailto:maverick.sandoval@tup.edu.ph">maverick.sandoval@tup.edu.ph</a></li>
            <li><a href="mailto:johncarlo.trajico@tup.edu.ph">johncarlotrajico@tup.edu.ph</a></li>
          </ul>
        </section>
      </div>

      <p className="footer-rights">© 2025 TUPulse | All Rights Reserved</p>
    </div>
  );
}

export default Footer;
