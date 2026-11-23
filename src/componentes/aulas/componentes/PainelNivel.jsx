import { useEffect, useState } from 'react';
import { buscarGamificacao } from '../../../servicos/servicoGamificacao';

export function DetalhesNivel({ situacao }) {
  const percentual = Math.max(0, Math.min(100, Number(situacao.percentualNivel) || 0));
  return <>
    <div className="painel-nivel-topo">
      <strong>Nível {situacao.nivel}</strong>
      <span>{Number(situacao.xpTotal).toLocaleString('pt-BR')} XP acumulados · {situacao.questionariosConcluidos ?? 0} {situacao.questionariosConcluidos === 1 ? 'questionário concluído' : 'questionários concluídos'}</span>
    </div>
    <div className="painel-nivel-barra" role="progressbar" aria-label="Progresso no nível atual" aria-valuemin={0} aria-valuemax={situacao.metaNivel} aria-valuenow={situacao.xpNivel}>
      <span style={{ width: `${percentual}%` }} />
    </div>
    <p>{situacao.nivelMaximo
      ? 'Você alcançou o nível máximo.'
      : `${Number(situacao.xpNivel).toLocaleString('pt-BR')} de ${Number(situacao.metaNivel).toLocaleString('pt-BR')} XP neste nível · faltam ${Number(situacao.xpParaProximoNivel).toLocaleString('pt-BR')} XP para o nível ${situacao.nivel + 1}.`}</p>
  </>;
}

export default function PainelNivel({ atualizacao = 0 }) {
  const [situacao, setSituacao] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    buscarGamificacao()
      .then((dados) => { if (ativo) { setSituacao(dados); setErro(''); } })
      .catch((falha) => { if (ativo) setErro(falha.message); });
    return () => { ativo = false; };
  }, [atualizacao]);

  if (erro) return null;
  if (!situacao) return <section className="painel-nivel" aria-busy="true"><p role="status">Carregando seu nível...</p></section>;
  return <section className="painel-nivel" aria-labelledby="painel-nivel-titulo">
    <span className="aulas-etiqueta" id="painel-nivel-titulo">Sua evolução</span>
    <DetalhesNivel situacao={situacao} />
    <p>Acerte 100% de um questionário para ganhar XP uma única vez. A cada nível, a meta de XP para o próximo aumenta.</p>
  </section>;
}
