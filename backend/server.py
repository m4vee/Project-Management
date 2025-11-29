import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        conn = psycopg2.connect(
            database_url,
            cursor_factory=RealDictCursor,
            sslmode='require'
        )
    else:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', 5432),
            cursor_factory=RealDictCursor,
            sslmode='require'
    )
    return conn

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