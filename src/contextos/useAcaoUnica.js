import { useCallback, useRef, useState } from 'react';

// Impede envios simultâneos antes da atualização da tela.
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
