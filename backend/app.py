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
import datetime
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration for Image Uploads
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
            conn = psycopg2.connect(db_url, sslmode='require', cursor_factory=RealDictCursor)
        else:
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

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_tables():
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            
            # Users Table (UPDATED: Added profile fields)
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
            
            # OTP Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS otps (
                    email VARCHAR(100) PRIMARY KEY,
                    code VARCHAR(6) NOT NULL,
                    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
                );
            """)

            # Products Table
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

            # Rentals Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rentals (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id),
                    renter_id INTEGER REFERENCES users(id),
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Swaps Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS swaps (
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
            print("Tables initialized successfully.")
        except Exception as e:
            print(f"Error initializing tables: {e}")

init_tables() 

# Route to Serve Uploaded Images
@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ==========================================
#  PROFILE ROUTES (NEW ADDITION)
# ==========================================

@app.route('/api/users/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user details
        cur.execute("SELECT id, username, email, bio, profile_image, course, year_level, created_at FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        # Get user's posts count
        cur.execute("SELECT COUNT(*) as count FROM products WHERE seller_id = %s", (user_id,))
        post_count = cur.fetchone()['count']
        
        user['post_count'] = post_count
        
        cur.close()
        conn.close()
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/profile', methods=['PUT'])
def update_profile():
    try:
        # Get ID from form data
        user_id = request.form.get('user_id')
        bio = request.form.get('bio')
        course = request.form.get('course')
        year_level = request.form.get('year_level')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401

        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"profile_{user_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_url = f"/static/uploads/{unique_filename}"

        conn = get_db_connection()
        cur = conn.cursor()
        
        if image_url:
            cur.execute("""
                UPDATE users 
                SET bio = %s, course = %s, year_level = %s, profile_image = %s
                WHERE id = %s
            """, (bio, course, year_level, image_url, user_id))
        else:
             cur.execute("""
                UPDATE users 
                SET bio = %s, course = %s, year_level = %s
                WHERE id = %s
            """, (bio, course, year_level, user_id))
            
        conn.commit()
        
        # Return updated info
        cur.execute("SELECT id, username, email, bio, profile_image, course, year_level FROM users WHERE id = %s", (user_id,))
        updated_user = cur.fetchone()
        
        cur.close()
        conn.close()
        return jsonify({"message": "Profile updated!", "user": updated_user}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# ==========================================
#  PRODUCT ROUTES
# ==========================================

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category')
        condition = request.form.get('condition')
        availability = request.form.get('availability')
        listing_type = request.form.get('listing_type', 'sell')
        
        seller_id = request.form.get('seller_id') 

        image_url = ""
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{datetime.datetime.now().timestamp()}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
                image_url = f"/static/uploads/{unique_filename}"

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT username FROM users WHERE id = %s", (seller_id,))
        seller = cur.fetchone()
        seller_name = seller['username'] if seller else "Unknown"

        cur.execute("""
            INSERT INTO products (seller_id, name, description, price, category, condition, availability, image_url, listing_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (seller_id, name, description, price, category, condition, availability, image_url, listing_type))
        
        new_product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Product posted successfully!",
            "product": {
                "id": new_product['id'],
                "name": name,
                "image": image_url,
                "seller": seller_name
            }
        }), 201

    except Exception as e:
        print(f"Error posting product: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT p.*, u.username as seller_name 
            FROM products p
            JOIN users u ON p.seller_id = u.id
            ORDER BY p.created_at DESC
        """
        cur.execute(query)
        products = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
#  RENTAL & SWAP ROUTES
# ==========================================

@app.route('/api/rentals', methods=['POST'])
def create_rental():
    try:
        data = request.json
        product_id = data.get('product_id')
        renter_id = data.get('renter_id')
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO rentals (product_id, renter_id) VALUES (%s, %s) RETURNING id", (product_id, renter_id))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Rental request sent successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/swaps', methods=['POST'])
def create_swap():
    try:
        data = request.json
        product_id = data.get('product_id')
        requester_id = data.get('requester_id')
        offer_description = data.get('offer_description', 'No specific offer details')
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO swaps (product_id, requester_id, offer_description) VALUES (%s, %s, %s) RETURNING id", (product_id, requester_id, offer_description))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Swap request sent successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
#  USER ROUTES (EXISTING)
# ==========================================

@app.route('/api/users/send-otp', methods=['POST'])
@limiter.limit("5 per minute")
def send_otp():
    try:
        data = request.json
        email = data.get('email')
        username = data.get('username')

        if not email or not email.endswith('@tup.edu.ph'):
            return jsonify({"error": "Only @tup.edu.ph emails are allowed."}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database error"}), 500
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
                
                print(f"HTML Email sent to {email}")
                return jsonify({"message": "OTP sent successfully"}), 200
            
            except Exception as e:
                print(f"Email Error: {e}")
                print(f" [FALLBACK] OTP for {email}: {otp_code}")
                return jsonify({"message": "OTP Generated (Email Failed - Check Console)"}), 200
        else:
            print(f" [DEV MODE] OTP for {email}: {otp_code}")
            return jsonify({"message": "OTP sent (Dev Mode)"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        code = data.get('otp')
        conn = get_db_connection()
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
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('name')
        email = data.get('email')
        password = data.get('password')
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
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
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
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
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login-initiate', methods=['POST'])
def login_initiate():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
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
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/login-verify', methods=['POST'])
def login_verify():
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        
        conn = get_db_connection()
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
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/forgot-password-otp', methods=['POST'])
def forgot_password_otp():
    try:
        data = request.json
        email = data.get('email')
        
        conn = get_db_connection()
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
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/reset-password-confirm', methods=['POST'])
def reset_password_confirm():
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')
        
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

        conn = get_db_connection()
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
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)