from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from server import get_db_connection
from utils.email import generate_otp, send_otp_email
from datetime import datetime, timedelta

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Send OTP to email for registration"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check if email already exists
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT email FROM Users WHERE email = %s', (email,))
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Generate OTP
        otp_code = generate_otp()
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Delete old OTPs for this email
        cur.execute('DELETE FROM OTP_Verification WHERE email = %s', (email,))
        
        # Store OTP in database
        cur.execute(
            'INSERT INTO OTP_Verification (email, otp_code, expires_at) VALUES (%s, %s, %s)',
            (email, otp_code, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        # Send email
        if send_otp_email(email, otp_code):
            return jsonify({'message': 'OTP sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send email'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP code"""
    try:
        data = request.get_json()
        email = data.get('email')
        otp_code = data.get('otp_code')
        
        if not email or not otp_code:
            return jsonify({'error': 'Email and OTP code are required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check OTP
        cur.execute(
            'SELECT * FROM OTP_Verification WHERE email = %s AND otp_code = %s AND is_verified = FALSE',
            (email, otp_code)
        )
        otp_record = cur.fetchone()
        
        if not otp_record:
            cur.close()
            conn.close()
            return jsonify({'error': 'Invalid OTP code'}), 400
        
        # Check if expired
        if datetime.now() > otp_record['expires_at']:
            cur.close()
            conn.close()
            return jsonify({'error': 'OTP has expired'}), 400
        
        # Mark as verified
        cur.execute(
            'UPDATE OTP_Verification SET is_verified = TRUE WHERE email = %s AND otp_code = %s',
            (email, otp_code)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'OTP verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/register', methods=['POST'])
def register():
    """Register new user (after OTP verification)"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not all([name, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if OTP was verified
        cur.execute(
            'SELECT * FROM OTP_Verification WHERE email = %s AND is_verified = TRUE',
            (email,)
        )
        verified_otp = cur.fetchone()
        
        if not verified_otp:
            cur.close()
            conn.close()
            return jsonify({'error': 'Email not verified. Please verify OTP first.'}), 400
        
        # Create user
        password_hash = generate_password_hash(password)
        
        cur.execute(
            'INSERT INTO Users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING user_id, name, email',
            (name, email, password_hash)
        )
        new_user = cur.fetchone()
        
        # Clean up OTP records
        cur.execute('DELETE FROM OTP_Verification WHERE email = %s', (email,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_user), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT user_id, name, email FROM Users')
        users = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT user_id, name, email FROM Users WHERE user_id = %s', (user_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print("=== LOGIN ATTEMPT ===")
        print(f"Received data: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        print(f"Email: {email}")
        print(f"Password length: {len(password) if password else 0}")
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        print(f"Querying database for email: {email}")
        cur.execute('SELECT user_id, name, email, password_hash FROM Users WHERE email = %s', (email,))
        user = cur.fetchone()
        
        print(f"User found: {user is not None}")
        
        if not user:
            cur.close()
            conn.close()
            print("User not found in database")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        print(f"User data: user_id={user['user_id']}, name={user['name']}, email={user['email']}")
        print(f"Password hash exists: {user['password_hash'] is not None}")
        
        password_valid = check_password_hash(user['password_hash'], password)
        print(f"Password check result: {password_valid}")
        
        cur.close()
        conn.close()
        
        if not password_valid:
            print("Password check failed")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        print("Login successful!")
        return jsonify({
            'user_id': user['user_id'],
            'name': user['name'],
            'email': user['email']
        }), 200
        
    except Exception as e:
        print(f"=== LOGIN ERROR ===")
        print(f"Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    

"""
@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT user_id, name, email, password_hash FROM Users WHERE email = %s', (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'user_id': user['user_id'],
            'name': user['name'],
            'email': user['email']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 """