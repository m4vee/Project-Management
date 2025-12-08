import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def reset_database():
    try:
        # Connect to Database
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
            
        cur = conn.cursor()
        
        print("⏳ Deleting old tables...")
        # Drop tables to start fresh
        cur.execute("DROP TABLE IF EXISTS rentals CASCADE;")
        cur.execute("DROP TABLE IF EXISTS swaps CASCADE;")
        cur.execute("DROP TABLE IF EXISTS products CASCADE;")
        cur.execute("DROP TABLE IF EXISTS otps CASCADE;")
        cur.execute("DROP TABLE IF EXISTS users CASCADE;")
        
        conn.commit()
        print("✅ Old tables deleted!")
        
        print("⏳ Creating NEW tables...")
        
        # 1. Users Table (Ensure 'username' exists)
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL, -- This column was missing
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                bio TEXT,
                profile_image TEXT,
                course VARCHAR(100),
                year_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. OTP Table
        cur.execute("""
            CREATE TABLE otps (
                email VARCHAR(100) PRIMARY KEY,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
            );
        """)

        # 3. Products Table
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

        # 4. Rentals Table
        cur.execute("""
            CREATE TABLE rentals (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                renter_id INTEGER REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. Swaps Table
        cur.execute("""
            CREATE TABLE swaps (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                requester_id INTEGER REFERENCES users(id),
                offer_description TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ SUCCESS! Database has been reset with correct columns.")
        print("👉 Please RE-REGISTER a new account now.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_database()