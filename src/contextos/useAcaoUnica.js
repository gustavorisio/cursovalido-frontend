import { useCallback, useRef, useState } from 'react';

// Executa uma ação por vez. A trava por referência barra o segundo clique antes de o React
// atualizar a tela, o que um botão desabilitado por estado sozinho não garante.
export function useAcaoUnica() {
  const emAndamento = useRef(false);
  const [executando, setExecutando] = useState(false);

  const executar = useCallback(async (acao) => {
    if (emAndamento.current) return undefined;
    emAndamento.current = true;
    setExecutando(true);
    try {
      return await acao();
    } finally {
      emAndamento.current = false;
      setExecutando(false);
    }
  }, []);

  return [executar, executando];
}
