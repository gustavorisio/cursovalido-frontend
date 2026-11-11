import { requisitar } from '../../servicos/api';

export function enviarSolicitacao(dados) {
  return requisitar('/suporte/solicitacoes', {
    method: 'POST', semAutenticacao: true, body: JSON.stringify(dados),
    signal: AbortSignal.timeout(20000),
  });
}
