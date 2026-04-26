import http from 'http';

const post = (path, data) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
};

(async () => {
  console.log('Testing API...\n');
  
  // Register user
  const reg = await post('/api/auth/register', {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    bvn: '12345678901'
  });
  console.log('1. Register:', reg);
  
  // Login
  const login = await post('/api/auth/login', {
    email: 'john@example.com',
    password: 'password123'
  });
  console.log('2. Login:', login);
  
  // Create account (with auth token)
  const account = await post('/api/accounts/create', {});
  console.log('3. Create Account (no token):', account);
  
  console.log('\nDone!');
  process.exit(0);
})();
