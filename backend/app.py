from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import bcrypt
import jwt
import json
import datetime
import uuid
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from datetime import date, timedelta
import traceback

load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://your-frontend.vercel.app"  # Add your Vercel URL
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["2000 per day", "500 per hour"],
    storage_uri="memory://"
)

SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key_change_me')

def get_db_connection():
    try:
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            conn = psycopg2.connect(
                db_url, 
                sslmode='require', 
                cursor_factory=RealDictCursor,
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=5
            )
            with conn.cursor() as cur:
                cur.execute("SET TIME ZONE 'Asia/Manila'") 
        else:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'postgres'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'password'),
                cursor_factory=RealDictCursor
            )
            with conn.cursor() as cur:
                cur.execute("SET TIME ZONE 'Asia/Manila'")
                
        return conn
    except Exception as e:
        print(f"Database Connection Failed: {e}")
        return None
        
def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_notification(user_id, message, event_type, conn, sender_id=None, deep_link=None):
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO notifications (user_id, message, type, sender_id, deep_link)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, message, event_type, sender_id, deep_link))
    except Exception as e:
        print(f"Notification creation failed: {e}")

def init_tables():
    conn = get_db_connection()
    if not conn:
        print("Skipping table initialization due to failed DB connection.")
        return

    try:
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
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
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS otps (
                email VARCHAR(100) PRIMARY KEY,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
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
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rentals (
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

        cur.execute("""
            CREATE TABLE IF NOT EXISTS swaps (
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
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) NOT NULL, 
                amount DECIMAL(10, 2),
                payment_method VARCHAR(50),
                payment_reference VARCHAR(100),
                meetup_details TEXT, 
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS transaction_items (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE, 
                product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
                seller_id INTEGER REFERENCES users(id) NOT NULL, 
                quantity INTEGER NOT NULL,
                price_at_sale DECIMAL(10, 2) NOT NULL,
                listing_type VARCHAR(50) NOT NULL
            );
        """)
        

        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
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

        cur.execute("""
            CREATE TABLE IF NOT EXISTS cart (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            );
        """)
        

        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES users(id),
                receiver_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id) DEFAULT NULL,
                message TEXT,
                image_url TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_relationships (
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                followed_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_id, followed_id)
            );
        """)  

        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_ratings (
                id SERIAL PRIMARY KEY,
                rater_id INTEGER REFERENCES users(id) NOT NULL,
                rated_user_id INTEGER REFERENCES users(id) NOT NULL,
                transaction_type VARCHAR(20) NOT NULL, -- 'sell', 'rent', 'swap'
                transaction_id INTEGER, -- Reference sa transactions/rentals/swaps table ID
                rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
                review_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                -- Siguraduhin na isang beses lang pwedeng mag-rate ang isang user para sa isang transaction
                UNIQUE(rater_id, transaction_type, transaction_id) 
            );
        """)      
        try:
            cur.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id) DEFAULT NULL;")
            cur.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deep_link TEXT;")
            
            cur.execute("ALTER TABLE swaps ADD COLUMN IF NOT EXISTS rejection_reason TEXT;")
            
            cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);") 
            cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);")
            cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);")
            cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_code VARCHAR(100);")
            cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS meetup_details TEXT;")
            
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message TEXT;")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INTEGER REFERENCES users(id);")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id);")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) DEFAULT NULL;")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;")
            cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;") 
            
            cur.execute("ALTER TABLE rentals ADD COLUMN IF NOT EXISTS comment TEXT;")

            cur.execute("ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;")
            cur.execute("ALTER TABLE user_ratings ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;")
                 
        except Exception as e:
            print(f"Schema alteration warning: {e}")
            conn.rollback()
            
        conn.commit()
        cur.close()
        conn.close()
        print("Tables initialized and schema updated successfully.")
    except Exception as e:
        print(f"Error initializing tables: {e}")
        if conn:
            conn.close()

init_tables() 

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "message": "Backend is running"}), 200

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def modify_product(product_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()

        cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404

        if request.method == 'DELETE':
            try:
                cur.execute("DELETE FROM cart WHERE product_id = %s", (product_id,))
                cur.execute("DELETE FROM rentals WHERE product_id = %s", (product_id,))
                cur.execute("DELETE FROM swaps WHERE product_id = %s", (product_id,))
                
                cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
                conn.commit()
                return jsonify({"message": "Product deleted successfully"}), 200
            
            except psycopg2.errors.ForeignKeyViolation:
                conn.rollback()
                cur.execute("UPDATE products SET status = 'archived' WHERE id = %s", (product_id,))
                conn.commit()
                return jsonify({"message": "Product archived (history preserved)"}), 200

        elif request.method == 'PUT':
            data = request.json
            
            allowed_keys = ['name', 'description', 'price', 'category', 'condition', 'status', 'availability']
            updates = []
            values = []
            
            for key in allowed_keys:
                if key in data:
                    updates.append(f"{key} = %s")
                    values.append(data[key])
            
            if not updates:
                return jsonify({"message": "No changes provided"}), 200
            
            values.append(product_id)
            query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
            
            cur.execute(query, tuple(values))
            conn.commit()
            return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        if conn: conn.rollback(); conn.close()
        print(f"Product Modify Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
        
@app.route('/api/products', methods=['POST'])
def create_product():
    conn = None
    try:
        seller_id = request.form.get('seller_id')
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category')
        condition = request.form.get('condition')
        availability = request.form.get('availability')
        listing_type = request.form.get('listing_type', 'sell')

        if not all([seller_id, name, category, condition]):
            return jsonify({"error": "Missing required fields for posting."}), 400

        image_url = ""
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"product_{seller_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_url = f"/static/uploads/{unique_filename}"
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO products (seller_id, name, description, price, category, condition, availability, image_url, listing_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name
        """, (seller_id, name, description, price, category, condition, availability, image_url, listing_type))
        
        new_product = cur.fetchone()

        message = f"Your new listing '{new_product['name']}' is now available for {listing_type}."
        create_notification(
            user_id=seller_id,
            message=message,
            event_type="new_post",
            conn=conn,
            sender_id=seller_id,
            deep_link=f"/my-posts"
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Product posted successfully!", "product_id": new_product['id']}), 201

    except Exception as e:
        print(f"Product Creation Error: {e}")
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        query = """
            SELECT p.*, u.username as seller_name, u.profile_image as seller_image
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'available'
            ORDER BY p.created_at DESC
        """
        cur.execute(query)
        products = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify(products), 200
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor()
        
        query = """
            SELECT n.*, u_sender.username as sender_name, u_sender.profile_image as sender_profile_url
            FROM notifications n
            LEFT JOIN users u_sender ON n.sender_id = u_sender.id
            WHERE n.user_id = %s
            ORDER BY n.created_at DESC
            LIMIT 50
        """
        cur.execute(query, (user_id,))
        notifications = cur.fetchall()
        
        cur.close()
        conn.close()
        return jsonify(notifications), 200
    except Exception as e:
        print(f"Notification fetch error: {e}")
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/notifications/mark_read', methods=['PUT'])
def mark_notifications_read():
    conn = None
    try:
        data = request.json
        notification_ids = data.get('ids')
        mark_all = data.get('mark_all', False)
        user_id = data.get('user_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor()
        
        if mark_all and user_id:
            cur.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (user_id,))
        elif notification_ids and len(notification_ids) > 0:
            cur.execute("UPDATE notifications SET is_read = TRUE WHERE id = ANY(%s)", (notification_ids,))
            
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Notifications marked as read"}), 200
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    conn = None
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON body found in request."}), 400

        user_id = data.get('user_id')
        items = data.get('items')
        payment_method = data.get('payment_method', 'Cash')
        meetup_details = data.get('meetup_details', {})
        
        if not user_id or not items:
            return jsonify({"error": "Missing user_id or items list"}), 400
        
        if not isinstance(items, list) or not items:
            return jsonify({"error": "Items list must be a non-empty array."}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        total_amount = 0
        item_details = []
        
        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            cur.execute("""
                SELECT seller_id, name, listing_type, status, price 
                FROM products WHERE id = %s
            """, (product_id,))
            product = cur.fetchone()
            
            if not product:
                raise ValueError(f"Product ID {product_id} not found.")
            if product['status'] != 'available':
                 raise ValueError(f"Product '{product['name']}' is currently not available.")
            
            price_at_sale = product['price'] or 0 
            total_amount += (price_at_sale * quantity)
            
            item_details.append({
                'product_id': product_id,
                'quantity': quantity,
                'price_at_sale': price_at_sale,
                'listing_type': product['listing_type'],
                'seller_id': product['seller_id'],
                'product_name': product['name']
            })
            
        receipt_code = str(uuid.uuid4())[:18].upper()
        
        cur.execute("""
            INSERT INTO transactions (user_id, amount, payment_method, meetup_details, receipt_code, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
            RETURNING id
        """, (user_id, total_amount, payment_method, json.dumps(meetup_details), receipt_code))
        transaction_id = cur.fetchone()['id']
        
        for detail in item_details:
            cur.execute("""
                INSERT INTO transaction_items 
                (transaction_id, product_id, seller_id, quantity, price_at_sale, listing_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                transaction_id,
                detail['product_id'],
                detail['seller_id'],
                detail['quantity'],
                detail['price_at_sale'],
                detail['listing_type']
            ))
            
            cur.execute("UPDATE products SET status = 'pending_sale' WHERE id = %s", (detail['product_id'],))
            
            notif_msg = f"New order received for '{detail['product_name']}' (Txn #{transaction_id})."
            create_notification(detail['seller_id'], notif_msg, 'new_order', conn, user_id, f'/receipt/{transaction_id}')

            
        product_ids_to_remove = [detail['product_id'] for detail in item_details]
        cur.execute(f"""
            DELETE FROM cart 
            WHERE user_id = %s AND product_id IN ({','.join(['%s'] * len(product_ids_to_remove))})
        """, [user_id] + product_ids_to_remove)


        conn.commit()
        cur.close(); conn.close()

        return jsonify({
            "message": "Checkout successful",
            "transaction_id": transaction_id,
            "receipt_code": receipt_code,
            "total_amount": total_amount
        }), 201

    except ValueError as ve:
        if conn: conn.rollback(); conn.close()
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        if conn: conn.rollback(); conn.close()
        print(f"Transaction Creation Error: {e}")
        return jsonify({"error": "Internal server error during transaction"}), 500
    

@app.route('/api/transactions/receipt/<int:transaction_id>', methods=['GET'])
def get_receipt(transaction_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        query_header = """
            SELECT t.id, t.receipt_code, t.created_at, t.amount, t.status,
                   t.payment_method, t.payment_reference, t.meetup_details,
                   u_buyer.username as buyer_name, u_buyer.email as buyer_email
            FROM transactions t
            JOIN users u_buyer ON t.user_id = u_buyer.id
            WHERE t.id = %s
        """
        cur.execute(query_header, (transaction_id,))
        receipt_header = cur.fetchone()

        if not receipt_header:
            cur.close(); conn.close()
            return jsonify({"error": "Receipt not found"}), 404

        query_items = """
            SELECT ti.quantity, ti.price_at_sale as unit_price, ti.listing_type, 
                   p.name as product_name, p.image_url, 
                   u_seller.username as seller_name, u_seller.email as seller_email,
                   u_seller.id as seller_id
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            JOIN users u_seller ON ti.seller_id = u_seller.id
            WHERE ti.transaction_id = %s
        """
        cur.execute(query_items, (transaction_id,))
        receipt_items = cur.fetchall()

        cur.close()
        conn.close()
        
        
        receipt_header['created_at'] = receipt_header['created_at'].isoformat()
        
        if receipt_header.get('meetup_details'):
            try:
                receipt_header['meetup_details'] = json.loads(receipt_header['meetup_details'])
            except:
                receipt_header['meetup_details'] = {}
        else:
            receipt_header['meetup_details'] = {}
        
        receipt_header['items'] = receipt_items 
        
        return jsonify(receipt_header), 200
            
    except Exception as e:
        print(f"Receipt Fetch Error: {e}")
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>/report', methods=['PUT'])
def report_transaction(transaction_id):
    conn = None
    try:
        data = request.json
        reason = data.get('reason', 'Transaction cancelled by buyer')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT user_id, status FROM transactions WHERE id = %s", (transaction_id,))
        trans_header = cur.fetchone()

        if not trans_header:
            cur.close(); conn.close()
            return jsonify({"error": "Transaction not found"}), 404
        
        buyer_id = trans_header['user_id']

        cur.execute("""
            SELECT product_id, seller_id 
            FROM transaction_items 
            WHERE transaction_id = %s
        """, (transaction_id,))
        trans_items = cur.fetchall()
        
        cur.execute("UPDATE transactions SET status = 'cancelled' WHERE id = %s", (transaction_id,))
        
        for item in trans_items:
            product_id = item['product_id']
            seller_id = item['seller_id']

            cur.execute("UPDATE products SET status = 'available' WHERE id = %s", (product_id,))
            
            cur.execute("SELECT username FROM users WHERE id = %s", (buyer_id,))
            buyer_name = cur.fetchone()['username']
            
            msg = f"Transaction cancelled by {buyer_name}. Reason: {reason}. Your item is now available again."
            create_notification(seller_id, msg, "transaction_cancelled", conn, buyer_id, f"/transactions")

        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Transaction cancelled and items restocked."}), 200
        
    except Exception as e:
        print(f"Report Error: {e}")
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/users/<int:user_id>/transactions', methods=['GET'])
def get_user_transactions(user_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        cur.execute("""
            SELECT t.id, t.amount, t.created_at, t.status, t.receipt_code,
                   json_agg(json_build_object(
                       'product_id', ti.product_id,
                       'product_name', p.name,
                       'product_image', p.image_url,
                       'quantity', ti.quantity,
                       'unit_price', ti.price_at_sale,
                       'seller_name', u.username,
                       'seller_id', u.id
                   )) AS items
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            JOIN users u ON ti.seller_id = u.id
            WHERE t.user_id = %s
            GROUP BY t.id
            ORDER BY t.created_at DESC
        """, (user_id,))
        purchases = cur.fetchall()
        
        cur.execute("""
            SELECT t.id, t.amount, t.created_at, t.status, t.receipt_code,
                   json_agg(json_build_object(
                       'product_id', ti.product_id,
                       'product_name', p.name,
                       'product_image', p.image_url,
                       'quantity', ti.quantity,
                       'unit_price', ti.price_at_sale,
                       'buyer_name', u_buyer.username,
                       'buyer_id', u_buyer.id
                   )) AS items
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            JOIN users u_buyer ON t.user_id = u_buyer.id
            WHERE ti.seller_id = %s
            GROUP BY t.id
            ORDER BY t.created_at DESC
        """, (user_id,))
        sales = cur.fetchall()
        
        cur.close()
        conn.close()
        
        # Format Dates
        for trans_list in [purchases, sales]:
            for trans in trans_list:
                trans['created_at'] = trans['created_at'].isoformat()
        
        return jsonify({"purchases": purchases, "sales": sales}), 200
    except Exception as e:
        if conn:
            conn.close()
        print(f"User Transaction Fetch Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rentals', methods=['POST'])
def create_rental():
    conn = None
    try:
        data = request.get_json(silent=True)
        
        if not data:
            return jsonify({"error": "No JSON body found in request."}), 400

        product_id = data.get('product_id')
        renter_id = data.get('renter_id')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')

        if not all([product_id, renter_id, start_date_str, end_date_str]):
            return jsonify({"error": "Missing required fields"}), 400

        try:
            rent_start = date.fromisoformat(start_date_str)
            rent_end = date.fromisoformat(end_date_str)
        except ValueError:
            return jsonify({"error": "Invalid date format."}), 400
        
        if rent_start > rent_end:
            return jsonify({"error": "Start date cannot be after end date"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT seller_id, name FROM products WHERE id = %s", (product_id,))
        product_info = cur.fetchone()
        
        if not product_info:
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found"}), 404
            
        owner_id = product_info['seller_id']
        product_name = product_info['name']
        
        if int(renter_id) == owner_id:
            cur.close()
            conn.close()
            return jsonify({"error": "Cannot rent your own item"}), 400

        cur.execute("""
            SELECT id FROM rentals
            WHERE product_id = %s
            AND status IN ('pending', 'accepted')
            AND rent_start <= %s AND rent_end >= %s
        """, (product_id, rent_end, rent_start))
        
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Item is already booked for these dates."}), 409

        cur.execute("""
            INSERT INTO rentals (product_id, renter_id, owner_id, rent_start, rent_end) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING id
        """, (product_id, renter_id, owner_id, rent_start, rent_end))
        
        new_rental_id = cur.fetchone()['id']
        
        cur.execute("SELECT username FROM users WHERE id = %s", (renter_id,))
        renter_username = cur.fetchone()['username']
        message = f"New rental request for '{product_name}' from {renter_username}."
        create_notification(
            user_id=owner_id, 
            message=message, 
            event_type="rental_request", 
            conn=conn, 
            sender_id=renter_id,
            deep_link=f"/rentalrequests?id={new_rental_id}"
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Rental request sent successfully!", "id": new_rental_id}), 201
    except Exception as e:
        print(f"Rental Creation Error: {e}")
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/rentals/requests/<int:user_id>', methods=['GET'])
def fetch_rental_requests(user_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        query = """
            SELECT r.*, 
                p.name as product_name, p.image_url as product_image, p.price,
                u_renter.username as renter_name,
                u_owner.username as owner_name, p.seller_id as owner_id
            FROM rentals r
            JOIN products p ON r.product_id = p.id
            JOIN users u_renter ON r.renter_id = u_renter.id
            JOIN users u_owner ON p.seller_id = u_owner.id
            WHERE r.renter_id = %s OR p.seller_id = %s
            ORDER BY r.created_at DESC
        """
        cur.execute(query, (user_id, user_id))
        requests = cur.fetchall()
        
        cur.close()
        conn.close()
        
        for req in requests:
            if isinstance(req.get('rent_start'), date):
                req['rent_start'] = req['rent_start'].isoformat()
            if isinstance(req.get('rent_end'), date):
                req['rent_end'] = req['rent_end'].isoformat()
        
        return jsonify(requests), 200
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500
@app.route('/api/rentals/requests/<int:rental_id>/status', methods=['PUT'])
def update_rental_status(rental_id):
    conn = None
    try:
        data = request.json
        status = data.get('status')
        current_user_id_raw = data.get('current_user_id')
        reason = data.get('rejection_reason')
        
        current_user_id = int(current_user_id_raw) if current_user_id_raw and str(current_user_id_raw).lower() != 'null' else None

        if status not in ['pending', 'accepted', 'declined', 'cancelled', 'completed']:
            return jsonify({"error": "Invalid status value"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT r.renter_id, p.name, p.seller_id, r.product_id, r.rent_start, r.rent_end
            FROM rentals r
            JOIN products p ON r.product_id = p.id
            WHERE r.id = %s
        """, (rental_id,))
        rental_details = cur.fetchone()
        
        if not rental_details:
            return jsonify({"error": "Rental request not found"}), 404
            
        product_id = rental_details['product_id']
        renter_id = rental_details['renter_id']
        owner_id = rental_details['seller_id']
        product_name = rental_details['name']
        
        # Check permissions (Optional safety)
        if current_user_id and current_user_id != owner_id and current_user_id != renter_id:
             # Allow cancellation by renter, but mostly owner manages status
             if not (status == 'cancelled' and current_user_id == renter_id):
                 pass 

        # Update Status
        cur.execute("UPDATE rentals SET status = %s, comment = %s WHERE id = %s", (status, reason, rental_id))
        
        # Get Usernames for notifications
        cur.execute("SELECT username FROM users WHERE id = %s", (renter_id,))
        renter_username = cur.fetchone()['username']
        cur.execute("SELECT username FROM users WHERE id = %s", (owner_id,))
        owner_username = cur.fetchone()['username']

        should_rate = False
        rate_target_id = None
        rate_rater_id = None
        
        if status == 'accepted':
            msg = f"Your rental request for '{product_name}' was accepted by {owner_username}."
            create_notification(renter_id, msg, "rental_accepted", conn, current_user_id, f"/rentalrequests?id={rental_id}")
            cur.execute("UPDATE products SET status = 'rented' WHERE id = %s", (product_id,))
            
            cur.execute("""
                UPDATE rentals
                SET status = 'declined', comment = 'Item dates booked.'
                WHERE product_id = %s
                AND id != %s
                AND status = 'pending'
                AND NOT (rent_end < %s OR rent_start > %s)
            """, (product_id, rental_id, rental_details['rent_start'], rental_details['rent_end']))
            
        elif status == 'declined':
            msg = f"Your rental request for '{product_name}' was declined by {owner_username}."
            create_notification(renter_id, msg, "rental_declined", conn, current_user_id, f"/rentalrequests?id={rental_id}")

        elif status == 'cancelled':
            target_user_id = owner_id if current_user_id == renter_id else renter_id
            msg = f"Rental request for '{product_name}' was cancelled."
            create_notification(target_user_id, msg, "rental_cancelled", conn, current_user_id, f"/rentalrequests?id={rental_id}")
            
            cur.execute("SELECT status FROM products WHERE id = %s", (product_id,))
            product_stat = cur.fetchone()['status']
            if product_stat == 'rented':
                cur.execute("UPDATE products SET status = 'available' WHERE id = %s", (product_id,))

        elif status == 'completed':
            # Logic: Only Owner can mark as returned/completed.
            # So Owner rates Renter.
            
            # 1. Check if Owner already rated Renter
            cur.execute("""
                SELECT 1 FROM user_ratings
                WHERE rater_id = %s AND rated_user_id = %s AND transaction_type = 'rent' AND transaction_id = %s
            """, (owner_id, renter_id, rental_id))
            
            already_rated = cur.fetchone() is not None
            
            should_rate = not already_rated
            rate_target_id = renter_id # Owner rates Renter
            rate_rater_id = owner_id
            
            msg = f"Rental for '{product_name}' marked as returned. Transaction complete."
            create_notification(renter_id, msg, "rental_completed", conn, current_user_id)
            cur.execute("UPDATE products SET status = 'available' WHERE id = %s", (product_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": f"Rental status updated to {status}",
            "should_rate": should_rate,
            "rate_target_id": rate_target_id,
            "rate_type": "rent",
            "rate_trans_id": rental_id,
            "rater_id": rate_rater_id
        }), 200

    except Exception as e:
        if conn: conn.rollback(); conn.close()
        print(f"Status Update Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/swaps/requests/<int:swap_id>/status', methods=['PUT'])
def update_swap_status(swap_id):
    conn = None
    try:
        data = request.json
        status = data.get('status')
        rejection_reason = data.get('rejection_reason')
        current_user_id_raw = data.get('current_user_id')
        current_user_id = int(current_user_id_raw) if current_user_id_raw and str(current_user_id_raw).lower() != 'null' else None
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get Swap Details (Para makuha ang Requester ID at Owner ID)
        cur.execute("""
            SELECT s.requester_id, p.seller_id, p.name, s.product_id, u_owner.username as owner_name, u_req.username as req_name
            FROM swaps s
            JOIN products p ON s.product_id = p.id
            JOIN users u_owner ON p.seller_id = u_owner.id
            JOIN users u_req ON s.requester_id = u_req.id
            WHERE s.id = %s
        """, (swap_id,))
        swap_details = cur.fetchone()
        
        if not swap_details:
            return jsonify({"error": "Swap request not found"}), 404

        requester_id = swap_details['requester_id']
        owner_id = swap_details['seller_id']
        product_name = swap_details['name']
        product_id = swap_details['product_id']
        owner_username = swap_details['owner_name']
        requester_username = swap_details['req_name']
        
        # Update Status
        cur.execute("UPDATE swaps SET status = %s, rejection_reason = %s WHERE id = %s", (status, rejection_reason, swap_id))
        
        should_rate = False
        rate_target_id = None
        rate_rater_id = None
        
        # --- LOGIC HANDLING ---
        
        if status == 'accepted':
            # Notification to Requester (No Rating Yet)
            message = f"Your swap offer for '{product_name}' was accepted by {owner_username}."
            create_notification(requester_id, message, "swap_accepted", conn, current_user_id, f"/swaprequests?id={swap_id}")
            
            # Update Product Status
            cur.execute("UPDATE products SET status = 'swapped' WHERE id = %s", (product_id,))
            
            # Auto-reject others
            cur.execute("""
                UPDATE swaps
                SET status = 'rejected', rejection_reason = 'Item has been swapped with another offer.'
                WHERE product_id = %s AND id != %s AND status = 'pending'
            """, (product_id, swap_id))
            
        elif status == 'rejected':
            rejection_reason = rejection_reason if rejection_reason else "No reason given."
            message = f"Your swap offer for '{product_name}' was rejected by {owner_username}. Reason: {rejection_reason[:50]}"
            create_notification(requester_id, message, "swap_rejected", conn, current_user_id, f"/swaprequests?id={swap_id}")
            
        elif status == 'cancelled':
            message = f"Swap request for '{product_name}' was cancelled by {requester_username}."
            create_notification(owner_id, message, "swap_cancelled", conn, current_user_id, f"/swaprequests?id={swap_id}")

        elif status == 'completed':
            target_id = owner_id if current_user_id == requester_id else requester_id
            
            cur.execute("""
                SELECT 1 FROM user_ratings
                WHERE rater_id = %s AND rated_user_id = %s AND transaction_type = 'swap' AND transaction_id = %s
            """, (current_user_id, target_id, swap_id))
            
            already_rated = cur.fetchone() is not None

            should_rate = not already_rated
            rate_target_id = target_id
            rate_rater_id = current_user_id

            cur.execute("SELECT status FROM swaps WHERE id = %s", (swap_id,))
            current_db_status = cur.fetchone()['status']

            partner_id = owner_id if current_user_id == requester_id else requester_id
            msg = f"Swap for '{product_name}' marked as completed. Please rate your partner."
            create_notification(partner_id, msg, "swap_completed", conn, current_user_id)

        conn.commit()
        conn.close()
        
        return jsonify({
            "message": f"Swap status updated to {status}",
            "should_rate": should_rate,
            "rate_target_id": rate_target_id,
            "rate_type": "swap",
            "rate_trans_id": swap_id,
            "rater_id": rate_rater_id
        }), 200

    except Exception as e:
        if conn: conn.rollback(); conn.close()
        print(f"CRITICAL ERROR in Update Swap: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/swaps', methods=['POST'])
def create_swap():
    conn = None
    try:
        product_id = request.form.get('product_id')
        requester_id = request.form.get('requester_id')
        offered_item_id = request.form.get('offered_item_id')
        offer_description = request.form.get('offer_description', '')
        
        if offered_item_id == 'null' or offered_item_id == '':
            offered_item_id = None

        image_url = ""
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"swap_{requester_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_url = f"/static/uploads/{unique_filename}"

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT seller_id, name FROM products WHERE id = %s", (product_id,))
        product_info = cur.fetchone()
        owner_id = product_info['seller_id']
        product_name = product_info['name']
        
        cur.execute("""
            INSERT INTO swaps (product_id, offered_item_id, requester_id, offer_description, offer_image_url) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING id
        """, (product_id, offered_item_id, requester_id, offer_description, image_url))
        
        new_swap_id = cur.fetchone()['id']
        
        cur.execute("SELECT username FROM users WHERE id = %s", (requester_id,))
        requester_username = cur.fetchone()['username']
        message = f"New swap offer for '{product_name}' from {requester_username}."
        create_notification(
            user_id=owner_id, 
            message=message, 
            event_type="swap_request", 
            conn=conn, 
            sender_id=requester_id,
            deep_link=f"/swaprequests?id={new_swap_id}"
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Swap request sent successfully!"}), 201
    except Exception as e:
        print(f"Swap Error: {e}")
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/swaps/requests/<int:user_id>', methods=['GET'])
def get_swap_requests(user_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        query = """
            SELECT s.*, 
                p1.name as target_item_name, 
                p1.image_url as target_item_image, 
                p1.seller_id as target_owner_id,
                p1.availability as target_item_availability,
                u2.username as target_owner_name,
                p2.name as offered_item_name, 
                p2.image_url as offered_item_image,
                u.username as requester_name,
                
                EXISTS(
                    SELECT 1 FROM user_ratings 
                    WHERE rater_id = %s 
                    AND transaction_type = 'swap' 
                    AND transaction_id = s.id
                ) as has_rated

            FROM swaps s
            JOIN products p1 ON s.product_id = p1.id
            LEFT JOIN products p2 ON s.offered_item_id = p2.id
            JOIN users u ON s.requester_id = u.id
            JOIN users u2 ON p1.seller_id = u2.id
            WHERE p1.seller_id = %s OR s.requester_id = %s
            ORDER BY s.created_at DESC
        """
        cur.execute(query, (user_id, user_id, user_id))
        requests = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify(requests), 200
    except Exception as e:
        print(f"Error fetching swaps: {e}")
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500
@app.route('/api/users/send-otp', methods=['POST'])
@limiter.limit("5 per minute")
def send_otp():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        username = data.get('username')

        if not email or not email.endswith('@tup.edu.ph'):
            return jsonify({"error": "Only @tup.edu.ph emails are allowed."}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Email is already registered. Please Login."}), 400

        if username:
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                cur.close()
                conn.close()
                return jsonify({"error": "Username is already taken."}), 400

        otp_code = str(random.randint(100000, 999999))
        
        cur.execute("""
            INSERT INTO otps (email, code) VALUES (%s, %s)
            ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = (NOW() + INTERVAL '5 minutes');
        """, (email, otp_code))
        conn.commit()
        
        smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        sender_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)

        if smtp_username and smtp_password:
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"{otp_code} is your TUPulse Verification Code"
                msg['From'] = f"TUPulse <{sender_email}>"
                msg['To'] = email

                html_content = f"""
                <html>
                    <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                        .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #8B0000, #C90000); padding: 30px; text-align: center; color: white; }}
                        .header h1 {{ margin: 0; font-size: 28px; letter-spacing: 2px; }}
                        .content {{ padding: 30px; text-align: center; color: #333333; }}
                        .otp-box {{ background-color: #fbecec; border: 2px dashed #C90000; color: #C90000; font-size: 36px; font-weight: bold; padding: 20px; margin: 20px 0; letter-spacing: 8px; border-radius: 8px; }}
                        .footer {{ background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #777777; }}
                    </style>
                    </head>
                    <body>
                        <div class="container">
                        <div class="header"><h1>TUPulse</h1></div>
                        <div class="content">
                            <h2>Confirm your email address</h2>
                            <p>Use this code to verify your account:</p>
                            <div class="otp-box">{otp_code}</div>
                            <p>This code expires in 5 minutes.</p>
                        </div>
                        <div class="footer">&copy; 2025 TUPulse. Technological University of the Philippines.</div>
                        </div>
                    </body>
                </html>
                """
                
                part2 = MIMEText(html_content, 'html')
                msg.attach(part2)

                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    if os.getenv('MAIL_USE_TLS') == 'True':
                        server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
                    
                    return jsonify({"message": "OTP sent successfully"}), 200
                
            except Exception as e:
                print(f"Email Error: {e}")
                print(f"[FALLBACK] OTP for {email}: {otp_code}")
                return jsonify({"message": "OTP Generated (Email Failed - Check Console)"}), 200
        else:
            print(f"[DEV MODE] OTP for {email}: {otp_code}")
            return jsonify({"message": "OTP sent (Dev Mode)"}), 200

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/verify-otp', methods=['POST'])
def verify_otp():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        code = data.get('otp')
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("SELECT * FROM otps WHERE email = %s AND code = %s AND expires_at > NOW()", (email, code))
        result = cur.fetchone()
        cur.close()
        conn.close()
        if result:
            return jsonify({"message": "OTP Verified"}), 200
        else:
            return jsonify({"error": "Invalid or expired OTP"}), 400
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/register', methods=['POST'])
def register():
    conn = None
    try:
        data = request.json
        username = data.get('name')
        email = data.get('email')
        password = data.get('password')
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        try:
            cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)", (username, email, hashed_pw))
            conn.commit()
            return jsonify({"message": "User created successfully"}), 201
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return jsonify({"error": "Email already exists"}), 400
        finally:
            cur.close()
            if conn:
                conn.close()
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login', methods=['POST'])
def login():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close(); conn.close()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            token = jwt.encode({'user_id': user['id'], 'username': user['username']}, SECRET_KEY, algorithm="HS256")
            return jsonify({'token': token, 'user_id': user['id'], 'username': user['username']}), 200
        else:
            return jsonify({"error": "Invalid"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/users/login-initiate', methods=['POST'])
def login_initiate():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            otp_code = str(random.randint(100000, 999999))
            
            cur.execute("""
                INSERT INTO otps (email, code) VALUES (%s, %s)
                ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = (NOW() + INTERVAL '5 minutes');
            """, (email, otp_code))
            conn.commit()
            
            smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('MAIL_PORT', 587))
            smtp_username = os.getenv('MAIL_USERNAME')
            smtp_password = os.getenv('MAIL_PASSWORD')
            sender_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)

            if smtp_username and smtp_password:
                try:
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = f"{otp_code} is your Login Code"
                    msg['From'] = f"TUPulse <{sender_email}>"
                    msg['To'] = email
                    html_content = f"""
                    <div style="font-family: Arial; padding: 20px; text-align: center; border: 1px solid #ddd;">
                        <h2>Login Verification</h2>
                        <p>Use this code to complete your login:</p>
                        <h1 style="color: #8B0000; letter-spacing: 5px;">{otp_code}</h1>
                        <p>This code expires in 5 minutes.</p>
                    </div>
                    """
                    msg.attach(MIMEText(html_content, 'html'))
                    
                    with smtplib.SMTP(smtp_server, smtp_port) as server:
                        if os.getenv('MAIL_USE_TLS') == 'True':
                            server.starttls()
                        server.login(smtp_username, smtp_password)
                        server.send_message(msg)
                except Exception as e:
                    print(f"Email Error: {e}")
                        
            cur.close()
            conn.close()
            return jsonify({"message": "Credentials valid. OTP sent."}), 200
        else:
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login-verify', methods=['POST'])
def login_verify():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT * FROM otps WHERE email = %s AND code = %s AND expires_at > NOW()", (email, otp))
        result = cur.fetchone()
        
        if result:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            token = jwt.encode({
                'user_id': user['id'],
                'username': user['username'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "token": token,
                "username": user['username'],
                "user_id": user['id'],
                "message": "Login successful"
            }), 200
        else:
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid or expired OTP code"}), 400
            
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/forgot-password-otp', methods=['POST'])
def forgot_password_otp():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return jsonify({"error": "Email not found. Please register."}), 404

        otp_code = str(random.randint(100000, 999999))
        
        cur.execute("""
            INSERT INTO otps (email, code) VALUES (%s, %s)
            ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = (NOW() + INTERVAL '5 minutes');
        """, (email, otp_code))
        conn.commit()
        
        smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        sender_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)

        if smtp_username and smtp_password:
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"{otp_code} is your Reset Code"
                msg['From'] = f"TUPulse <{sender_email}>"
                msg['To'] = email
                html_content = f"""
                <div style="font-family: Arial; padding: 20px; text-align: center; border: 1px solid #ddd;">
                    <h2>Reset Password Request</h2>
                    <p>Use this code to reset your password:</p>
                    <h1 style="color: #8B0000; letter-spacing: 5px;">{otp_code}</h1>
                    <p>If you didn't request this, ignore this email.</p>
                </div>
                """
                msg.attach(MIMEText(html_content, 'html'))
                
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    if os.getenv('MAIL_USE_TLS') == 'True':
                        server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
            except Exception as e:
                print(f"Email Error: {e}")
        
        cur.close()
        conn.close()
        return jsonify({"message": "Reset code sent."}), 200

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/reset-password-confirm', methods=['POST'])
def reset_password_confirm():
    conn = None
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')
        
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        cur.execute("SELECT * FROM otps WHERE email = %s AND code = %s AND expires_at > NOW()", (email, otp))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid or expired OTP"}), 400
            
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed_pw, email))
        conn.commit()
        
        cur.execute("DELETE FROM otps WHERE email = %s", (email,))
        conn.commit()
        
        cur.close()
        conn.close()
        return jsonify({"message": "Password reset successful!"}), 200

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart', methods=['GET'])
def get_cart_items():
    conn = None
    try:
        user_id = request.args.get('user_id')
        if not user_id: return jsonify({"error": "User ID is required"}), 400

        conn = get_db_connection()
        if not conn: return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        query = """
            SELECT c.id as cart_id, c.quantity, p.id as product_id, p.name, p.price, 
                p.image_url as img, p.listing_type as type, p.seller_id, u.username as seller_name
            FROM cart c
            JOIN products p ON c.product_id = p.id
            JOIN users u ON p.seller_id = u.id
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
        """
        cur.execute(query, (user_id,))
        items = cur.fetchall()
        
        formatted_items = []
        for item in items:
            formatted_items.append({
                "id": item.get('cart_id'), 
                "cart_id": item.get('cart_id'),
                "product_id": item.get('product_id'),
                "name": item.get('name'),
                "price": float(item.get('price', 0)),
                "img": item.get('img'), 
                "quantity": item.get('quantity'),
                "type": item.get('type'),
                "seller_id": item.get('seller_id'),
                "seller_name": item.get('seller_name')
            })
            
        cur.close(); conn.close()
        return jsonify(formatted_items), 200
    except Exception as e:
        print(f"Cart GET Error: {e}")
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    conn = None
    try:
        data = request.json
        
        user_id = data.get('user_id')
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)

        if not user_id or not product_id:
            return jsonify({"error": "Missing user_id or product_id"}), 400

        conn = get_db_connection()
        if not conn: return jsonify({"error": "DB Fail"}), 500
        cur = conn.cursor()

        cur.execute("SELECT id, quantity FROM cart WHERE user_id = %s AND product_id = %s", (user_id, product_id))
        existing_item = cur.fetchone()

        if existing_item:
            new_quantity = existing_item['quantity'] + quantity
            cur.execute("UPDATE cart SET quantity = %s WHERE id = %s", (new_quantity, existing_item['id']))
        else:
            cur.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)", (user_id, product_id, quantity))

        conn.commit(); cur.close(); conn.close()
        return jsonify({"message": "Item added to cart"}), 201
    except Exception as e:
        print(f"Cart POST Error: {e}")
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/<int:product_id>', methods=['PUT'])
def update_cart_quantity(product_id):
    conn = None
    try:
        data = request.json
        user_id = data.get('user_id')
        quantity = data.get('quantity')

        if not user_id or quantity is None or quantity < 1:
            return jsonify({"error": "Invalid request"}), 400

        conn = get_db_connection()
        if not conn: return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("UPDATE cart SET quantity = %s WHERE user_id = %s AND product_id = %s", (quantity, user_id, product_id))
        conn.commit(); cur.close(); conn.close()

        return jsonify({"message": "Cart updated"}), 200
    except Exception as e:
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/<int:product_id>', methods=['DELETE'])
def remove_from_cart(product_id):
    conn = None
    try:
        user_id = request.args.get('user_id') 
        if not user_id: return jsonify({"error": "User ID required"}), 400

        conn = get_db_connection()
        if not conn: return jsonify({"error": "DB Fail"}), 500
        cur = conn.cursor()
        
        cur.execute("DELETE FROM cart WHERE user_id = %s AND product_id = %s", (user_id, product_id))
        conn.commit(); cur.close(); conn.close()

        return jsonify({"message": "Item removed"}), 200
    except Exception as e:
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/users/profile-image', methods=['POST'])
def upload_profile_image():
    conn = None
    try:
        user_id = request.form.get('user_id')
        if not user_id: return jsonify({"error": "User ID required"}), 400

        if 'image' not in request.files: return jsonify({"error": "No file"}), 400
        file = request.files['image']
        if file.filename == '': return jsonify({"error": "No selected file"}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"profile_{user_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            image_url = f"/static/uploads/{unique_filename}"

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET profile_image = %s WHERE id = %s", (image_url, user_id))
            conn.commit()
            cur.close(); conn.close()
            return jsonify({"message": "Profile updated", "image_url": image_url}), 200
        else:
            return jsonify({"error": "File type not allowed"}), 400
    except Exception as e:
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = None
    try:
        current_user_id = request.args.get('current_user_id') 
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id, username, email, bio, profile_image, course, year_level FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            cur.close(); conn.close()
            return jsonify({"error": "User not found"}), 404
        
        cur.execute("SELECT count(*) FROM user_relationships WHERE followed_id = %s", (user_id,))
        followers_count = cur.fetchone()['count']
        
        cur.execute("SELECT count(*) FROM user_relationships WHERE follower_id = %s", (user_id,))
        following_count = cur.fetchone()['count']
        
        is_following = False
        if current_user_id and current_user_id.isdigit() and int(current_user_id) != user_id:
            viewer_id = int(current_user_id) 
            
            cur.execute("""
                SELECT 1 FROM user_relationships 
                WHERE follower_id = %s AND followed_id = %s
            """, (viewer_id, user_id)) 
            is_following = cur.fetchone() is not None
            
        cur.close(); conn.close()

        user['followers'] = followers_count
        user['following'] = following_count
        user['is_following'] = is_following
        
        return jsonify(user), 200
        
    except Exception as e:
        if conn: conn.close()
        print(f"Profile Fetch Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/follow', methods=['POST'])
def follow_user():
    conn = None
    try:
        data = request.json
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        if not follower_id or not followed_id:
            return jsonify({"error": "Missing IDs"}), 400
        
        if int(follower_id) == int(followed_id):
            return jsonify({"error": "Cannot follow yourself"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM user_relationships WHERE follower_id = %s AND followed_id = %s", (int(follower_id), int(followed_id)))
        if cur.fetchone():
            conn.close()
            return jsonify({"message": "Already following"}), 200

        cur.execute("""
            INSERT INTO user_relationships (follower_id, followed_id)
            VALUES (%s, %s)
        """, (int(follower_id), int(followed_id)))
        
        cur.execute("SELECT username FROM users WHERE id = %s", (int(follower_id),))
        follower_name = cur.fetchone()['username']
        create_notification(int(followed_id), f"{follower_name} started following you.", "new_follower", conn, int(follower_id), f'/user-ratings/{followed_id}')

        conn.commit()
        cur.close(); conn.close()
        return jsonify({"message": "Followed successfully"}), 201

    except Exception as e:
        if conn: conn.close()
        print(f"Follow Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/unfollow', methods=['DELETE'])
def unfollow_user():
    conn = None
    try:
        data = request.json
        follower_id = data.get('follower_id')
        followed_id = data.get('followed_id')
        
        if not follower_id or not followed_id:
            return jsonify({"error": "Missing IDs"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete relationship (CRITICAL FIX: Use int())
        cur.execute("""
            DELETE FROM user_relationships 
            WHERE follower_id = %s AND followed_id = %s
        """, (int(follower_id), int(followed_id)))

        conn.commit()
        cur.close(); conn.close()
        return jsonify({"message": "Unfollowed successfully"}), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Unfollow Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_details(product_id):
    conn = None
    try:
        conn = get_db_connection()
        if not conn: return jsonify({"error": "DB Error"}), 500

        cur = conn.cursor()
        
        # Select specific product by ID
        query = """
            SELECT p.*, u.username as seller_name, u.profile_image as seller_image
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.id = %s
        """
        cur.execute(query, (product_id,))
        product = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if product:
            return jsonify(product), 200
        else:
            return jsonify({"error": "Product not found"}), 404

    except Exception as e:
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/messages', methods=['POST'])
def send_message():
    conn = None
    try:
        # Use request.form to safely access data sent via FormData
        sender_id = request.form.get('sender_id')
        receiver_id = request.form.get('receiver_id')
        message_text = request.form.get('message', '').strip() 
        product_id = request.form.get('product_id')
        
        if not sender_id or not receiver_id:
            return jsonify({"error": "Missing sender or receiver ID"}), 400

        # Check if the user is sending their own ID to themselves (optional guardrail)
        if int(sender_id) == int(receiver_id):
            return jsonify({"error": "Cannot send message to yourself."}), 400

        image_url = None
        # Check for file upload
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"chat_{sender_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_url = f"/static/uploads/{unique_filename}"

        # CRITICAL CHECK: Ensure there is content (text or image)
        if not message_text and not image_url:
            return jsonify({"error": "Message content cannot be empty."}), 400
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        # SQL execution
        cur.execute("""
            INSERT INTO messages (sender_id, receiver_id, message, product_id, image_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at, image_url, message
        """, (sender_id, receiver_id, message_text, product_id, image_url))
        
        new_msg = cur.fetchone()
        conn.commit()
        
        # Notify Receiver
        cur.execute("SELECT username FROM users WHERE id = %s", (sender_id,))
        sender_name = cur.fetchone()['username']
        
        notif_msg = f"New message from {sender_name}"
        create_notification(receiver_id, notif_msg, "new_message", conn, sender_id, f"/chat?user={sender_id}")
        
        cur.close()
        conn.close()
        
        # FIXED: Ensure we return the correct fields expected by the frontend
        return jsonify({
            "message": "Sent",
            "id": new_msg['id'],
            "message_sent": new_msg['message'],
            "image_url": new_msg['image_url'],
            "created_at": new_msg['created_at'].isoformat()
        }), 201

    except Exception as e:
        print(f"Chat Send Error: {e}")
        traceback.print_exc()
        
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/messages/threads/<int:user_id>', methods=['GET'])
def get_chat_threads(user_id):
    conn = None
    try:
        search_query = request.args.get('q', '')
        
        conn = get_db_connection()
        if not conn:
            # FIXED: Always return response if connection fails
            return jsonify({"error": "Database connection failed"}), 500 
            
        cur = conn.cursor()
        
        threads_query = """
            WITH latest_messages AS (
                SELECT
                    CASE
                        WHEN sender_id = %s THEN receiver_id
                        ELSE sender_id
                    END AS partner_id,
                    message,
                    created_at,
                    is_read,
                    sender_id,
                    ROW_NUMBER() OVER (PARTITION BY CASE WHEN sender_id = %s THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
                FROM messages
                WHERE sender_id = %s OR receiver_id = %s
            )
            SELECT
                lm.partner_id,
                u.username AS partner_name,
                u.profile_image AS partner_image,
                lm.message AS last_message,
                lm.created_at AS last_message_time,
                lm.is_read,
                lm.sender_id AS last_sender_id
            FROM latest_messages lm
            JOIN users u ON u.id = lm.partner_id
            WHERE lm.rn = 1
        """
        cur.execute(threads_query, (user_id, user_id, user_id, user_id))
        threads = cur.fetchall()

        all_results = threads
        existing_partner_ids = [t['partner_id'] for t in threads]
        
        if search_query:
            search_pattern = '%' + search_query + '%'
            
            exclude_ids = existing_partner_ids if existing_partner_ids else [-1] 

            new_contacts_query = """
                SELECT
                    id AS partner_id,
                    username AS partner_name,
                    profile_image AS partner_image,
                    NULL as last_message,
                    NULL as last_message_time,
                    TRUE as is_read,
                    NULL as last_sender_id
                FROM users
                WHERE (username ILIKE %s OR email ILIKE %s)
                AND id != %s
                AND id NOT IN (SELECT unnest(%s::int[]))
                ORDER BY username
                LIMIT 10
            """
            
            cur.execute(new_contacts_query, (search_pattern, search_pattern, user_id, exclude_ids))
            new_contacts = cur.fetchall()

            all_results.extend(new_contacts)
        
        # 3. Final Sorting
        all_results.sort(key=lambda x: x['last_message_time'] if x['last_message_time'] else datetime.datetime.min, reverse=True)
        
        # 4. Format Date
        for t in all_results:
            if t['last_message_time']:
                t['last_message_time'] = t['last_message_time'].isoformat()
            
        cur.close()
        conn.close()
        
        # FIXED: Final return statement
        return jsonify(all_results), 200
        
    except Exception as e:
        # Print the error for debugging
        print(f"Thread Error: {e}")
        if conn: conn.close()
        # FIXED: Laging may error return
        return jsonify({"error": str(e)}), 500
@app.route('/api/messages/thread/<int:other_user_id>', methods=['GET'])
def get_thread_messages(other_user_id):
    conn = None
    try:
        current_user_id = request.args.get('current_user_id')
        if not current_user_id:
            return jsonify({"error": "Current user ID required"}), 400
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE messages SET is_read = TRUE 
            WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE
        """, (other_user_id, current_user_id))
        conn.commit()
        
        cur.execute("""
            SELECT m.*, u.username as sender_name, u.profile_image as sender_image
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = %s AND m.receiver_id = %s)
            OR (m.sender_id = %s AND m.receiver_id = %s)
            ORDER BY m.created_at ASC
        """, (current_user_id, other_user_id, other_user_id, current_user_id))
        
        messages = cur.fetchall()
        
        for m in messages:
            m['created_at'] = m['created_at'].isoformat()
            
        cur.close(); conn.close()
        return jsonify(messages), 200
        
    except Exception as e:
        if conn: conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/ratings', methods=['POST'])
def submit_rating():
    conn = None
    try:
        data = request.json
        rater_id = data.get('rater_id')
        rated_user_id = data.get('rated_user_id')
        transaction_type = data.get('transaction_type')
        transaction_id = data.get('transaction_id')
        rating = data.get('rating')
        review_text = data.get('review_text')

        if not all([rater_id, rated_user_id, transaction_type, transaction_id, rating]):
            return jsonify({"error": "Missing required fields"}), 400
        
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 1 FROM user_ratings 
            WHERE rater_id = %s AND transaction_type = %s AND transaction_id = %s
        """, (int(rater_id), transaction_type, int(transaction_id)))
        
        if cur.fetchone():
            conn.close()
            return jsonify({"error": "You have already rated this transaction."}), 409

        cur.execute("""
            INSERT INTO user_ratings (rater_id, rated_user_id, transaction_type, transaction_id, rating, review_text)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (int(rater_id), int(rated_user_id), transaction_type, int(transaction_id), rating, review_text))

        cur.execute("SELECT username FROM users WHERE id = %s", (int(rater_id),))
        rater_name = cur.fetchone()['username']
        
        create_notification(
            rated_user_id, 
            f"{rater_name} rated your service.", 
            "new_rating", 
            conn, 
            int(rater_id), 
            f'/user-ratings/{rated_user_id}' 
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Rating submitted successfully"}), 201

    except Exception as e:
        if conn: conn.close()
        print(f"Rating Submission Error: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/ratings/<int:rating_id>/react', methods=['PUT'])
def react_to_rating(rating_id):
    conn = None
    try:
        data = request.json
        reaction_type = data.get('type') # 'like' or 'dislike'
        
        conn = get_db_connection()
        cur = conn.cursor()

        # Logic: Increment the count in the database
        if reaction_type == 'like':
            cur.execute("UPDATE user_ratings SET likes = COALESCE(likes, 0) + 1 WHERE id = %s RETURNING likes, dislikes", (rating_id,))
        elif reaction_type == 'dislike':
            cur.execute("UPDATE user_ratings SET dislikes = COALESCE(dislikes, 0) + 1 WHERE id = %s RETURNING likes, dislikes", (rating_id,))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/transactions/<int:transaction_id>/complete', methods=['PUT'])
def markTransactionCompleted(transaction_id):
    conn = None
    try:
        
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT t.user_id as buyer_id, ti.seller_id
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            WHERE t.id = %s
            LIMIT 1
        """, (transaction_id,))
        
        transaction_data = cur.fetchone()
        if not transaction_data:
            return jsonify({"error": "Transaction not found"}), 404

        buyer_id = transaction_data['buyer_id']
        seller_id = transaction_data['seller_id']

        cur.execute("UPDATE transactions SET status = 'completed' WHERE id = %s", (transaction_id,))
        
        cur.execute("""
            SELECT 1 FROM user_ratings
            WHERE rater_id = %s AND rated_user_id = %s AND transaction_type = 'sell' AND transaction_id = %s
        """, (buyer_id, seller_id, transaction_id))
        
        already_rated = cur.fetchone() is not None
        
        conn.commit()
        conn.close()

        return jsonify({
            "message": "Transaction marked completed.",
            "should_rate": not already_rated, 
            "rate_target_id": seller_id,
            "rate_type": "sell",
            "rate_trans_id": transaction_id,
            "rater_id": buyer_id
        }), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Completion Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:user_id>/ratings/average', methods=['GET'])
def get_user_average_rating_api(user_id): 
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                AVG(rating) AS average_rating, 
                COUNT(id) AS total_reviews
            FROM user_ratings 
            WHERE rated_user_id = %s
        """, (user_id,))
        
        result = cur.fetchone()
        
        conn.close()
        
        return jsonify({
            "average_rating": float(result['average_rating']) if result['average_rating'] else 0.0,
            "total_reviews": result['total_reviews']
        }), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Average Rating Fetch Error: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/users/<int:user_id>/reviews/all', methods=['GET'])
def get_all_user_reviews(user_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                ur.rating, 
                ur.review_text, 
                ur.created_at,
                u_rater.username AS rater_name,
                u_rater.profile_image AS rater_profile_image,
                ur.transaction_type,
                ur.transaction_id
            FROM user_ratings ur
            JOIN users u_rater ON ur.rater_id = u_rater.id
            WHERE ur.rated_user_id = %s
            ORDER BY ur.created_at DESC
        """, (user_id,))
        
        reviews = cur.fetchall()
        
        for review in reviews:
            if review['created_at']:
                review['created_at'] = review['created_at'].isoformat()
        
        cur.close(); conn.close()
        
        return jsonify(reviews), 200

    except Exception as e:
        if conn: conn.close()
        print(f"All Reviews Fetch Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/settings/profile', methods=['PUT'])
def update_user_settings():
    conn = None
    try:

        data = request.json
        user_id = data.get('user_id')
        username = data.get('username')
        bio = data.get('bio')
        course = data.get('course')
        year_level = data.get('year_level')

        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE users 
            SET username = %s, bio = %s, course = %s, year_level = %s
            WHERE id = %s
        """, (username, bio, course, year_level, user_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Settings Update Error: {e}")
        return jsonify({"error": str(e)}), 500


 
@app.route('/api/settings/request-password-change', methods=['POST'])
def request_password_change_otp():
    conn = None
    try:
        data = request.json
        user_id = data.get('userId')
        current_password = data.get('currentPassword')

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cur = conn.cursor()

        # 1. Verify User, Current Password AND Get Email from DB
        cur.execute("SELECT email, password_hash FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

        if not user:
            cur.close(); conn.close()
            return jsonify({"message": "User not found"}), 404

        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            cur.close(); conn.close()
            return jsonify({"message": "Incorrect current password"}), 401
            
        registered_email = user['email']

        otp_code = str(random.randint(100000, 999999))

        cur.execute("""
            INSERT INTO otps (email, code) VALUES (%s, %s)
            ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = (NOW() + INTERVAL '5 minutes');
        """, (registered_email, otp_code))
        conn.commit()

        smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        sender_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)

        if smtp_username and smtp_password:
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"{otp_code} is your Security Code"
                msg['From'] = f"TUPulse <{sender_email}>"
                msg['To'] = registered_email 
                html_content = f"""
                <div style="font-family: Arial; padding: 20px; text-align: center; border: 1px solid #ddd;">
                    <h2>Security Verification</h2>
                    <p>You requested to change your password. Use this code to proceed:</p>
                    <h1 style="color: #8B0000; letter-spacing: 5px;">{otp_code}</h1>
                    <p>If this wasn't you, please secure your account immediately.</p>
                </div>
                """
                msg.attach(MIMEText(html_content, 'html'))
                
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    if os.getenv('MAIL_USE_TLS') == 'True':
                        server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
            except Exception as e:
                print(f"Email Error: {e}")
                cur.close(); conn.close()
                return jsonify({"message": "Failed to send email"}), 500
        
        cur.close(); conn.close()
        return jsonify({"message": "OTP sent successfully"}), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Request Pass Change Error: {e}")
        return jsonify({"message": str(e)}), 500
@app.route('/api/settings/confirm-password-change', methods=['POST'])
def confirm_password_change_otp():
    conn = None
    try:
        data = request.json
        user_id = data.get('userId')
        otp_input = data.get('otp')
        new_password = data.get('newPassword')

        if len(new_password) < 8:
             return jsonify({"message": "Password must be at least 8 characters"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Get User Email first (need email to check OTP table)
        cur.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_data = cur.fetchone()
        
        if not user_data:
            cur.close(); conn.close()
            return jsonify({"message": "User not found"}), 404
            
        email = user_data['email']

        # 2. Verify OTP
        cur.execute("SELECT * FROM otps WHERE email = %s AND code = %s AND expires_at > NOW()", (email, otp_input))
        if not cur.fetchone():
            cur.close(); conn.close()
            return jsonify({"message": "Invalid or expired OTP"}), 400

        # 3. Update Password
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed_pw, user_id))
        
        # 4. Delete used OTP
        cur.execute("DELETE FROM otps WHERE email = %s", (email,))
        
        conn.commit()
        cur.close(); conn.close()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        if conn: conn.close()
        print(f"Confirm Pass Change Error: {e}")
        return jsonify({"message": str(e)}), 500  
if __name__ == '__main__':
    app.run(debug=True, port=5000)