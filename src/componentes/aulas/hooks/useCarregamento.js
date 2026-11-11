import { useEffect, useState } from 'react';

// A função de carga deve ser estável (declarada fora do componente ou com useCallback).
export default function useCarregamento(carregar) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function executar() {
      try {
        const resultado = await carregar();
        if (ativo) setDados(resultado);
      } catch (falha) {
        if (ativo) setErro(falha.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    executar();
    return () => { ativo = false; };
  }, [carregar, tentativa]);

  function tentarNovamente() {
    setErro('');
    setCarregando(true);
    setTentativa((valor) => valor + 1);
  }

  return { dados, erro, carregando, tentarNovamente };
}
