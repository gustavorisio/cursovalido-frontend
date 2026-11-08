import { useEffect, useState } from 'react';

export function useConsultaNoticia(carregar) {
  const [estado, setEstado] = useState({ carregando: true });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      if (!ativo) return;
      setEstado({ carregando: true });
      try {
        const dados = await carregar();
        if (ativo) setEstado({ dados, carregando: false });
      } catch (erro) {
        if (ativo) setEstado({ erro: erro.message, carregando: false });
      }
    });
    return () => { ativo = false; };
  }, [carregar, tentativa]);
  return { ...estado, repetir: () => setTentativa((valor) => valor + 1) };
}


