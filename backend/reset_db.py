import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def get_db_connection():
    try:
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            conn = psycopg2.connect(db_url, sslmode='require')
        else:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'postgres'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'password')
            )
        return conn
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return None

def reset_database():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        
        print("💥 DROPPING ALL TABLES...")
        # Order is important because of Foreign Keys (CASCADE handles it, but good practice)
        tables = [
            'notifications', 
            'otps', 
            'cart', 
            'swaps', 
            'rentals', 
            'transactions', 
            'products', 
            'users'
        ]
        
        for table in tables:
            cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"   - Dropped {table}")

        conn.commit()
        print("✅ All tables deleted.\n")

        print("🏗️ RECREATING TABLES WITH CORRECT SCHEMA...")

        # 1. USERS
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                bio TEXT,
                profile_image TEXT,
                course VARCHAR(100),
                year_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. PRODUCTS
        cur.execute("""
            CREATE TABLE products (
                id SERIAL PRIMARY KEY,
                seller_id INTEGER REFERENCES users(id),
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2),
                category VARCHAR(100),
                condition VARCHAR(50),
                availability TEXT, 
                image_url TEXT,
                listing_type VARCHAR(20) DEFAULT 'sell',
                status VARCHAR(20) DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. TRANSACTIONS (FIXED SCHEMA: Uses 'id', 'amount', 'meetup_details')
        cur.execute("""
            CREATE TABLE transactions (
                id SERIAL PRIMARY KEY,
                buyer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                seller_id INTEGER,
                quantity INTEGER DEFAULT 1,
                amount DECIMAL(10, 2),
                payment_method VARCHAR(50),
                payment_reference VARCHAR(100),
                receipt_code VARCHAR(100),
                meetup_details TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. RENTALS
        cur.execute("""
            CREATE TABLE rentals (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                renter_id INTEGER REFERENCES users(id),
                owner_id INTEGER REFERENCES users(id),
                rent_start DATE NOT NULL,
                rent_end DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. SWAPS
        cur.execute("""
            CREATE TABLE swaps (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                offered_item_id INTEGER REFERENCES products(id),
                requester_id INTEGER REFERENCES users(id),
                offer_description TEXT,
                offer_image_url TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 6. CART
        cur.execute("""
            CREATE TABLE cart (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            );
        """)

        # 7. OTPS
        cur.execute("""
            CREATE TABLE otps (
                email VARCHAR(100) PRIMARY KEY,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
            );
        """)

        # 8. NOTIFICATIONS
        cur.execute("""
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                sender_id INTEGER REFERENCES users(id) DEFAULT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                deep_link TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("✅ SUCCESS! Database has been nuked and rebuilt correctly.")
        print("👉 You can now register a new user and test checkout.")

    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    reset_database()