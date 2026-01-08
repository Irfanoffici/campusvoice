const fs = require('fs-extra');
const path = require('path');

const adminDist = path.join(__dirname, '../admin/dist');
const frontendAdminDist = path.join(__dirname, '../frontend/dist/admin');

console.log('Copying admin build to frontend/dist/admin...');

// Ensure the destination directory exists
fs.ensureDirSync(frontendAdminDist);

// Copy admin dist to frontend/dist/admin
fs.copySync(adminDist, frontendAdminDist, { overwrite: true });

console.log('✅ Admin build copied successfully!');
