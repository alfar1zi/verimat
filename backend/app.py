import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from routes.upload import upload_bp
from routes.verification import verification_bp
from routes.audit import audit_bp
from routes.po import po_bp
from routes.auth import auth_bp
from routes.vendor import vendor_bp
from routes.material import material_bp
from utils.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Secret key for JWT signing - MUST be set via environment variable in production
app.config['SECRET_KEY'] = os.environ.get('VERIMAT_SECRET_KEY', 'verimat-dev-secret-2026-change-in-prod')

# CORS - restrict to known origins only
ALLOWED_ORIGINS = [
    'https://verimat.vercel.app',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
]

CORS(
    app,
    origins=ALLOWED_ORIGINS,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True,
    max_age=600
)

# Max upload size: 15MB
app.config['MAX_CONTENT_LENGTH'] = 15 * 1024 * 1024

# Register blueprints
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(verification_bp, url_prefix='/api/verification')
app.register_blueprint(audit_bp, url_prefix='/api/audit')
app.register_blueprint(po_bp, url_prefix='/api/po')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(vendor_bp, url_prefix='/api/vendor')
app.register_blueprint(material_bp, url_prefix='/api/material')

# Initialize database
init_db()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

# Handle file too large error
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File terlalu besar. Maksimum 15MB.'}), 413

# Handle generic errors without leaking stack traces
@app.errorhandler(500)
def internal_error(e):
    logger.error(f'Internal error: {e}')
    return jsonify({'error': 'Terjadi kesalahan internal.'}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint tidak ditemukan.'}), 404

if __name__ == '__main__':
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug, port=5000)
