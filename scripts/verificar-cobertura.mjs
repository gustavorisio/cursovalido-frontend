import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

// Cada feature fornece somente sua própria política. Ao integrar as branches,
// as políticas são combinadas sem alterar os arquivos já acima de 58%.
const pasta = new URL('./cobertura/', import.meta.url);
const limites = readdirSync(pasta).filter(nome => nome.endsWith('.json'))
  .flatMap(nome => JSON.parse(readFileSync(new URL(nome, pasta), 'utf8')));
if (!limites.length) throw new Error('Nenhuma política de cobertura foi encontrada.');

const arquivo = resolve(process.argv[2] ?? 'coverage/coverage-final.json');
const cobertura = JSON.parse(readFileSync(arquivo, 'utf8'));
const falhas = [];
for (const [nome, minimo, maximo] of limites) {
  const entrada = Object.entries(cobertura).find(([caminho]) => caminho.replaceAll('\\', '/').endsWith(`/${nome}`));
  if (!entrada) { falhas.push(`Relatório não contém ${nome}.`); continue; }
  const dados = entrada[1];
  const linhas = new Map();
  for (const [id, trecho] of Object.entries(dados.statementMap)) {
    const linha = trecho.start.line;
    linhas.set(linha, Math.max(linhas.get(linha) ?? 0, dados.s[id]));
  }
  const executadas = [...linhas.values()].filter(quantidade => quantidade > 0).length;
  const percentual = linhas.size ? executadas * 100 / linhas.size : 0;
  if (percentual < minimo || percentual > maximo) {
    falhas.push(`${nome}: ${percentual.toFixed(2)}%, esperado entre ${minimo}% e ${maximo}%.`);
  }
}
if (falhas.length) {
  for (const falha of falhas) process.stderr.write(`${falha}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Cobertura por arquivo aprovada (${limites.length} componentes).\n`);
}
