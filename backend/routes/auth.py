from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    if username == 'admin' and password == 'admin':
        return jsonify({
            'success': True,
            'user': {
                'username': 'admin',
                'name': 'Administrator',
                'role': 'admin'
            },
            'token': 'demo-token-verimat-2026'
        }), 200
    
    return jsonify({
        'success': False,
        'message': 'Username atau password salah'
    }), 401
