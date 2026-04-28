import sqlite3
import os

DB_PATH = 'verimat.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Purchase orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT UNIQUE NOT NULL,
            supplier_name TEXT NOT NULL,
            material_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Verification sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_sessions (
            session_id TEXT PRIMARY KEY,
            po_number TEXT NOT NULL,
            doc_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            validation_status TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL
        )
    ''')
    
    # Add new columns to verification_sessions if they don't exist
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN reference_number TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN vendor_name TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN material_name TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN batch_number TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN quantity REAL')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN unit TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN document_date TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN packaging_condition TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN storage_condition TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN temperature REAL')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN notes TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN explanation TEXT')
    except sqlite3.OperationalError:
        pass
    
    # Verification logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            field_name TEXT NOT NULL,
            expected_value TEXT,
            actual_value TEXT,
            status TEXT NOT NULL,
            explanation TEXT,
            created_at TIMESTAMP NOT NULL,
            FOREIGN KEY (session_id) REFERENCES verification_sessions(session_id)
        )
    ''')
    
    # Insert sample PO data
    cursor.execute('''
        INSERT OR IGNORE INTO purchase_orders (po_number, supplier_name, material_name, quantity, unit)
        VALUES 
            ('PO-2024-001', 'PT Kimia Farma', 'Paracetamol', 100.0, 'kg'),
            ('PO-2024-002', 'PT Indo Acidatama', 'Ascorbic Acid', 50.0, 'kg'),
            ('PO-2024-003', 'PT Brataco', 'Magnesium Stearate', 25.0, 'kg')
    ''')
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully")
