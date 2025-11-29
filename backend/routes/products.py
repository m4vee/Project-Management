from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('products', __name__, url_prefix='/api/products')

@bp.route('', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get query parameters for filtering
        category_id = request.args.get('category_id')
        listing_type = request.args.get('listing_type')
        status = request.args.get('status', 'available')
        
        query = '''
            SELECT p.*, c.category_name, u.name as seller_name
            FROM Products p
            JOIN Categories c ON p.category_id = c.category_id
            JOIN Users u ON p.posted_by = u.user_id
            WHERE p.status = %s
        '''
        params = [status]
        
        if category_id:
            query += ' AND p.category_id = %s'
            params.append(category_id)
        
        if listing_type:
            query += ' AND p.listing_type = %s'
            params.append(listing_type)
        
        query += ' ORDER BY p.created_at DESC'
        
        cur.execute(query, params)
        products = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get product details
        cur.execute('''
            SELECT p.*, c.category_name, u.name as seller_name, u.email as seller_email
            FROM Products p
            JOIN Categories c ON p.category_id = c.category_id
            JOIN Users u ON p.posted_by = u.user_id
            WHERE p.product_id = %s
        ''', (product_id,))
        product = cur.fetchone()
        
        if not product:
            cur.close()
            conn.close()
            return jsonify({'error': 'Product not found'}), 404
        
        # Get photos
        cur.execute('SELECT * FROM Photos WHERE product_id = %s', (product_id,))
        photos = cur.fetchall()
        
        # Get availability
        cur.execute('SELECT * FROM ProductAvailability WHERE product_id = %s', (product_id,))
        availability = cur.fetchall()
        
        cur.close()
        conn.close()
        
        product['photos'] = photos
        product['availability'] = availability
        
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
        cur.execute('DELETE FROM Products WHERE product_id = %s RETURNING product_id', (product_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not deleted:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500