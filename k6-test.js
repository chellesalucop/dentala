import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configure the Load Test
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 users over 30 seconds
    { duration: '1m', target: 5 },  // Stay at 5 users for 1 minute (Render Free Tier Safe)
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  ext: {
    loadimpact: {
      // Name of the test as it will appear in your Grafana Dashboard
      name: 'Dentala Capacity Test',
      // If you are using Grafana Cloud, you can paste your Project ID here
      // projectID: 1234567 
    }
  }
};

const BASE_URL = 'https://dentala-ndex.onrender.com';

// 2. The actions each virtual user will perform
export default function () {
  // Test loading the dentists list
  let resDentists = http.get(`${BASE_URL}/api/dentists`);
  check(resDentists, { 
    'Dentists list loaded (Status 200)': (r) => r.status === 200,
    'Fast response (under 1 second)': (r) => r.timings.duration < 1000,
  });
  
  sleep(1); // Wait 1 second

  // Test the health endpoint
  let resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, { 
    'Health check passed (Status 200)': (r) => r.status === 200 
  });

  sleep(2); // Wait 2 seconds before looping again
}
