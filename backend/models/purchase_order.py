from utils.database import get_db_connection, _fetchall_as_dicts, _fetchone_as_dict


def get_all_purchase_orders() -> list[dict]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM purchase_orders ORDER BY po_number")
        return _fetchall_as_dicts(cursor)
    finally:
        conn.close()


def get_purchase_order_by_number(po_number: str) -> dict | None:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM purchase_orders WHERE po_number = ?", (po_number,)
        )
        return _fetchone_as_dict(cursor)
    finally:
        conn.close()


def search_purchase_orders(query: str) -> list[dict]:
    from utils.database import USE_AZURE_SQL
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if USE_AZURE_SQL:
            cursor.execute(
                "SELECT TOP 10 * FROM purchase_orders "
                "WHERE po_number LIKE ? OR material_name LIKE ? "
                "ORDER BY po_number",
                (f'%{query}%', f'%{query}%')
            )
        else:
            cursor.execute(
                "SELECT * FROM purchase_orders "
                "WHERE po_number LIKE ? OR material_name LIKE ? "
                "ORDER BY po_number LIMIT 10",
                (f'%{query}%', f'%{query}%')
            )
        return _fetchall_as_dicts(cursor)
    finally:
        conn.close()
