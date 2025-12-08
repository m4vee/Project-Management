import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    # Kunin ang connection details
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
    cur.execute("DROP TABLE IF EXISTS users CASCADE;")
    cur.execute("DROP TABLE IF EXISTS otps CASCADE;")
    
    conn.commit()
    print("✅ Old tables deleted!")
    
    print("⏳ Creating new tables with 'username' column...")
    # Updated Users Table
    cur.execute("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Updated OTP Table
    cur.execute("""
        CREATE TABLE otps (
            email VARCHAR(100) PRIMARY KEY,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
        );
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ DATABASE FIXED! Pwede ka na mag-register.")

except Exception as e:
    print(f"❌ Error: {e}")