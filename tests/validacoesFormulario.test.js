import { test } from 'vitest';
import assert from 'node:assert/strict';
import { validarDocumento, validarUrlYoutube } from '../src/servicos/validacoesFormulario.js';

test('documento exige nome e conteúdo preenchidos', () => {
  assert.equal(validarDocumento(' ', 'Texto'), 'Preencha o nome do documento.');
  assert.equal(validarDocumento('Termos', ' '), 'Preencha o conteúdo do documento.');
  assert.equal(validarDocumento('Termos', 'Texto'), '');
});

test('valida links de vídeo nas versões curta e completa do YouTube', () => {
  assert.equal(validarUrlYoutube(' https://youtu.be/abc123DE_fg '), true);
  assert.equal(validarUrlYoutube('https://www.youtube.com/watch?v=abc123DE_fg'), true);
  assert.equal(validarUrlYoutube('https://m.youtube.com/watch?v=abc123DE_fg'), true);
});

test('recusa links malformados e endereços que não apontam para um vídeo do YouTube', () => {
  for (const url of [
    'texto sem endereço',
    'http://youtu.be/abc123DE_fg',
    'https://conta@youtu.be/abc123DE_fg',
    'https://youtu.be:8080/abc123DE_fg',
    'https://youtube.com.example.com/watch?v=abc123DE_fg',
    'https://www.youtube.com/watch?v=curto',
    'https://www.youtube.com/playlist?v=abc123DE_fg',
  ]) {
    assert.equal(validarUrlYoutube(url), false, url);
  }
});
