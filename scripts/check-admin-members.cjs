const assert = require('assert/strict');
const path = require('path');
const { createRequire } = require('module');
const load = createRequire(path.resolve(__dirname, '../../matrimony-app/backend/package.json'));
const express = load('express'); const mongoose = load('mongoose'); const jwt = load('jsonwebtoken'); const bcrypt = load('bcryptjs');
const User = load('./models/User'); const Message = load('./models/Message');
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
    const data = { name: 'Test Member', email: ' TEST@example.com ', password: 'test-only-password', age: '26', isPremium: true, role: 'admin', favoriteProfiles: ['invalid'], gstVerified: true };
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
    assert(!('favoriteProfiles' in created)); assert(!('gstVerified' in created)); assert(!('password' in result));
    assert(await bcrypt.compare(data.password, created.password));
    exists = true; await request('POST', '', data, admin, 409); exists = false;
    await request('POST', '', { ...data, password: 'short' }, admin, 400);
    await request('POST', '', { ...data, age: 10 }, admin, 400);
    await request('PUT', '/not-an-id', data, admin, 400);
    await request('PUT', '/' + memberId, data, admin, 200);
    assert.equal(updated.query.role, 'user'); assert(!('password' in updated.update.$set)); assert(!('role' in updated.update.$set)); assert(!('favoriteProfiles' in updated.update.$set));
    exists = true; await request('PUT', '/' + memberId, data, admin, 409); exists = false;
    missing = true; await request('PUT', '/' + memberId, data, admin, 404); await request('DELETE', '/' + memberId, null, admin, 404); missing = false;
    await request('DELETE', '/' + memberId, null, admin, 200);
    assert.equal(deleted.role, 'user'); assert.equal(cleanup.$pull.favoriteProfiles, memberId); assert.equal(cleanup.$pull.interestRequests, memberId); assert.equal(messages.$or[0].sender, memberId);
    log(`${checks} admin API checks passed. Database writes were mocked; no live accounts changed.`);
  } finally { server.close(); }
}
main().catch(error => { log(error); process.exitCode = 1; });
