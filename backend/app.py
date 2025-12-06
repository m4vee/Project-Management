from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from server import init_db
from routes import users, products, messages, rentals, swaps
from dotenv import load_dotenv
from utils.email import mail
from routes.transactions import bp as transactions_bp
import os

load_dotenv() # This loads all variables from .env into os.environ

app = Flask(__name__)
CORS(app)
"""CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})"""

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialize mail
mail.init_app(app)

# Register blueprints
app.register_blueprint(users.bp)
app.register_blueprint(products.bp)
app.register_blueprint(messages.bp)
app.register_blueprint(rentals.bp)
app.register_blueprint(swaps.bp)

app.register_blueprint(transactions_bp)

@app.route('/')
def index():
    return {'message': 'TuPulse API is running'}

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)