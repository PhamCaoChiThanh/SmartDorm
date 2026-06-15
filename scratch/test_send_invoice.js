async function main() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    const token = loginData.token || (loginData.data && loginData.data.token);
    console.log('Token:', token);

    console.log('Sending invoice...');
    const sendRes = await fetch(
      'http://localhost:3001/api/invoices/a9ac4506-1215-4984-a3cd-4fcde545249e/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const result = await sendRes.json();
    console.log('Result Status:', sendRes.status);
    console.log('Result Data:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
