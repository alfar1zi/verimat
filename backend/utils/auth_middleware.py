import logging
from functools import wraps
from flask import request, jsonify, current_app
from routes.auth import verify_token

logger = logging.getLogger(__name__)

def require_auth(f):
    """Decorator: require valid JWT token for this endpoint."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify({}), 200
        token = None

        # Try Authorization header: "Bearer <token>"
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            return jsonify({'error': 'Token autentikasi diperlukan.'}), 401

        payload = verify_token(token)
        if payload is None:
            logger.warning(f'Invalid/expired token from {request.remote_addr}')
            return jsonify({'error': 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.'}), 401

        # Attach user info to request context
        request.current_user = payload.get('sub', 'unknown')
        return f(*args, **kwargs)
    return decorated
