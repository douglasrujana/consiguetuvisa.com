// Test K6 MÍNIMO - solo verifica conectividad básica
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '5s', target: 1 },
    ],
    thresholds: {
        'http_req_duration': ['p(95) < 300'],
        'http_req_failed': ['rate < 0.01'],
    },
};

const API_URL = 'http://localhost:3001/api/test';

export default function () {
    const res = http.get(API_URL);
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
