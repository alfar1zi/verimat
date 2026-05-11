import os
import jwt
import hmac
import logging
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

# In-memory login attempt tracker per IP
# Key: IP, Value: {'count': int, 'last_attempt': datetime}
_login_attempts: dict = {}
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 5

def _get_client_ip():
    """Get real client IP, considering proxies."""
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
    return request.remote_addr or 'unknown'

def _is_locked_out(ip: str) -> tuple[bool, int]:
    """Check if IP is locked out. Returns (is_locked, seconds_remaining)."""
    if ip not in _login_attempts:
        return False, 0
    info = _login_attempts[ip]
    if info['count'] < MAX_ATTEMPTS:
        return False, 0
    elapsed = (datetime.now(timezone.utc) - info['last_attempt']).total_seconds()
    remaining = int(LOCKOUT_MINUTES * 60 - elapsed)
    if remaining <= 0:
        del _login_attempts[ip]
        return False, 0
    return True, remaining

def _record_attempt(ip: str, success: bool):
    """Record a login attempt."""
    if success:
        if ip in _login_attempts:
            del _login_attempts[ip]
        return
    if ip not in _login_attempts:
        _login_attempts[ip] = {'count': 0, 'last_attempt': datetime.now(timezone.utc)}
    _login_attempts[ip]['count'] += 1
    _login_attempts[ip]['last_attempt'] = datetime.now(timezone.utc)

def generate_token(username: str) -> str:
    """Generate a signed JWT token valid for 8 hours."""
    payload = {
        'sub': username,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=8),
        'role': 'admin'
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token: str) -> dict | None:
    """Verify JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    ip = _get_client_ip()

    # Check lockout
    locked, remaining = _is_locked_out(ip)
    if locked:
        minutes = remaining // 60
        seconds = remaining % 60
        logger.warning(f'Login blocked for IP {ip} - locked out ({remaining}s remaining)')
        return jsonify({
            'success': False,
            'message': f'Terlalu banyak percobaan gagal. Coba lagi dalam {minutes}m {seconds}s.',
            'locked': True,
            'retry_after': remaining
        }), 429

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'message': 'Request tidak valid.'}), 400

    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    # Input length guard
    if len(username) > 64 or len(password) > 128:
        return jsonify({'success': False, 'message': 'Input tidak valid.'}), 400

    # Validate credentials
    # In production: compare against hashed password in DB
    valid_username = os.environ.get('VERIMAT_USERNAME', 'admin')
    valid_password = os.environ.get('VERIMAT_PASSWORD', 'admin')

    # Gunakan hmac.compare_digest untuk mencegah timing attack
    username_match = hmac.compare_digest(username, valid_username)
    password_match = hmac.compare_digest(password, valid_password)
    if username_match and password_match:
        _record_attempt(ip, success=True)
        token = generate_token(username)
        logger.info(f'Successful login: {username} from {ip}')
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'name': 'Administrator',
                'role': 'admin'
            },
            'token': token
        }), 200

    _record_attempt(ip, success=False)
    remaining_attempts = MAX_ATTEMPTS - _login_attempts.get(ip, {}).get('count', 0)
    logger.warning(f'Failed login attempt for "{username}" from {ip}')

    return jsonify({
        'success': False,
        'message': 'Username atau password salah.',
        'attempts_remaining': max(0, remaining_attempts)
    }), 401
