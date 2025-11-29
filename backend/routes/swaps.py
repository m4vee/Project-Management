from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('swaps', __name__, url_prefix='/api/swaps')

@bp.route('/requests', methods=['POST'])
def create_swap_request():
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO SwapRequests (requester_id, product_requested, product_offered)
            VALUES (%s, %s, %s)
            RETURNING *
        ''', (
            data['requester_id'],
            data['product_requested'],
            data['product_offered']
        ))
        
        new_swap = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_swap), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/requests/<int:user_id>', methods=['GET'])
def get_swap_requests(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT sr.*, 
                   p1.name as requested_product_name,
                   p2.name as offered_product_name,
                   u.name as requester_name
            FROM SwapRequests sr
            JOIN Products p1 ON sr.product_requested = p1.product_id
            JOIN Products p2 ON sr.product_offered = p2.product_id
            JOIN Users u ON sr.requester_id = u.user_id
            WHERE sr.requester_id = %s 
               OR p1.posted_by = %s
            ORDER BY sr.created_at DESC
        ''', (user_id, user_id))
        
        swaps = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(swaps), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/requests/<int:swap_id>/status', methods=['PUT'])
def update_swap_status(swap_id):
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            UPDATE SwapRequests
            SET status = %s
            WHERE swap_id = %s
            RETURNING *
        ''', (data['status'], swap_id))
        
        updated_swap = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(updated_swap), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500