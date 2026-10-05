const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

async function main() {
  const backend = path.resolve(process.argv[2] || path.join(__dirname, '../../matrimony-app/backend'));
  const load = createRequire(path.join(backend, 'package.json'));
  const dotenv = load('dotenv');
  const mongoose = load('mongoose');
  const bcrypt = load('bcryptjs');
  const User = load('./models/User');
  const envPath = path.join(backend, '.env');
  const env = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) throw new Error('Backend MONGODB_URI is not configured.');
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const { email: rawEmail, password } = JSON.parse(input);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Use a password of at least 12 characters and at most 72 UTF-8 bytes.');
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const existing = await User.findOne({ email }).select('_id role');
    if (existing) throw new Error('This email already has an account. No account was changed.');
    await User.create({ name: 'Administrator', email, password: await bcrypt.hash(password, 12), role: 'admin' });
    console.log('Admin account created. Use the email and password you entered to sign in.');
    console.log('The admin panel must connect to the backend using this same database.');
  } finally {
    await mongoose.disconnect();
  }
}
main().catch(error => {
  // Connection errors can contain database credentials; never print their raw messages.
  const safe = ['Enter a valid', 'Use a password', 'This email already', 'Backend MONGODB_URI'];
  console.error(safe.some(prefix => error.message.startsWith(prefix)) ? error.message : 'Admin setup failed. Check the backend database connection and installed dependencies.');
  process.exitCode = 1;
});
