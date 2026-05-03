const fs = require('fs');
let c1 = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');
c1 = c1.replace('{ name: "Users", href: "/admin/users", icon: Users }', '{ name: "Accounts", href: "/admin/users", icon: Users }');
fs.writeFileSync('src/app/admin/layout.tsx', c1);

let c2 = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');
c2 = c2.replace('<h1 className="text-2xl font-black text-secondary">Manage Users</h1>', '<h1 className="text-2xl font-black text-secondary">Account Management</h1>');
c2 = c2.replace('View and manage all platform users separated by role.', 'View and manage all platform accounts, partners, and super admins.');
fs.writeFileSync('src/app/admin/users/page.tsx', c2);
