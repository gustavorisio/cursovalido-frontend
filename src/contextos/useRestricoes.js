import { useAutenticacao } from './useAutenticacao';
import { useCallback, useEffect, useState } from 'react';
import { buscarMinhasRestricoes } from '../servicos/servicoAdministracao';

export function useRestricoes() {
  const { autenticado } = useAutenticacao();
  const [restricoes, setRestricoes] = useState([]);
  const carregar = useCallback(async () => {
    if (!autenticado) return;
    try {
      setRestricoes(await buscarMinhasRestricoes());
    } catch {
      // O servidor continua validando cada operação, mesmo se esta consulta falhar.
    }
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado) return;
    queueMicrotask(carregar);
    function atualizarAoVoltar() {
      if (document.visibilityState === 'visible') carregar();
    }
    const intervalo = window.setInterval(carregar, 60000);
    window.addEventListener('curso-valido-restricoes-alteradas', carregar);
    document.addEventListener('visibilitychange', atualizarAoVoltar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener('curso-valido-restricoes-alteradas', carregar);
      document.removeEventListener('visibilitychange', atualizarAoVoltar);
    };
  }, [carregar, autenticado]);

  function bloqueado(escopo) {
    return autenticado && restricoes.some((item) => {
      if (item.expiraEm) {
        if (new Date(item.expiraEm).getTime() <= Date.now()) return false;
      }
      if (item.escopo === 'CONTA') return true;
      if (item.escopo === 'FORUM') return true;
      if (['TOPICOS', 'COMENTARIOS'].includes(escopo)) {
        return ['TOPICOS', 'COMENTARIOS'].includes(item.escopo);
      }
      return item.escopo === escopo;
    });
  }

  return { restricoes: autenticado ? restricoes : [], bloqueado };
}
