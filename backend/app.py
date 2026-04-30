from flask import Flask, jsonify
from flask_cors import CORS
from routes.upload import upload_bp
from routes.verification import verification_bp
from routes.audit import audit_bp
from routes.po import po_bp
from routes.auth import auth_bp
from routes.vendor import vendor_bp
from routes.material import material_bp
from utils.database import init_db

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

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
    return jsonify({'status': 'healthy', 'message': 'VeriMat API is running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
