// Mede o p95 de latência de GET /boards e GET /tasks (RNF-003: p95 < 300ms
// sob carga normal) contra uma instância já em execução (local ou Docker).
import autocannon from 'autocannon';

const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3000';
const DURATION_SECONDS = Number(process.env.LOAD_TEST_DURATION ?? 10);
const CONNECTIONS = Number(process.env.LOAD_TEST_CONNECTIONS ?? 10);
const P95_BUDGET_MS = 300;

async function setup() {
  const email = `loadtest.${Date.now()}@example.com`;
  const password = 'senha1234';

  await request('POST', '/auth/register', { name: 'Load Test', email, password });
  const login = await request('POST', '/auth/login', { email, password });
  const accessToken = login.body.accessToken;

  const org = await request('POST', '/organizations', { name: 'Load Test Org' }, accessToken);
  const board = await request(
    'POST',
    '/boards',
    { organizationId: org.body.id, name: 'Load Test Board' },
    accessToken,
  );

  return { accessToken, organizationId: org.body.id, boardId: board.body.id };
}

async function request(method, path, body, accessToken) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return { status: res.status, body: json };
}

function runLoadTest(title, url, accessToken) {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url,
        connections: CONNECTIONS,
        duration: DURATION_SECONDS,
        headers: { Authorization: `Bearer ${accessToken}` },
        title,
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
  });
}

function report(title, result) {
  // autocannon não reporta p95 exato — usamos p97_5 (mais rigoroso que p95,
  // então uma aprovação aqui garante o orçamento do RNF-003 com folga).
  const p975 = result.latency.p97_5;
  const verdict = p975 <= P95_BUDGET_MS ? 'OK' : 'FALHOU';
  console.log(
    `\n[${verdict}] ${title} — p97.5=${p975}ms (aprox. de p95; orçamento RNF-003: ${P95_BUDGET_MS}ms), ` +
      `média=${result.latency.mean}ms, req/s=${result.requests.mean.toFixed(1)}, ` +
      `2xx=${result['2xx']}, erros=${result.errors}`,
  );
  return p975 <= P95_BUDGET_MS;
}

async function main() {
  console.log(`Preparando dados de teste em ${BASE_URL}...`);
  const { accessToken, organizationId } = await setup();

  const boardsResult = await runLoadTest(
    'GET /boards?organizationId=',
    `${BASE_URL}/boards?organizationId=${organizationId}`,
    accessToken,
  );
  const tasksResult = await runLoadTest('GET /tasks', `${BASE_URL}/tasks`, accessToken);

  const okBoards = report('GET /boards?organizationId=', boardsResult);
  const okTasks = report('GET /tasks', tasksResult);

  if (!okBoards || !okTasks) {
    console.error('\nRNF-003 não atendido: p95 acima do orçamento de 300ms em pelo menos um endpoint.');
    process.exit(1);
  }
  console.log('\nRNF-003 atendido: p95 dentro do orçamento de 300ms nos dois endpoints de listagem.');
}

main().catch((err) => {
  console.error('Falha ao rodar o teste de carga:', err);
  process.exit(1);
});
