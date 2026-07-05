import { E2E_DATABASE_URL } from './e2e-database-url';

process.env.DATABASE_URL = E2E_DATABASE_URL;
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'e2e-test-secret';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '15m';
if (!process.env.JWT_REFRESH_EXPIRES_IN) process.env.JWT_REFRESH_EXPIRES_IN = '7d';
// Suítes e2e rodam --runInBand contra a mesma instância da app e registram/logam
// dezenas de vezes por execução — o rate limit de produção (5/min) travaria os testes.
process.env.AUTH_THROTTLE_LIMIT = '1000';
