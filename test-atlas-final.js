async function test() {
  try {
    const regRes = await fetch('http://localhost:3000/api?route=auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', name: 'Test Atlas Now', email: 'atlasnow2@example.com', password: 'password123' })
    });
    console.log('Status:', regRes.status);
    console.log('Headers:', regRes.headers.get('content-type'));
    const text = await regRes.text();
    console.log('Response text:', text);
    const regData = JSON.parse(text);
    console.log('Register:', regData.success);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();