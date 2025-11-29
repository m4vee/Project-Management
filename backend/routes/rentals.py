from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('rentals', __name__, url_prefix='/api/rentals')

@bp.route('/requests', methods=['POST'])
def create_rental_request():
    try:
        data = request.get_json()
        
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
        return jsonify({'error': str(e)}), 500

@bp.route('/requests/<int:user_id>', methods=['GET'])
def get_rental_requests(user_id):
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
    try:
        data = request.get_json()
        status = data.get('status')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            UPDATE RentalRequests
            SET status = %s
            WHERE request_id = %s
            RETURNING *
        ''', (status, request_id))
        
        updated_request = cur.fetchone()
        
        # If approved, create rental record
        if status == 'approved' and updated_request:
            cur.execute('''
                INSERT INTO Rentals (product_id, borrower_id, owner_id, rent_start, rent_end)
                VALUES (%s, %s, %s, %s, %s)
            ''', (
                updated_request['product_id'],
                updated_request['renter_id'],
                updated_request['rentee_id'],
                updated_request['rent_start'],
                updated_request['rent_end']
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(updated_request), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500