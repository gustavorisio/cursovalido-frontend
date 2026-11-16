import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import coverage from 'istanbul-lib-coverage';
import report from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import { arquivoDaAplicacao, criarInstrumentador } from './instrumentacao.js';

const pastaTemporaria = mkdtempSync(join(tmpdir(), 'cursovalido-cobertura-'));
const mapa = coverage.createCoverageMap({});

try {
  const resultado = spawnSync(process.execPath, ['--import', './scripts/coletar-cobertura.js', '--test'], {
    env: { ...process.env, COBERTURA_FRONTEND: pastaTemporaria },
    stdio: 'inherit',
  });
  if (resultado.error) throw resultado.error;
  process.exitCode = resultado.status ?? 1;
  for (const arquivo of readdirSync(pastaTemporaria)) {
    mapa.merge(JSON.parse(readFileSync(join(pastaTemporaria, arquivo), 'utf8')));
  }
} finally {
  rmSync(pastaTemporaria, { recursive: true, force: true });
}

const instrumentador = criarInstrumentador();
const cobertos = new Set(mapa.files());
for (const arquivo of readdirSync('src', { recursive: true })) {
  const caminho = resolve('src', arquivo);
  if (arquivoDaAplicacao(caminho) && !cobertos.has(caminho)) {
    instrumentador.instrumentSync(readFileSync(caminho, 'utf8'), caminho);
    mapa.addFileCoverage(instrumentador.lastFileCoverage());
  }
}

const contexto = report.createContext({ coverageMap: mapa, dir: 'coverage' });
for (const formato of ['text', 'html', 'json']) reports.create(formato).execute(contexto);

const { lines } = mapa.getCoverageSummary();
if (lines.covered * 100 < lines.total * 75) {
  console.error('A cobertura global de linhas precisa atingir 75%.');
  process.exitCode = 1;
}
