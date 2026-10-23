// API tests using Node's built-in test runner.
// Run with: MONGODB_URI=<test database uri> JWT_SECRET=test npm test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const app = require('../src/app');

let server;
let base;
const stamp = Date.now();

async function call(method, path, body, token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

test.before(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_test');
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server.close();
  await mongoose.disconnect();
});

let tokenA;
let tokenB;
let expenseId;

test('register rejects bad input', async () => {
  const r = await call('POST', '/api/auth/register', { name: 'A', email: 'nope', password: '123' });
  assert.strictEqual(r.status, 400);
});

test('register and login work, duplicate email gives 409', async () => {
  const a = await call('POST', '/api/auth/register', {
    name: 'Asha', email: `asha${stamp}@example.com`, password: 'password123',
  });
  assert.strictEqual(a.status, 201);
  assert.ok(a.data.token);
  tokenA = a.data.token;

  const b = await call('POST', '/api/auth/register', {
    name: 'Ben', email: `ben${stamp}@example.com`, password: 'password123',
  });
  tokenB = b.data.token;

  const dup = await call('POST', '/api/auth/register', {
    name: 'Asha', email: `asha${stamp}@example.com`, password: 'password123',
  });
  assert.strictEqual(dup.status, 409);

  const login = await call('POST', '/api/auth/login', {
    email: `asha${stamp}@example.com`, password: 'password123',
  });
  assert.strictEqual(login.status, 200);

  const bad = await call('POST', '/api/auth/login', {
    email: `asha${stamp}@example.com`, password: 'wrong-password',
  });
  assert.strictEqual(bad.status, 401);
});

test('login blocks NoSQL operator injection', async () => {
  const r = await call('POST', '/api/auth/login', { email: { $gt: '' }, password: { $gt: '' } });
  assert.strictEqual(r.status, 400);
});

test('expense routes need a token', async () => {
  const r = await call('GET', '/api/expenses');
  assert.strictEqual(r.status, 401);
});

test('create expense validates input', async () => {
  const empty = await call('POST', '/api/expenses', { title: '', amount: 10 }, tokenA);
  assert.strictEqual(empty.status, 400);
  const neg = await call('POST', '/api/expenses', { title: 'Tea', amount: -5 }, tokenA);
  assert.strictEqual(neg.status, 400);
  const cat = await call('POST', '/api/expenses', { title: 'Tea', amount: 5, category: 'Nope' }, tokenA);
  assert.strictEqual(cat.status, 400);
});

test('create, list, update and summarise expenses', async () => {
  const created = await call('POST', '/api/expenses',
    { title: 'Lunch', amount: 120.5, category: 'Food', date: '2026-10-10' }, tokenA);
  assert.strictEqual(created.status, 201);
  expenseId = created.data._id;

  await call('POST', '/api/expenses',
    { title: 'Bus pass', amount: 300, category: 'Travel', date: '2026-10-11' }, tokenA);
  await call('POST', '/api/expenses',
    { title: 'Dinner', amount: 80, category: 'Food', date: '2026-10-12' }, tokenA);

  const list = await call('GET', '/api/expenses?limit=2&page=1', null, tokenA);
  assert.strictEqual(list.status, 200);
  assert.strictEqual(list.data.items.length, 2);
  assert.strictEqual(list.data.total, 3);
  assert.strictEqual(list.data.totalPages, 2);

  const food = await call('GET', '/api/expenses?category=Food', null, tokenA);
  assert.strictEqual(food.data.total, 2);

  const upd = await call('PUT', `/api/expenses/${expenseId}`,
    { title: 'Big lunch', amount: 150, category: 'Food', date: '2026-10-10' }, tokenA);
  assert.strictEqual(upd.status, 200);
  assert.strictEqual(upd.data.title, 'Big lunch');

  const sum = await call('GET', '/api/expenses/summary?month=2026-10', null, tokenA);
  assert.strictEqual(sum.status, 200);
  assert.strictEqual(sum.data.total, 530);
  const food2 = sum.data.byCategory.find((c) => c.category === 'Food');
  assert.strictEqual(food2.total, 230);
});

test("a user cannot read, edit or delete another user's expense", async () => {
  const get = await call('GET', `/api/expenses/${expenseId}`, null, tokenB);
  assert.strictEqual(get.status, 404);
  const put = await call('PUT', `/api/expenses/${expenseId}`,
    { title: 'Hacked', amount: 1, category: 'Food' }, tokenB);
  assert.strictEqual(put.status, 404);
  const del = await call('DELETE', `/api/expenses/${expenseId}`, null, tokenB);
  assert.strictEqual(del.status, 404);

  const listB = await call('GET', '/api/expenses', null, tokenB);
  assert.strictEqual(listB.data.total, 0);
});

test('invalid id gives 400 and delete works for the owner', async () => {
  const bad = await call('GET', '/api/expenses/not-an-id', null, tokenA);
  assert.strictEqual(bad.status, 400);

  const del = await call('DELETE', `/api/expenses/${expenseId}`, null, tokenA);
  assert.strictEqual(del.status, 200);
  const again = await call('GET', `/api/expenses/${expenseId}`, null, tokenA);
  assert.strictEqual(again.status, 404);
});
