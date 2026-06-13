import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.NVIDIA_TEXT_API_KEY;
  console.log('NVIDIA_API_KEY starts with:', apiKey ? apiKey.substring(0, 10) : 'none');
  
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('GET /v1/models Status:', res.status);
    if (!res.ok) {
      console.log('Error text:', await res.text());
      return;
    }
    const data = await res.json();
    console.log('Available models count:', data.data?.length || 0);
    console.dir(data.data?.map(m => m.id), { maxArrayLength: null });
  } catch (e) {
    console.error('Error fetching models:', e);
  }
}

main();
