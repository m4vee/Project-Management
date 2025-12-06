from flask import Blueprint, request, jsonify
from server import get_db_connection

# Define the Blueprint for swaps, e.g., /api/swaps
bp = Blueprint('swaps', __name__, url_prefix='/api/swaps')


@bp.route('/<int:product_id>/process', methods=['POST'])
def process_swap(product_id):
    """
    Finalizes a two-way swap agreement: records two zero-price transactions 
    (one for each product) and updates both statuses to 'swapped'.
    
    The transaction is processed for Product A (product_id) being traded 
    for Product B (swapped_with_product_id).
    
    Requires: buyer_id (Owner of Product B), seller_id (Owner of Product A), 
              swapped_with_product_id (Product B's ID) in JSON body.
    """
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    
    # --- 1. Validation & Setup ---
    required_fields = ['buyer_id', 'seller_id', 'swapped_with_product_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (buyer_id, seller_id, swapped_with_product_id)'}), 400

    buyer_id = data['buyer_id']  # Owner of Product B, who receives Product A
    seller_id = data['seller_id'] # Owner of Product A, who receives Product B
    swapped_with_product_id = data['swapped_with_product_id']
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # --- 2. Check Product A (product_id) Status and Type ---
        cur.execute("SELECT status, listing_type, posted_by FROM Products WHERE product_id = %s", (product_id,))
        product_a = cur.fetchone()

        if not product_a:
            return jsonify({'error': f'Product A ({product_id}) not found.'}), 404
        
        status_a, type_a, owner_a_id = product_a[0], product_a[1], product_a[2]
        
        if status_a != 'available':
            return jsonify({'error': f'Product A is already {status_a}.'}), 400
        if type_a != 'swap':
             return jsonify({'error': f'Product A is a {type_a} listing, not a swap.'}), 400
        if owner_a_id != seller_id:
            return jsonify({'error': 'Seller ID mismatch: Provided seller does not own Product A.'}), 403

        # --- 3. Check Product B (swapped_with_product_id) Status and Type ---
        cur.execute("SELECT status, listing_type, posted_by FROM Products WHERE product_id = %s", (swapped_with_product_id,))
        product_b = cur.fetchone()
        
        if not product_b:
            return jsonify({'error': f'Product B ({swapped_with_product_id}) not found.'}), 404
            
        status_b, type_b, owner_b_id = product_b[0], product_b[1], product_b[2]

        # Product B must also be available, a swap listing, and owned by the proposed buyer
        if status_b != 'available':
            return jsonify({'error': f'Product B is already {status_b}.'}), 400
        if type_b != 'swap':
             return jsonify({'error': f'Product B is a {type_b} listing, not a swap.'}), 400
        if owner_b_id != buyer_id:
            return jsonify({'error': 'Buyer ID mismatch: Provided buyer does not own Product B.'}), 403

        # --- 4. Record TWO Transactions (Price is 0.0 for Swaps) ---
        final_price = 0.0 
        
        # T1: Product A (product_id) goes from Seller (A's owner) to Buyer (B's owner)
        cur.execute('''
            INSERT INTO Transactions (product_id, seller_id, buyer_id, price_paid, status, listing_type)
            VALUES (%s, %s, %s, %s, 'agreed', 'swap')
            RETURNING transaction_id
        ''', (product_id, seller_id, buyer_id, final_price))
        
        transaction_a_id = cur.fetchone()[0]

        # T2: Product B (swapped_with_product_id) goes from Buyer (B's owner) to Seller (A's owner)
        cur.execute('''
            INSERT INTO Transactions (product_id, seller_id, buyer_id, price_paid, status, listing_type)
            VALUES (%s, %s, %s, %s, 'agreed', 'swap')
            RETURNING transaction_id
        ''', (swapped_with_product_id, buyer_id, seller_id, final_price))
        
        transaction_b_id = cur.fetchone()[0]
        
        # --- 5. Update BOTH Product Statuses ---
        cur.execute('''
            UPDATE Products 
            SET status = 'swapped' 
            WHERE product_id IN (%s, %s)
        ''', (product_id, swapped_with_product_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Two-way swap processed successfully.',
            'products_swapped': [product_id, swapped_with_product_id],
            'transaction_ids': [transaction_a_id, transaction_b_id]
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error processing two-way swap: {e}")
        return jsonify({'error': str(e)}), 500