import process from 'node:process';
import { createServer as criarServidorVite } from 'vite';
import { arquivoDaAplicacao, instrumentar } from '../../scripts/instrumentacao.js';

export function createServer(opcoes) {
  if (!process.env.COBERTURA_FRONTEND) return criarServidorVite(opcoes);

  const cobertura = {
    name: 'cobertura-testes',
    enforce: 'pre',
    transform(codigo, id) {
      if (arquivoDaAplicacao(id)) return instrumentar(codigo, id);
    },
  };
  return criarServidorVite({ ...opcoes, plugins: [cobertura, ...(opcoes.plugins ?? [])] });
}
