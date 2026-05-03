import os
import logging
import pyodbc
import sqlite3

logger = logging.getLogger(__name__)

# ─── Connection config ───────────────────────────────────────────────────────

def _get_azure_sql_connection_string() -> str | None:
    """Build pyodbc connection string from environment variables."""
    server   = os.environ.get('AZURE_SQL_SERVER')
    database = os.environ.get('AZURE_SQL_DATABASE')
    username = os.environ.get('AZURE_SQL_USERNAME')
    password = os.environ.get('AZURE_SQL_PASSWORD')

    if not all([server, database, username, password]):
        return None

    return (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server},1433;"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30;"
    )

USE_AZURE_SQL = bool(os.environ.get('AZURE_SQL_SERVER'))

def get_db_connection():
    """Return a database connection (Azure SQL or SQLite fallback)."""
    if USE_AZURE_SQL:
        conn_str = _get_azure_sql_connection_string()
        conn = pyodbc.connect(conn_str)
        conn.autocommit = False
        return conn
    else:
        conn = sqlite3.connect(
            os.environ.get('SQLITE_DB_PATH', 'verimat.db'),
            check_same_thread=False
        )
        conn.row_factory = sqlite3.Row
        return conn

# ─── SQL dialect helpers ─────────────────────────────────────────────────────

def _placeholder(n: int = 1) -> str:
    """Return correct placeholder for current DB."""
    return '?' * n if True else '%s' * n  # Both use ? 

def _bool_val(v: bool) -> int:
    return 1 if v else 0

# ─── Schema initialisation ───────────────────────────────────────────────────

_AZURE_SQL_SCHEMA = """
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='verification_sessions' AND xtype='U')
CREATE TABLE verification_sessions (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    session_id          NVARCHAR(36)   NOT NULL UNIQUE,
    po_number           NVARCHAR(100),
    reference_number    NVARCHAR(100),
    vendor_name         NVARCHAR(200),
    material_name       NVARCHAR(200),
    material_code       NVARCHAR(20),
    batch_number        NVARCHAR(100),
    quantity            FLOAT,
    unit                NVARCHAR(20),
    document_date       NVARCHAR(20),
    expiry_date         NVARCHAR(20),
    packaging_condition NVARCHAR(100),
    storage_condition   NVARCHAR(100),
    temperature         FLOAT,
    notes               NVARCHAR(1000),
    doc_type            NVARCHAR(50),
    file_path           NVARCHAR(500),
    validation_status   NVARCHAR(20),
    explanation         NVARCHAR(MAX),
    items_json          NVARCHAR(MAX),
    created_at          NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='verification_logs' AND xtype='U')
CREATE TABLE verification_logs (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    session_id      NVARCHAR(36)   NOT NULL,
    field_name      NVARCHAR(100),
    expected_value  NVARCHAR(500),
    actual_value    NVARCHAR(500),
    status          NVARCHAR(20),
    explanation     NVARCHAR(MAX),
    created_at      NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchase_orders' AND xtype='U')
CREATE TABLE purchase_orders (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    po_number     NVARCHAR(100) NOT NULL UNIQUE,
    supplier_name NVARCHAR(200),
    material_name NVARCHAR(200),
    quantity      FLOAT,
    unit          NVARCHAR(20)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='materials' AND xtype='U')
CREATE TABLE materials (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    material_code NVARCHAR(20)  NOT NULL UNIQUE,
    material_name NVARCHAR(200) NOT NULL,
    created_at    NVARCHAR(50)  DEFAULT GETDATE(),
    updated_at    NVARCHAR(50)  DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vendor_seeds' AND xtype='U')
CREATE TABLE vendor_seeds (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    vendor_name NVARCHAR(200) NOT NULL UNIQUE
);
"""

_SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS verification_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id          TEXT NOT NULL UNIQUE,
    po_number           TEXT,
    reference_number    TEXT,
    vendor_name         TEXT,
    material_name       TEXT,
    material_code       TEXT,
    batch_number        TEXT,
    quantity            REAL,
    unit                TEXT,
    document_date       TEXT,
    expiry_date         TEXT,
    packaging_condition TEXT,
    storage_condition   TEXT,
    temperature         REAL,
    notes               TEXT,
    doc_type            TEXT,
    file_path           TEXT,
    validation_status   TEXT,
    explanation         TEXT,
    items_json          TEXT,
    created_at          TEXT
);

CREATE TABLE IF NOT EXISTS verification_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    field_name      TEXT,
    expected_value  TEXT,
    actual_value    TEXT,
    status          TEXT,
    explanation     TEXT,
    created_at      TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number     TEXT NOT NULL UNIQUE,
    supplier_name TEXT,
    material_name TEXT,
    quantity      REAL,
    unit          TEXT
);

CREATE TABLE IF NOT EXISTS materials (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code TEXT UNIQUE NOT NULL,
    material_name TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_seeds (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT UNIQUE NOT NULL
);
"""

def _row_to_dict(row, cursor=None) -> dict:
    """Convert a DB row to dict regardless of DB type."""
    if row is None:
        return None
    if isinstance(row, sqlite3.Row):
        return dict(row)
    # pyodbc Row
    if cursor and cursor.description:
        cols = [d[0] for d in cursor.description]
        return dict(zip(cols, row))
    return {}

def _fetchall_as_dicts(cursor) -> list[dict]:
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

def _fetchone_as_dict(cursor) -> dict | None:
    cols = [d[0] for d in cursor.description]
    row = cursor.fetchone()
    if row is None:
        return None
    return dict(zip(cols, row))


# ─── Seed data ───────────────────────────────────────────────────────────────

PO_SEED = [
    ('PO-2024-001', 'PT Kimia Farma', 'Paracetamol', 100, 'kg'),
    ('PO-2024-002', 'PT Indo Acidatama', 'Ascorbic Acid', 50, 'kg'),
    ('PO-2024-003', 'PT Brataco', 'Magnesium Stearate', 25, 'kg'),
]

MATERIALS_SEED = [
    ('P1','Paracetamol (Acetaminophen)'),
    ('A1','Ascorbic Acid (Vitamin C)'),
    ('A2','Amoxicillin Trihydrate'),
    ('A3','Ampicillin Trihydrate'),
    ('A4','Atorvastatin Calcium'),
    ('A5','Amlodipine Besylate'),
    ('A6','Acyclovir'),
    ('C1','Ciprofloxacin HCl'),
    ('C2','Cetirizine HCl'),
    ('C3','Captopril'),
    ('C4','Chloramphenicol'),
    ('C5','Cefadroxil Monohydrate'),
    ('C6','Cotrimoxazole (TMP-SMZ)'),
    ('D1','Dexamethasone'),
    ('D2','Diclofenac Sodium'),
    ('D3','Domperidone'),
    ('E1','Erythromycin Ethylsuccinate'),
    ('F1','Furosemide'),
    ('G1','Glibenclamide'),
    ('G2','Glimepiride'),
    ('I1','Ibuprofen'),
    ('I2','Isoniazid (INH)'),
    ('K1','Ketoconazole'),
    ('L1','Loperamide HCl'),
    ('M1','Metformin HCl'),
    ('M2','Metronidazole'),
    ('M3','Methylprednisolone'),
    ('M4','Mefenamic Acid'),
    ('N1','Nifedipine'),
    ('O1','Omeprazole'),
    ('O2','Ondansetron HCl'),
    ('P2','Piroxicam'),
    ('P3','Prednisone'),
    ('P4','Pseudoephedrine HCl'),
    ('R1','Ranitidine HCl'),
    ('R2','Rifampicin'),
    ('S1','Simvastatin'),
    ('S2','Salbutamol Sulfate'),
    ('S3','Spironolactone'),
    ('T1','Tramadol HCl'),
    ('T2','Thiamine HCl (Vitamin B1)'),
    ('V1','Vitamin B12 (Cyanocobalamin)'),
    ('V2','Vitamin B6 (Pyridoxine HCl)'),
    ('V3','Vitamin E (d-alpha Tocopherol)'),
    ('X-L1','Lactose Monohydrate'),
    ('X-M1','Microcrystalline Cellulose (MCC)'),
    ('X-M2','Magnesium Stearate'),
    ('X-S1','Sodium Starch Glycolate'),
    ('X-S2','Starch (Pati Jagung)'),
    ('X-P1','PVP K30 (Povidone)'),
    ('X-P2','PEG 6000 (Polyethylene Glycol)'),
    ('X-T1','Talc (Magnesium Silicate)'),
    ('X-C1','Carboxymethylcellulose Sodium (CMC-Na)'),
    ('X-C2','Calcium Carbonate'),
    ('X-C3','Croscarmellose Sodium (Ac-Di-Sol)'),
    ('X-C4','Crospovidone (PVPP)'),
    ('X-H1','HPMC (Hydroxypropyl Methylcellulose)'),
    ('X-H2','HPC (Hydroxypropyl Cellulose)'),
    ('X-S3','Sucrose (Gula Farmasi)'),
    ('X-S4','Sorbitol'),
    ('X-D1','Dicalcium Phosphate (DCP)'),
    ('X-M3','Mannitol'),
    ('X-G1','Gelatin'),
    ('X-G2','Glycerin (Gliserol)'),
    ('X-A1','Aspartame'),
    ('X-S5','Silicon Dioxide (Aerosil)'),
    ('X-T2','Titanium Dioxide'),
    ('X-E1','Ethylcellulose'),
]

VENDORS_SEED = [
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

# ─── init_db ─────────────────────────────────────────────────────────────────

def init_db():
    """Create tables and seed initial data."""
    conn = get_db_connection()
    try:
        if USE_AZURE_SQL:
            cursor = conn.cursor()
            # Execute each statement separately (Azure SQL doesn't support multi-IF in one exec)
            for stmt in _AZURE_SQL_SCHEMA.strip().split('\n\n'):
                stmt = stmt.strip()
                if stmt:
                    cursor.execute(stmt)
            conn.commit()

            # Seed POs
            for po in PO_SEED:
                try:
                    cursor.execute(
                        "IF NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number=?) "
                        "INSERT INTO purchase_orders (po_number,supplier_name,material_name,quantity,unit) "
                        "VALUES (?,?,?,?,?)",
                        (po[0], po[0], po[1], po[2], po[3], po[4])
                    )
                except Exception:
                    pass

            # Seed materials
            for code, name in MATERIALS_SEED:
                try:
                    cursor.execute(
                        "IF NOT EXISTS (SELECT 1 FROM materials WHERE material_code=?) "
                        "INSERT INTO materials (material_code,material_name) VALUES (?,?)",
                        (code, code, name)
                    )
                except Exception:
                    pass

            # Seed vendors
            for v in VENDORS_SEED:
                try:
                    cursor.execute(
                        "IF NOT EXISTS (SELECT 1 FROM vendor_seeds WHERE vendor_name=?) "
                        "INSERT INTO vendor_seeds (vendor_name) VALUES (?)",
                        (v, v)
                    )
                except Exception:
                    pass

            conn.commit()
            logger.info("Azure SQL schema initialised successfully")

        else:
            # SQLite path
            cursor = conn.cursor()
            cursor.executescript(_SQLITE_SCHEMA)

            for po in PO_SEED:
                cursor.execute(
                    "INSERT OR IGNORE INTO purchase_orders "
                    "(po_number,supplier_name,material_name,quantity,unit) VALUES (?,?,?,?,?)",
                    po
                )
            for code, name in MATERIALS_SEED:
                cursor.execute(
                    "INSERT OR IGNORE INTO materials (material_code,material_name) VALUES (?,?)",
                    (code, name)
                )
            for v in VENDORS_SEED:
                cursor.execute(
                    "INSERT OR IGNORE INTO vendor_seeds (vendor_name) VALUES (?)", (v,)
                )
            conn.commit()
            logger.info("SQLite schema initialised successfully")

    except Exception as e:
        logger.error(f"init_db error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def upsert_material(material_code: str, material_name: str):
    if not material_code or not material_name:
        return
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if USE_AZURE_SQL:
            cursor.execute(
                "IF EXISTS (SELECT 1 FROM materials WHERE material_code=?) "
                "UPDATE materials SET material_name=?, updated_at=GETDATE() WHERE material_code=? "
                "ELSE INSERT INTO materials (material_code,material_name) VALUES (?,?)",
                (material_code, material_name, material_code, material_code, material_name)
            )
        else:
            cursor.execute(
                "INSERT INTO materials (material_code,material_name) VALUES (?,?) "
                "ON CONFLICT(material_code) DO UPDATE SET material_name=excluded.material_name",
                (material_code.strip().upper(), material_name.strip())
            )
        conn.commit()
    finally:
        conn.close()
