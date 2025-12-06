from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('products', __name__, url_prefix='/api/products')

@bp.route('', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        # Ensure you use a dict-like cursor (e.g., RealDictCursor)
        cur = conn.cursor() 
        
        # ... (Parameter fetching remains the same) ...
        category_id = request.args.get('category_id')
        listing_type = request.args.get('listing_type')
        status = request.args.get('status', 'available')
        
        # ----------------------------------------------------------------------
        # 🚀 UPDATED QUERY: NOW INCLUDES PHOTOS AND AVAILABILITY 🚀
        # ----------------------------------------------------------------------
        query = '''
            SELECT 
                p.*, 
                c.category_name, 
                u.name as seller_name,
                -- 1. Aggregate photo URLs
                CASE 
                    WHEN count(ph.photo_url) = 0 THEN '[]'::json
                    ELSE json_agg(json_build_object('photo_url', ph.photo_url)) 
                END AS photos,
                
                -- 2. Aggregate availability days into an array
                json_agg(pa.day_of_week) FILTER (WHERE pa.day_of_week IS NOT NULL) AS availability 
                
            FROM 
                Products p
            JOIN 
                Categories c ON p.category_id = c.category_id
            JOIN 
                Users u ON p.posted_by = u.user_id
            LEFT JOIN
                Photos ph ON p.product_id = ph.product_id
            LEFT JOIN
                ProductAvailability pa ON p.product_id = pa.product_id -- ⬅️ NEW: JOIN Availability
            WHERE 
                p.status = %s
        '''
        params = [status]
        
        if category_id:
            query += ' AND p.category_id = %s'
            params.append(category_id)
        
        if listing_type:
            query += ' AND p.listing_type = %s'
            params.append(listing_type)
        
        # ⬅️ NEW: Ensure all fields used in SELECT/JOINs are in GROUP BY
        query += ''' 
            GROUP BY 
                p.product_id, c.category_name, u.name 
            ORDER BY 
                p.created_at DESC
        '''
        # ----------------------------------------------------------------------
        
        cur.execute(query, params)
        products = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(products), 200
    except Exception as e:
        print(f"Error in get_products: {e}") 
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 🚀 Consolidate product, user, category, AND photos into one query
        cur.execute('''
            SELECT 
                p.*, 
                c.category_name, 
                u.name as seller_name, 
                u.email as seller_email,
                -- Aggregate all photo URLs into a single JSON array named 'photos'
                COALESCE(ARRAY_AGG(ph.photo_url) FILTER (WHERE ph.photo_url IS NOT NULL), '{}') AS photos,
                -- Aggregate availability (FIXED: Using ARRAY_AGG(DISTINCT) for unique day strings)
                COALESCE(ARRAY_AGG(DISTINCT pa.day_of_week) FILTER (WHERE pa.day_of_week IS NOT NULL), '{}') AS availability
            FROM Products p
            JOIN Categories c ON p.category_id = c.category_id
            JOIN Users u ON p.posted_by = u.user_id
            LEFT JOIN Photos ph ON p.product_id = ph.product_id
            LEFT JOIN ProductAvailability pa ON p.product_id = pa.product_id
            WHERE p.product_id = %s
            GROUP BY 
                p.product_id, c.category_name, u.name, u.email
        ''', (product_id,))
        product = cur.fetchone() # Fetch the one consolidated result
        
        if not product:
            cur.close()
            conn.close()
            return jsonify({'error': 'Product not found'}), 404
        
        # ⚠️ Now, you don't need the separate queries or the manual combining steps!
        
        cur.close()
        conn.close()
        
        return jsonify(product), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_product():
    try:
        data = request.get_json()
        
        required_fields = ['posted_by', 'role_in_post', 'name', 'category_id', 'listing_type']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO Products (posted_by, role_in_post, name, description, condition, 
                                category_id, price, rental_price, listing_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        ''', (
            data['posted_by'],
            data['role_in_post'],
            data['name'],
            data.get('description'),
            data.get('condition'),
            data['category_id'],
            data.get('price'),
            data.get('rental_price'),
            data['listing_type']
        ))
        
        new_product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_product), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            UPDATE Products 
            SET name = %s, description = %s, condition = %s, 
                price = %s, rental_price = %s, status = %s
            WHERE product_id = %s
            RETURNING *
        ''', (
            data.get('name'),
            data.get('description'),
            data.get('condition'),
            data.get('price'),
            data.get('rental_price'),
            data.get('status'),
            product_id
        ))
        
        updated_product = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not updated_product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify(updated_product), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # --- 1. Delete records from child tables (CASCADE manually) ---
        
        # Delete related Photos
        cur.execute('DELETE FROM Photos WHERE product_id = %s', (product_id,))
        print(f"Deleted {cur.rowcount} photos for product {product_id}")
        
        # Delete related ProductAvailability
        cur.execute('DELETE FROM ProductAvailability WHERE product_id = %s', (product_id,))
        print(f"Deleted {cur.rowcount} availability entries for product {product_id}")
        
        # NOTE: Add DELETE statements for any other child tables that reference Products (e.g., Offers, Reviews)
        
        # --- 2. Delete the parent Product record ---
        cur.execute('DELETE FROM Products WHERE product_id = %s RETURNING product_id', (product_id,))
        deleted = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        if not deleted:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        # Crucial: Rollback any changes if the deletion process fails
        if conn:
            conn.rollback()
        print(f"FATAL DELETE ERROR: {e}") 
        return jsonify({'error': str(e)}), 500
    
@bp.route('/<int:product_id>/photos', methods=['POST'])
def add_product_photo(product_id):
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        #product_id = data.get('product_id')
        photo_url = data.get('photo_url')
        
        if not product_id or not photo_url:
            return jsonify({'error': 'Product ID and photo URL are required'}), 400
        
        if not photo_url: # Check only photo_url, as product_id comes from URL
            return jsonify({'error': 'Photo URL is required'}), 400
        
        print(f"Adding photo for product {product_id}: {photo_url}")  # Debug
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            'INSERT INTO Photos (product_id, photo_url) VALUES (%s, %s) RETURNING *',
            (product_id, photo_url)
        )
        
        new_photo = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Photo added successfully: {new_photo}")  # Debug

        return jsonify(new_photo), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# In products.py, add this new function/route:

@bp.route('/<int:product_id>/availability', methods=['POST'])
def add_product_availability(product_id):
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 200
    try:
        # Expecting a list of strings (e.g., ['Monday', 'Tuesday'])
        availability_data = request.get_json() 
        
        # Validate that the data is a list
        if not isinstance(availability_data, list):
            return jsonify({'error': 'Invalid data format. Expected a list of availability days.'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. (Optional but Recommended) Delete existing availability for cleanup
        cur.execute('DELETE FROM ProductAvailability WHERE product_id = %s', (product_id,))
        
        # 2. Prepare the data for bulk insertion
        insert_values = []
        for day in availability_data:
            # Assuming your ProductAvailability table only needs (product_id, day_of_week)
            # and that 'day' is a simple string like 'Monday'.
            insert_values.append((product_id, day.strip())) 
            
        if not insert_values:
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'No availability provided or saved.'}), 200

        # 3. Insert the new availability records
        # Using a multi-value INSERT is more efficient than looping cur.execute()
        
        # Construct the VALUES part of the query: (%s, %s), (%s, %s), ...
        placeholders = ', '.join(['(%s, %s)' for _ in insert_values])
        
        # Flatten the list of tuples into a single list for cur.execute
        flat_values = [item for sublist in insert_values for item in sublist]

        insert_query = f'''
            INSERT INTO ProductAvailability (product_id, day_of_week) 
            VALUES {placeholders}
        '''
        
        cur.execute(insert_query, flat_values)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': f'Successfully saved {len(insert_values)} availability entries.'}), 201
        
    except Exception as e:
        # Check server logs for exact database error if this fails!
        print(f"Error saving product availability for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:product_id>/buy', methods=['POST'])
def buy_product(product_id):
    """
    Handles the purchase process for 'buy/sell' listings: 
    records transaction and updates status to 'sold'.
    
    Requires: buyer_id, price_paid, seller_id in JSON body.
    """
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    
    required_fields = ['buyer_id', 'price_paid', 'seller_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (buyer_id, price_paid, seller_id)'}), 400

    buyer_id = data['buyer_id']
    price_paid = data['price_paid']
    seller_id = data['seller_id']
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # --- 1. Check Product Status and Type ---
        cur.execute("SELECT status, listing_type, price FROM Products WHERE product_id = %s", (product_id,))
        product = cur.fetchone()

        if not product:
            return jsonify({'error': 'Product not found.'}), 404

        # Assuming tuple index access if not RealDictCursor
        db_status, db_listing_type, db_price = product[0], product[1], product[2] 
        
        if db_status != 'available':
            return jsonify({'error': f'Product is already {db_status}.'}), 400
        
        if db_listing_type != 'buy/sell':
             return jsonify({'error': f'Invalid request: This is a {db_listing_type} listing, not a buy/sell.'}), 400

        # --- 2. Record the Transaction ---
        # Use the price_paid from the request or the listed price
        final_price = db_price if db_price is not None else price_paid 
        
        cur.execute('''
            INSERT INTO Transactions (product_id, seller_id, buyer_id, price_paid, status, listing_type)
            VALUES (%s, %s, %s, %s, 'completed', 'buy/sell')
            RETURNING transaction_id
        ''', (product_id, seller_id, buyer_id, final_price))
        
        transaction_id = cur.fetchone()[0]
        
        # --- 3. Update Product Status ---
        cur.execute('''
            UPDATE Products 
            SET status = 'sold' 
            WHERE product_id = %s
        ''', (product_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Purchase processed successfully.',
            'product_id': product_id,
            'transaction_id': transaction_id
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error processing purchase for product {product_id}: {e}")
        return jsonify({'error': str(e)}), 500
    
# products.py (or a similar routes file)

@bp.route('/<int:product_id>', methods=['GET'])
def get_product_details(product_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor) # Use RealDictCursor to get results as dictionaries

        # SQL to fetch all necessary product details
        cur.execute("""
            SELECT 
                p.product_id, p.title, p.description, p.price, p.category, 
                p.owner_id, p.condition, 
                ARRAY_AGG(i.image_url) AS images
            FROM 
                Products p
            LEFT JOIN 
                Images i ON p.product_id = i.product_id
            WHERE 
                p.product_id = %s AND p.inventory_status = 'Available'
            GROUP BY p.product_id
        """, (product_id,))
        
        product = cur.fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found or not available.'}), 404
        
        # NOTE: You may want to add authentication here to ensure the user is logged in, 
        # but fetching public details usually doesn't require authorization.

        return jsonify(product), 200
        
    except Exception as e:
        print(f"Error fetching product: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500
    finally:
        if conn:
            cur.close()
            conn.close()