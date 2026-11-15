import { requisitar } from '../../servicos/api';

export function enviarSolicitacao(dados) {
  const { emailConta, usuario, motivo, assunto, descricao } = dados;
  return requisitar('/suporte/solicitacoes', {
    method: 'POST', semAutenticacao: true, body: JSON.stringify({ emailConta, usuario, motivo, assunto, descricao }),
    signal: AbortSignal.timeout(20000),
  });
}
