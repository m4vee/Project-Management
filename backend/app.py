from flask import Flask, request, jsonify
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

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
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

def init_tables():
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
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
            conn.commit()
            cur.close()
            conn.close()
            print("Tables initialized successfully.")
        except Exception as e:
            print(f"Error initializing tables: {e}")

init_tables() 

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
        cur.close()
        conn.close()
        
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
        print(f"Server Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        code = data.get('otp')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT * FROM otps 
            WHERE email = %s AND code = %s AND expires_at > NOW()
        """, (email, code))
        
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

        if not email or not email.endswith('@tup.edu.ph'):
            return jsonify({"error": "Invalid email domain"}), 400
        
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)", 
                        (username, email, hashed_pw))
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
                            <h2>Login Verification</h2>
                            <p>Use this code to complete your login:</p>
                            <div class="otp-box">{otp_code}</div>
                            <p>This code expires in 5 minutes.</p>
                          </div>
                          <div class="footer">&copy; 2025 TUPulse. Technological University of the Philippines.</div>
                        </div>
                      </body>
                    </html>
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
                        <h2>Reset Password Request</h2>
                        <p>Use this code to reset your password:</p>
                        <div class="otp-box">{otp_code}</div>
                        <p>If you didn't request this, ignore this email.</p>
                      </div>
                      <div class="footer">&copy; 2025 TUPulse. Technological University of the Philippines.</div>
                    </div>
                  </body>
                </html>
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