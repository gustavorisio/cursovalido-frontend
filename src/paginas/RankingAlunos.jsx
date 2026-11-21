import { useEffect, useState } from 'react';
import CabecalhoAulas from '../componentes/aulas/componentes/CabecalhoAulas';
import LayoutAulas from '../componentes/aulas/componentes/LayoutAulas';
import TabelaRankingAlunos from '../componentes/aulas/componentes/TabelaRankingAlunos';
import Paginacao from '../componentes/comuns/Paginacao';
import { buscarRankingAlunos } from '../servicos/servicoGamificacao';

export default function RankingAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    queueMicrotask(async () => {
      try {
        const resposta = await buscarRankingAlunos();
        if (ativo) setAlunos(Array.isArray(resposta) ? resposta : []);
      } catch (falha) { if (ativo) setErro(falha.message); }
      finally { if (ativo) setCarregando(false); }
    });
    return () => { ativo = false; };
  }, []);

  return <LayoutAulas className="pagina-ranking">
    <CabecalhoAulas etiqueta="Comunidade de aprendizagem" titulo="Ranking de alunos" descricao="Níveis, participação nos tópicos e aulas concluídas." />
    {carregando ? <p role="status" className="texto-suave">Carregando ranking…</p> : erro ? <p className="mensagem-erro" role="alert">{erro}</p> : <div className="!rounded-xl !border !border-slate-200 !bg-white !p-2 !shadow-sm sm:!p-4">
      <Paginacao itens={alunos} tamanho={10} rotulo="Páginas do ranking" exibirPaginaUnica>
        {(pagina) => <TabelaRankingAlunos alunos={pagina} />}
      </Paginacao>
    </div>}
  </LayoutAulas>;
}
