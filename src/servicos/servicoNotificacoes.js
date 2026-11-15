import { requisitar } from './api';

export const LIMITE_CONTEUDO_COMUNICADO = 5000;
export const EVENTO_NOTIFICACOES = 'curso-valido-notificacoes-alteradas';

export function listarComunicados(pagina = 0, administrador = false) {
  const rota = administrador ? '/administracao/comunicados' : '/aluno/notificacoes';
  return requisitar(`${rota}?page=${pagina}&size=10`);
}

export const contarNaoLidas = () => requisitar('/aluno/notificacoes/nao-lidas');

function salvarComunicado(caminho, metodo, { titulo, conteudo }) {
  if (!titulo.trim() || !conteudo.trim()) throw new Error('Preencha o título e o conteúdo.');
  if (titulo.length > 255) throw new Error('O título deve ter no máximo 255 caracteres.');
  if (conteudo.length > LIMITE_CONTEUDO_COMUNICADO) throw new Error('O conteúdo deve ter no máximo 5.000 caracteres.');
  return requisitar(caminho, {
    method: metodo, body: JSON.stringify({ titulo: titulo.trim(), conteudo: conteudo.trim() }),
  });
}

export const publicarComunicado = dados => salvarComunicado('/administracao/comunicados', 'POST', dados);
export const editarComunicado = (id, dados) => salvarComunicado(`/administracao/comunicados/${id}`, 'PUT', dados);
export const excluirComunicado = id => requisitar(`/administracao/comunicados/${id}`, { method: 'DELETE' });

export async function marcarComunicadoLido(id) {
  await requisitar(`/aluno/notificacoes/${id}/lida`, { method: 'PUT' });
  window.dispatchEvent(new Event(EVENTO_NOTIFICACOES));
}
