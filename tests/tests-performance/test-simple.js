// Test K6 mínimo - solo prueba que el endpoint responde
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    duration: '3s',
};

const API_URL = 'http://localhost:3001/api/test';

export default function () {
    // Test GET
    const getRes = http.get(API_URL);
    check(getRes, {
        'GET status is 200': (r) => r.status === 200,
        'GET has message': (r) => r.json().message !== undefined,
    });

    // Test POST
    const postRes = http.post(API_URL, JSON.stringify({ test: 'data' }), {
        headers: { 'Content-Type': 'application/json' },
    });
    check(postRes, {
        'POST status is 200': (r) => r.status === 200,
        'POST has message': (r) => r.json().message !== undefined,
    });
}
