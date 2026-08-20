#!/bin/bash
# Write JSON payload and call the local Next.js API
cat > /tmp/admin_payload.json << 'ENDJSON'
{"email":"santoedgepvtltd@gmail.com","password":"AdminGymdate2024","full_name":"Super Admin"}
ENDJSON

echo "=== Creating Super Admin ==="
curl -s -X PUT http://localhost:3000/api/admin/setup-admin-table \
  -H "Content-Type: application/json" \
  -d @/tmp/admin_payload.json

echo ""
echo "=== Checking admin_users table ==="
curl -s http://localhost:3000/api/admin/setup-admin-table
echo ""
