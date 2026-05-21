/**
 * Get user's location — tries GPS first, falls back to IP geolocation
 * Returns { city, region, country, latitude, longitude } or null
 */

const IP_API_URL = 'https://ipapi.co/json/';

export async function detectLocation() {
  // Try GPS first
  const gpsLocation = await getGpsLocation();
  if (gpsLocation) return gpsLocation;

  // Fallback to IP
  const ipLocation = await getIpLocation();
  if (ipLocation) return ipLocation;

  return null;
}

function getGpsLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode using OpenStreetMap
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          resolve({
            city: addr.city || addr.town || addr.village || addr.county || '',
            region: addr.state || '',
            country: addr.country || '',
            latitude,
            longitude,
          });
        } catch {
          resolve({ latitude, longitude, city: '', region: '', country: '' });
        }
      },
      () => resolve(null), // GPS denied or error
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function getIpLocation() {
  try {
    const res = await fetch(IP_API_URL);
    const data = await res.json();
    if (data.error) return null;

    return {
      city: data.city || '',
      region: data.region || '',
      country: data.country_name || '',
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch {
    return null;
  }
}