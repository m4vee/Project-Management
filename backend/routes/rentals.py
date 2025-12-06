from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('rentals', __name__, url_prefix='/api/rentals')

@bp.route('/requests', methods=['POST'])
def create_rental_request():
    """
    Creates a new rental request entry.
    """
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        
        # NOTE: Added validation for required fields
        required_fields = ['product_id', 'renter_id', 'rentee_id', 'rent_start', 'rent_end']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields (product_id, renter_id, rentee_id, rent_start, rent_end)'}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO RentalRequests (product_id, renter_id, rentee_id, rent_start, rent_end)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        ''', (
            data['product_id'],
            data['renter_id'],
            data['rentee_id'],
            data['rent_start'],
            data['rent_end']
        ))
        
        new_request = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_request), 201
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error creating rental request: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/requests/<int:user_id>', methods=['GET'])
def get_rental_requests(user_id):
    """
    Retrieves all rental requests where the user is either the renter (buyer) or the rentee (seller).
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT rr.*, p.name as product_name, 
                   u1.name as renter_name, u2.name as rentee_name
            FROM RentalRequests rr
            JOIN Products p ON rr.product_id = p.product_id
            JOIN Users u1 ON rr.renter_id = u1.user_id
            JOIN Users u2 ON rr.rentee_id = u2.user_id
            WHERE rr.renter_id = %s OR rr.rentee_id = %s
            ORDER BY rr.created_at DESC
        ''', (user_id, user_id))
        
        requests = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(requests), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/requests/<int:request_id>/status', methods=['PUT'])
def update_rental_status(request_id):
    """
    Updates the status of a rental request. If approved, it creates a transaction 
    record and updates the product status to 'rented'.
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    try:
        data = request.get_json()
        status = data.get('status')
        
        if not status:
             return jsonify({'error': 'Missing status field'}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Update the RentalRequest status
        cur.execute('''
            UPDATE RentalRequests
            SET status = %s
            WHERE request_id = %s
            RETURNING *
        ''', (status, request_id))
        
        updated_request = cur.fetchone()
        
        if not updated_request:
            conn.rollback()
            return jsonify({'error': 'Rental request not found'}), 404
        
        # 2. If approved, finalize the transaction and update product status
        if status == 'approved':
            # a. Fetch required product details (price and current status)
            cur.execute("SELECT rental_price, status, listing_type FROM Products WHERE product_id = %s", (updated_request['product_id'],))
            product_details = cur.fetchone()

            if not product_details or product_details[1] != 'available' or product_details[2] != 'rent':
                conn.rollback()
                return jsonify({'error': 'Cannot approve: Product is unavailable or not a rental listing.'}), 400
            
            # Use the product's listed rental price (default to 0 if null)
            rental_price = product_details[0] if product_details[0] is not None else 0

            # b. Insert into the unified Transactions table
            cur.execute('''
                INSERT INTO Transactions (product_id, seller_id, buyer_id, price_paid, status, listing_type, transaction_date)
                VALUES (%s, %s, %s, %s, 'completed', 'rent', CURRENT_TIMESTAMP)
                RETURNING transaction_id
            ''', (
                updated_request['product_id'],
                updated_request['rentee_id'],  # RenTee is the Owner/Seller
                updated_request['renter_id'],  # RenTer is the Borrower/Buyer
                rental_price 
            ))
            
            # c. Update Product Status to 'rented'
            cur.execute('''
                UPDATE Products 
                SET status = 'rented' 
                WHERE product_id = %s
            ''', (updated_request['product_id'],))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(updated_request), 200
    except Exception as e:
        if conn: conn.rollback()
        print(f"Error updating rental status: {e}")
        return jsonify({'error': str(e)}), 500