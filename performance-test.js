import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Increased duration: Ramp up, stay for 2 minutes, ramp down
  // This gives Grafana Cloud enough time to collect and chart the datapoints
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  cloud: {
    name: 'Dentala Basic API Test',
  },
};

export default function () {
  // IMPORTANT: Replace this URL with the actual local or production URL of your project
  // For example, if your Laravel backend is running locally on port 8000:
  const url = 'https://dentala-ndex.onrender.com'; // Adjust the endpoint as needed

  const res = http.get(url);

  // Validate that the request was successful
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  // Wait for 1 second between iterations for each Virtual User
  sleep(1);
}
