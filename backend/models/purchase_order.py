from utils.database import get_db_connection

def get_all_purchase_orders():
    """Get all purchase orders from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM purchase_orders')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_purchase_order(po_number):
    """Get a specific purchase order by PO number"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM purchase_orders WHERE po_number = ?', (po_number,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None
