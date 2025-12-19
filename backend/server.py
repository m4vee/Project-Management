import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
       try:
           # For Render deployment
           db_url = os.getenv('DATABASE_URL')
           if db_url:
               # Render uses 'postgres://' but psycopg2 needs 'postgresql://'
               if db_url.startswith('postgres://'):
                   db_url = db_url.replace('postgres://', 'postgresql://', 1)
               conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
           else:
               # Local development fallback
               conn = psycopg2.connect(
                   host=os.getenv('DB_HOST', 'localhost'),
                   database=os.getenv('DB_NAME', 'postgres'),
                   user=os.getenv('DB_USER', 'postgres'),
                   password=os.getenv('DB_PASSWORD', 'password'),
                   cursor_factory=RealDictCursor
               )
           return conn
       except Exception as e:
           print(f"Database Connection Failed: {e}")
           return None

def init_db():
    """Test database connection"""
    try:
        conn = get_db_connection()
        conn.close()
        print("✓ Database connected successfully")
        return True
    except Exception as e:
        print(f"✗ Database connection error: {e}")
        return False