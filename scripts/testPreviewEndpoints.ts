import fetch from 'node-fetch';

async function testEndpoints() {
  const sceneId = '1'; // Use a real scene id
  const endpoints = [
    `http://localhost:3000/preview/scene/${sceneId}`,
    'http://localhost:3000/preview/final'
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.error(`${url}: ERROR`, e);
    }
  }
}
testEndpoints();