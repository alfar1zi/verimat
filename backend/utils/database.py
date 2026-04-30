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
    
    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN expiry_date TEXT')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN items_json TEXT')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE verification_sessions ADD COLUMN material_code TEXT')
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
    
    # Materials table untuk kode bahan baku
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_code TEXT UNIQUE NOT NULL,
            material_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed: Bahan Aktif (Active Pharmaceutical Ingredients - API)
    materials_data = [
        # APIs - common in Indonesian pharma
        ('P1', 'Paracetamol (Acetaminophen)'),
        ('A1', 'Ascorbic Acid (Vitamin C)'),
        ('A2', 'Amoxicillin Trihydrate'),
        ('A3', 'Ampicillin Trihydrate'),
        ('A4', 'Atorvastatin Calcium'),
        ('A5', 'Amlodipine Besylate'),
        ('A6', 'Acyclovir'),
        ('C1', 'Ciprofloxacin HCl'),
        ('C2', 'Cetirizine HCl'),
        ('C3', 'Captopril'),
        ('C4', 'Chloramphenicol'),
        ('C5', 'Cefadroxil Monohydrate'),
        ('C6', 'Cotrimoxazole (TMP-SMZ)'),
        ('D1', 'Dexamethasone'),
        ('D2', 'Diclofenac Sodium'),
        ('D3', 'Domperidone'),
        ('E1', 'Erythromycin Ethylsuccinate'),
        ('F1', 'Furosemide'),
        ('G1', 'Glibenclamide'),
        ('G2', 'Glimepiride'),
        ('I1', 'Ibuprofen'),
        ('I2', 'Isoniazid (INH)'),
        ('K1', 'Ketoconazole'),
        ('L1', 'Loperamide HCl'),
        ('M1', 'Metformin HCl'),
        ('M2', 'Metronidazole'),
        ('M3', 'Methylprednisolone'),
        ('M4', 'Mefenamic Acid'),
        ('N1', 'Nifedipine'),
        ('O1', 'Omeprazole'),
        ('O2', 'Ondansetron HCl'),
        ('P2', 'Piroxicam'),
        ('P3', 'Prednisone'),
        ('P4', 'Pseudoephedrine HCl'),
        ('R1', 'Ranitidine HCl'),
        ('R2', 'Rifampicin'),
        ('S1', 'Simvastatin'),
        ('S2', 'Salbutamol Sulfate'),
        ('S3', 'Spironolactone'),
        ('T1', 'Tramadol HCl'),
        ('T2', 'Thiamine HCl (Vitamin B1)'),
        ('V1', 'Vitamin B12 (Cyanocobalamin)'),
        ('V2', 'Vitamin B6 (Pyridoxine HCl)'),
        ('V3', 'Vitamin E (d-alpha Tocopherol)'),
        # Excipients (Bahan Pembantu / Bahan Tambahan)
        ('X-L1', 'Lactose Monohydrate'),
        ('X-M1', 'Microcrystalline Cellulose (MCC)'),
        ('X-M2', 'Magnesium Stearate'),
        ('X-S1', 'Sodium Starch Glycolate'),
        ('X-S2', 'Starch (Pati Jagung)'),
        ('X-P1', 'PVP K30 (Povidone)'),
        ('X-P2', 'PEG 6000 (Polyethylene Glycol)'),
        ('X-T1', 'Talc (Magnesium Silicate)'),
        ('X-C1', 'Carboxymethylcellulose Sodium (CMC-Na)'),
        ('X-C2', 'Calcium Carbonate'),
        ('X-C3', 'Croscarmellose Sodium (Ac-Di-Sol)'),
        ('X-C4', 'Crospovidone (PVPP)'),
        ('X-H1', 'HPMC (Hydroxypropyl Methylcellulose)'),
        ('X-H2', 'HPC (Hydroxypropyl Cellulose)'),
        ('X-S3', 'Sucrose (Gula Farmasi)'),
        ('X-S4', 'Sorbitol'),
        ('X-D1', 'Dicalcium Phosphate (DCP)'),
        ('X-M3', 'Mannitol'),
        ('X-G1', 'Gelatin'),
        ('X-G2', 'Glycerin (Gliserol)'),
        ('X-A1', 'Aspartame'),
        ('X-S5', 'Silicon Dioxide (Aerosil)'),
        ('X-T2', 'Titanium Dioxide'),
        ('X-E1', 'Ethylcellulose'),
    ]
    for code, name in materials_data:
        cursor.execute(
            'INSERT OR IGNORE INTO materials (material_code, material_name) VALUES (?, ?)',
            (code, name)
        )

    # Seed: Vendor/Supplier farmasi Indonesia yang umum
    # Ini hanya untuk pre-populate, user bisa tambah vendor baru saat verifikasi
    vendors_seed = [
        'PT Brataco (Bratachem)',
        'PT Kimia Farma Tbk',
        'PT Kalbe Farma Tbk',
        'PT Sanbe Farma',
        'PT Indofarma Tbk',
        'PT Phapros Tbk',
        'PT Dexa Medica',
        'PT Ikapharmindo Putramas Tbk',
        'PT Hexpharm Jaya',
        'PT Merck Indonesia',
        'PT BASF Indonesia',
        'PT Clariant Indonesia',
        'PT Croda Indonesia',
        'PT Dipa Pharmalab Intersains',
        'PT Enseval Putera Megatrading',
        'PT Anugrah Argon Medica',
        'PT Bernofarm',
        'PT Ferron Par Pharmaceuticals',
        'PT Saka Farma Laboratories',
        'PT Combiphar',
    ]

    # Buat tabel vendors_seed jika belum ada
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendor_seeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_name TEXT UNIQUE NOT NULL
        )
    ''')
    for vname in vendors_seed:
        cursor.execute(
            'INSERT OR IGNORE INTO vendor_seeds (vendor_name) VALUES (?)',
            (vname,)
        )
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully")


def upsert_material(material_code: str, material_name: str):
    """Save or update material code → name mapping."""
    if not material_code or not material_name:
        return
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO materials (material_code, material_name)
            VALUES (?, ?)
            ON CONFLICT(material_code) DO UPDATE SET
                material_name=excluded.material_name,
                updated_at=CURRENT_TIMESTAMP
        ''', (material_code.strip().upper(), material_name.strip()))
        conn.commit()
    finally:
        conn.close()
