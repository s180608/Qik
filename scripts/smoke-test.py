#!/usr/bin/env python3
"""Exercise a test PostgreSQL-backed QIK instance through its public HTTP API."""
import json, os, uuid, urllib.request, urllib.error
base = os.environ.get('QIK_BASE_URL', 'http://localhost:8080').rstrip('/')
password = os.environ.get('DEMO_PASSWORD')
if not password:
    raise SystemExit('Set DEMO_PASSWORD for your test demo instance. No password is printed.')

def call(path, method='GET', body=None, token=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            code, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        code, raw = error.code, error.read()
    if code != expected:
        raise AssertionError(f'{method} {path}: expected {expected}, received {code}: {raw.decode()[:300]}')
    return json.loads(raw) if raw else None

def login(email):
    return call('/api/auth/login', 'POST', {'email': email, 'password': password})['accessToken']

assert call('/api/health')['status'] == 'UP'
config = call('/api/config')
assert config['demo'], 'Run this script only against an opt-in demo test instance.'
admin, rider = login('admin@qik.demo'), login('rider@qik.demo')
email = 'smoke-' + uuid.uuid4().hex + '@test.example'
call('/api/auth/register', 'POST', {'firstName': 'Smoke', 'lastName': 'Test', 'email': email, 'password': password}, expected=201)
customer = login(email)
call('/api/admin/users', token=customer, expected=403)
call('/api/orders', expected=401)
products = call('/api/products')
p = next(p for p in products if p['stockQuantity'] >= 2)
assert call('/api/products/search?keyword=milk'), 'Seeded milk should be searchable.'
body = {'address': '12 Test Street', 'postcode': 'SW1A 1AA', 'requestKey': str(uuid.uuid4()), 'items': [{'productId': p['id'], 'quantity': 2}]}
order = call('/api/orders', 'POST', body, customer, 201)
retry = call('/api/orders', 'POST', body, customer, 201)
assert order['id'] == retry['id'], 'Retry must return the same order.'
assert call('/api/products/' + str(p['id']))['stockQuantity'] == p['stockQuantity'] - 2
assert 'password' not in order['customer']
order_id = str(order['id'])
call('/api/orders/' + order_id + '/status', 'PATCH', {'status': 'DELIVERED'}, customer, 409)
people = call('/api/admin/users', token=admin)
rider_id = next(u['id'] for u in people if u['email'] == 'rider@qik.demo')
for status in ('PICKING', 'READY'):
    call('/api/orders/' + order_id + '/status', 'PATCH', {'status': status}, admin)
call('/api/admin/orders/' + order_id + '/rider', 'PATCH', {'riderId': rider_id}, admin)
assert any(o['id'] == order['id'] for o in call('/api/rider/orders', token=rider))
for status in ('ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'):
    call('/api/orders/' + order_id + '/status', 'PATCH', {'status': status}, rider)
assert call('/api/orders', token=customer)[0]['status'] == 'DELIVERED'
print('PASS: auth, catalogue search, role boundaries, PostgreSQL checkout/retry/stock, assignment and complete delivery flow.')
print('Created and fulfilled one simulated test order. No payment was taken.')
