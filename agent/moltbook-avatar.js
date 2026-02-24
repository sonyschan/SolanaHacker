import 'dotenv/config';
import fs from 'fs';

const API_KEY = process.env.MOLTBOOK_API_KEY;
const BASE = 'https://www.moltbook.com/api/v1';

// Try uploading Memeya avatar from the app assets
const avatarPaths = [
  '/home/projects/solanahacker/app/public/memeya-avatar.png',
  '/home/projects/solanahacker/app/src/assets/memeya-avatar.png',
  '/home/projects/solanahacker/app/public/memeya.png',
  '/home/projects/solanahacker/app/src/assets/memeya.png',
];

let avatarPath;
for (const p of avatarPaths) {
  if (fs.existsSync(p)) { avatarPath = p; break; }
}

if (!avatarPath) {
  // Search for any memeya image
  const { execSync } = await import('child_process');
  const found = execSync('find /home/projects/solanahacker -name "*memeya*" -type f 2>/dev/null | head -10').toString().trim();
  console.log('No avatar found at expected paths. Found files:', found);
  process.exit(1);
}

console.log('Using avatar:', avatarPath);
const fileData = fs.readFileSync(avatarPath);
const blob = new Blob([fileData], { type: 'image/png' });
const form = new FormData();
form.append('avatar', blob, 'memeya-avatar.png');

const res = await fetch(`${BASE}/agents/me/avatar`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: form,
});
console.log(`Avatar upload status: ${res.status}`);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
