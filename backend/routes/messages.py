from flask import Blueprint, request, jsonify
from server import get_db_connection

bp = Blueprint('messages', __name__, url_prefix='/api/messages')

@bp.route('/threads/<int:user_id>', methods=['GET'])
def get_user_threads(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT mt.*, 
                   u1.name as user_one_name,
                   u2.name as user_two_name,
                   (SELECT message_text FROM Messages 
                    WHERE thread_id = mt.thread_id 
                    ORDER BY sent_at DESC LIMIT 1) as last_message,
                   (SELECT sent_at FROM Messages 
                    WHERE thread_id = mt.thread_id 
                    ORDER BY sent_at DESC LIMIT 1) as last_message_time
            FROM MessageThreads mt
            JOIN Users u1 ON mt.user_one = u1.user_id
            JOIN Users u2 ON mt.user_two = u2.user_id
            WHERE mt.user_one = %s OR mt.user_two = %s
            ORDER BY last_message_time DESC NULLS LAST
        ''', (user_id, user_id))
        
        threads = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(threads), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/thread/<int:thread_id>', methods=['GET'])
def get_messages(thread_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT m.*, u.name as sender_name
            FROM Messages m
            JOIN Users u ON m.sender_id = u.user_id
            WHERE m.thread_id = %s
            ORDER BY m.sent_at ASC
        ''', (thread_id,))
        
        messages = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if thread exists
        thread_id = data.get('thread_id')
        if not thread_id:
            # Create new thread
            cur.execute('''
                INSERT INTO MessageThreads (user_one, user_two)
                VALUES (%s, %s)
                RETURNING thread_id
            ''', (data['sender_id'], data['receiver_id']))
            thread_id = cur.fetchone()['thread_id']
        
        # Insert message
        cur.execute('''
            INSERT INTO Messages (thread_id, sender_id, message_text)
            VALUES (%s, %s, %s)
            RETURNING *
        ''', (thread_id, data['sender_id'], data['message_text']))
        
        new_message = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_message), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500