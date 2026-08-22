import os
import psycopg2

conn_str = None
with open('/var/www/gymdate/.env.local') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            conn_str = line.strip().split('=', 1)[1].strip('\'"')

if conn_str:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partner_requests'")
    cols = cur.fetchall()
    print("partner_requests columns:", cols)
    conn.close()
