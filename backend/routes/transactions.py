from flask import Blueprint, request, jsonify 
from server import get_db_connection  # Import from server.py
import json 
from datetime import datetime, timezone
from decimal import Decimal
import psycopg2
import psycopg2.extras
import traceback

bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')  # Fixed prefix

@bp.route('', methods=['GET'])
def get_transactions():
    """Get all transactions or filter by user"""
    try:
        user_id = request.args.get('user_id')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if user_id:
            cur.execute('''
                SELECT t.*, 
                       u_buyer.name as buyer_name, 
                       u_seller.name as seller_name,
                       p.name as product_name
                FROM transactions t
                JOIN Users u_buyer ON t.buyer_id = u_buyer.user_id
                JOIN Users u_seller ON t.seller_id = u_seller.user_id
                JOIN Products p ON t.product_id = p.product_id
                WHERE t.buyer_id = %s OR t.seller_id = %s
                ORDER BY t.created_at DESC
            ''', (user_id, user_id))
        else:
            cur.execute('''
                SELECT t.*, 
                       u_buyer.name as buyer_name, 
                       u_seller.name as seller_name,
                       p.name as product_name
                FROM transactions t
                JOIN Users u_buyer ON t.buyer_id = u_buyer.user_id
                JOIN Users u_seller ON t.seller_id = u_seller.user_id
                JOIN Products p ON t.product_id = p.product_id
                ORDER BY t.created_at DESC
            ''')
        
        transactions = cur.fetchall()
        cur.close()
        conn.close()
        
        # Convert Decimal and datetime to strings for JSON
        result = []
        for txn in transactions:
            txn_dict = dict(txn)
            if 'price_paid' in txn_dict and txn_dict['price_paid']:
                txn_dict['price_paid'] = str(txn_dict['price_paid'])
            if 'created_at' in txn_dict and txn_dict['created_at']:
                txn_dict['created_at'] = txn_dict['created_at'].isoformat()
            result.append(txn_dict)
        
        return jsonify(result), 200
    except Exception as e:
        traceback.print_exc()
        print(f"Error fetching transactions: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:transaction_id>', methods=['GET'])
def get_transaction_details(transaction_id):
    """Get specific transaction details"""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT 
                t.transaction_id, t.price_paid, t.status, t.created_at, 
                t.payment_method, t.meetup_details, 
                p.product_id, p.name AS product_name, p.description, 
                p.price AS listing_price, 
                u_buyer.name AS buyer_name, 
                u_seller.name AS seller_name
            FROM transactions t
            JOIN Products p ON t.product_id = p.product_id
            JOIN Users u_buyer ON t.buyer_id = u_buyer.user_id
            JOIN Users u_seller ON t.seller_id = u_seller.user_id
            WHERE t.transaction_id = %s;
        """, (transaction_id,))
        
        transaction_details = cur.fetchone()
        
        if not transaction_details:
            return jsonify({'error': 'Transaction not found.'}), 404

        # Convert to dictionary
        result = dict(transaction_details)
        
        # Convert Decimal to string
        if result.get('price_paid') and isinstance(result['price_paid'], Decimal):
            result['price_paid'] = str(result['price_paid'])
        if result.get('listing_price') and isinstance(result['listing_price'], Decimal):
            result['listing_price'] = str(result['listing_price'])
        
        # Convert datetime to ISO format string (only if it's a datetime object)
        if result.get('created_at'):
            from datetime import datetime
            if isinstance(result['created_at'], datetime):
                result['created_at'] = result['created_at'].isoformat()
            # If it's already a string, leave it as is
        
        # Parse meetup_details if it's a JSON string
        if result.get('meetup_details'):
            if isinstance(result['meetup_details'], str):
                try:
                    result['meetup_details'] = json.loads(result['meetup_details'])
                except json.JSONDecodeError:
                    result['meetup_details'] = {}
            # If it's already a dict, leave it as is
        
        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error fetching transaction details: {e}")
        return jsonify({'error': 'Failed to retrieve transaction details.'}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@bp.route('', methods=['POST', 'OPTIONS'])
def create_transaction():
    """Create a new transaction"""
    if request.method == 'OPTIONS':
        return '', 200
        
    conn = None
    cur = None
    try:
        data = request.get_json()
        
        buyer_id = data.get('buyer_id')
        product_id = data.get('product_id')
        price_paid = data.get('total_amount') 
        payment_method = data.get('payment_method')
        meetup_details = data.get('meetup_details')

        if not all([buyer_id, product_id, price_paid, meetup_details]):
            return jsonify({'error': 'Missing required transaction data.'}), 400

        try:
            price_paid_decimal = Decimal(str(price_paid))
        except Exception:
            return jsonify({'error': 'Invalid total amount format.'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Check product status and get seller
        cur.execute("SELECT status, posted_by FROM Products WHERE product_id = %s", (product_id,))
        product_info = cur.fetchone()
        
        if not product_info:
            return jsonify({'error': 'Product not found.'}), 404
            
        product_status = product_info['status']
        seller_id = product_info['posted_by']

        if product_status.lower() != 'available':
            return jsonify({'error': 'Product is not available for purchase.'}), 400
        
        # Create transaction
        transaction_status = 'Pending' 
        listing_type = 'Buy'
        created_at_aware = datetime.now(timezone.utc)
        meetup_details_json = json.dumps(meetup_details)

        cur.execute("""
            INSERT INTO transactions
            (buyer_id, seller_id, product_id, price_paid, listing_type, status, 
             created_at, payment_method, meetup_details)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) 
            RETURNING transaction_id;
        """, (
            buyer_id, seller_id, product_id, price_paid_decimal, listing_type, 
            transaction_status, created_at_aware, payment_method, meetup_details_json
        ))
        
        result = cur.fetchone()
        if not result:
            raise Exception("Database failed to return a transaction ID.")

        transaction_id = result['transaction_id']
        
        # Update product status
        cur.execute("UPDATE Products SET status = 'Reserved' WHERE product_id = %s", (product_id,))

        conn.commit()
        
        return jsonify({
            'message': 'Transaction successfully recorded.', 
            'transaction_id': transaction_id
        }), 201

    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_e:
                print(f"Error during rollback: {rollback_e}")
        
        traceback.print_exc()
        print(f"Error creating transaction: {e}")
        
        return jsonify({'error': f'Failed to process transaction: {str(e)}'}), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@bp.route('/<int:transaction_id>/status', methods=['PUT'])
def update_transaction_status(transaction_id):
    """Update transaction status"""
    conn = None
    cur = None
    try:
        data = request.get_json()
        status = data.get('status')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            UPDATE transactions
            SET status = %s
            WHERE transaction_id = %s
            RETURNING *
        ''', (status, transaction_id))
        
        updated_txn = cur.fetchone()
        conn.commit()
        
        if not updated_txn:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Convert to dict and handle types
        result = dict(updated_txn)
        if result.get('price_paid'):
            result['price_paid'] = str(result['price_paid'])
        if result.get('created_at'):
            result['created_at'] = result['created_at'].isoformat()
        
        return jsonify(result), 200
    except Exception as e:
        if conn:
            conn.rollback()
        traceback.print_exc()
        print(f"Error updating transaction: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()