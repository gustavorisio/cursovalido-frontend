import { requisitar } from './api';

export async function buscarPermissoesAdministrativas() {
  try {
    return await requisitar('/administracao/permissoes');
  } catch (erro) {
    if (erro.status === 404) {
      throw new Error('A administração está indisponível. Tente novamente mais tarde.', { cause: erro });
    }
    throw erro;
  }
}

export function buscarUsuariosAdministrativos() {
  return requisitar('/administracao/usuarios');
}

export function aplicarSuspensao(idUsuario, dados) {
  return requisitar(`/administracao/usuarios/${idUsuario}/suspensoes`, {
    method: 'POST', body: JSON.stringify(dados),
  });
}

export function revogarSuspensao(idUsuario, idSuspensao) {
  return requisitar(`/administracao/usuarios/${idUsuario}/suspensoes/${idSuspensao}`, { method: 'DELETE' });
}

export function buscarMinhasRestricoes() {
  return requisitar('/autenticacao/restricoes');
}
