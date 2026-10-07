const assert = require('assert/strict');
const path = require('path');
const { createRequire } = require('module');
const load = createRequire(path.resolve(__dirname, '../../matrimony-app/backend/package.json'));
const express = load('express'); const mongoose = load('mongoose'); const jwt = load('jsonwebtoken'); const bcrypt = load('bcryptjs');
const User = load('./models/User'); const Message = load('./models/Message');
const cloudinary = load('cloudinary').v2; const { CloudinaryStorage } = load('multer-storage-cloudinary');
cloudinary.config = () => ({ cloud_name: 'test', api_key: 'test', api_secret: 'test' });
CloudinaryStorage.prototype._handleFile = (req, file, callback) => { file.stream.resume(); callback(null, { path: 'https://example.invalid/' + file.fieldname, filename: 'fixture-file', size: 10 }); };
CloudinaryStorage.prototype._removeFile = (req, file, callback) => callback(null);
const log = console.log;
const adminId = '507f1f77bcf86cd799439011'; const memberId = '507f1f77bcf86cd799439012';
process.env.JWT_SECRET = 'admin-regression-test-only';
mongoose.connect = () => Promise.resolve();
let exists = false, missing = false, revoked = false, created, updated, deleted, cleanup, messages;
User.findById = id => ({ select: async () => ({ role: id === adminId && !revoked ? 'admin' : 'user' }) });
User.exists = async () => exists;
User.create = async data => { created = data; return { toObject: () => ({ ...data, _id: memberId }) }; };
User.findOneAndUpdate = (query, update) => { updated = { query, update }; return { select: async () => missing ? null : ({ _id: memberId, ...update.$set }) }; };
User.findOneAndDelete = async query => { deleted = query; return missing ? null : { _id: memberId }; };
User.updateMany = async (query, update) => { cleanup = update; };
Message.deleteMany = async query => { messages = query; };
let server; const listen = express.application.listen;
express.application.listen = function () { server = listen.call(this, 0); return server; };
console.log = () => {}; console.error = () => {}; console.dir = () => {};
process.chdir(path.resolve(__dirname, '../../matrimony-app/backend'));
require(path.resolve(process.cwd(), 'server.js'));
async function main() {
  try {
    if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
    const base = `http://localhost:${server.address().port}/api/admin/members`;
    const admin = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET);
    const member = jwt.sign({ userId: memberId, role: 'user' }, process.env.JWT_SECRET);
    const data = { name: 'Test Member', email: ' TEST@example.com ', password: 'test-only-password', age: '26', isPremium: true, role: 'admin', favoriteProfiles: ['invalid'], gstVerified: true, businessType: 'Retail', fatherOccupation: 'Farmer', brothersCount: '2', brothersMarried: '1', preferredAgeFrom: '22', preferredAgeTo: '30', landAcres: '2.5', hideMobile: true, profileVisibility: 'Members Only', birthTime: '10:30', kuladeivam: 'Family deity' };
    let checks = 0;
    async function request(method, suffix, body, token, status) {
      const result = await fetch(base + suffix, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      assert.equal(result.status, status); checks++; return result.json();
    }
    for (const [method, suffix] of [['POST', ''], ['PUT', '/' + memberId], ['DELETE', '/' + memberId]]) {
      await request(method, suffix, data, null, 401);
      await request(method, suffix, data, member, 403);
    }
    revoked = true; await request('POST', '', data, admin, 403); revoked = false;
    const result = await request('POST', '', data, admin, 201);
    assert.equal(created.role, 'user'); assert.equal(created.email, 'test@example.com'); assert.equal(created.age, 26);
    assert(!('favoriteProfiles' in created)); assert.equal(created.gstVerified, true); assert(!('password' in result));
    assert.equal(created.brothersCount, 2); assert.equal(created.preferredAgeTo, 30); assert.equal(created.hideMobile, true); assert.equal(created.businessType, 'Retail'); assert.equal(created.landAcres, '2.5'); assert.equal(created.fatherOccupation, 'Farmer'); assert.equal(created.birthTime, '10:30');
    assert(await bcrypt.compare(data.password, created.password));
    exists = true; await request('POST', '', data, admin, 409); exists = false;
    await request('POST', '', { ...data, password: 'short' }, admin, 400);
    await request('POST', '', { ...data, age: 10 }, admin, 400);
    await request('POST', '', { ...data, brothersCount: '-1' }, admin, 400);
    await request('POST', '', { ...data, preferredAgeFrom: '35' }, admin, 400);
    await request('POST', '', { ...data, brothersMarried: '3' }, admin, 400);
    await request('PUT', '/not-an-id', data, admin, 400);
    await request('PUT', '/' + memberId, data, admin, 200);
    assert.equal(updated.query.role, 'user'); assert(!('password' in updated.update.$set)); assert(!('role' in updated.update.$set)); assert(!('favoriteProfiles' in updated.update.$set));
    assert(!('image' in updated.update.$set)); assert(!('$push' in updated.update));
    async function upload(method, suffix) {
      const body = new FormData();
      Object.entries(data).filter(([key]) => !['role', 'favoriteProfiles'].includes(key)).forEach(([key, value]) => body.append(key, value));
      body.append('image', new Blob(['fixture'], { type: 'image/jpeg' }), 'test.jpg');
      body.append('familyPhotos', new Blob(['fixture'], { type: 'image/jpeg' }), 'family.jpg');
      body.append('horoscopeFile', new Blob(['fixture'], { type: 'application/pdf' }), 'horoscope.pdf');
      const response = await fetch(base + suffix, { method, headers: { Authorization: `Bearer ${admin}` }, body });
      assert.equal(response.status, method === 'POST' ? 201 : 200); checks++;
    }
    await upload('POST', '');
    assert.equal(created.image, 'https://example.invalid/image'); assert.equal(created.horoscopeFile, 'https://example.invalid/horoscopeFile'); assert.equal(created.hideMobile, true); assert.equal(created.isPremium, true); assert.deepEqual(created.familyPhotos, ['https://example.invalid/familyPhotos']);
    await upload('PUT', '/' + memberId);
    assert.deepEqual(updated.update.$push.familyPhotos.$each, ['https://example.invalid/familyPhotos']); assert(!('familyPhotos' in updated.update.$set));
    exists = true; await request('PUT', '/' + memberId, data, admin, 409); exists = false;
    missing = true; await request('PUT', '/' + memberId, data, admin, 404); await request('DELETE', '/' + memberId, null, admin, 404); missing = false;
    await request('DELETE', '/' + memberId, null, admin, 200);
    assert.equal(deleted.role, 'user'); assert.equal(cleanup.$pull.favoriteProfiles, memberId); assert.equal(cleanup.$pull.interestRequests, memberId); assert.equal(messages.$or[0].sender, memberId);
    log(`${checks} admin API checks passed. Database writes were mocked; no live accounts changed.`);
  } finally { server.close(); }
}
main().catch(error => { log(error); process.exitCode = 1; });
