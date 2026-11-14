import { useEffect, useState } from 'react';
import { buscarResumoDashboard, buscarMatriculasPorMes, buscarCursosMaisProcurados, buscarUsuariosPorPerfil } from '../../servicos/servicoDashboard';
import GraficoDashboard from './GraficoDashboard';
import './dashboard.css';

const indicadores = [
  ['alunosAtivos', 'Alunos ativos', 'primary'], ['professoresAtivos', 'Professores ativos', 'success'],
  ['cursosAtivos', 'Cursos ativos', 'info'], ['aulasAtivas', 'Aulas ativas', 'primary'],
  ['matriculas', 'Matrículas', 'success'], ['topicosAtivos', 'Tópicos ativos', 'warning'], ['noticiasAtivas', 'Notícias ativas', 'info'],
];
const perfis = { ALUNO: 'Alunos', PROFESSOR: 'Professores', ADMINISTRADOR: 'Administradores' };

function useConsulta(consulta, dependencia, atualizacao) {
  const [estado, setEstado] = useState({ carregando: true });
  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      if (!ativo) return;
      setEstado({ carregando: true });
      try {
        const dados = await consulta(dependencia);
        if (ativo) setEstado({ dados, carregando: false });
      } catch (erro) {
        if (ativo) setEstado({ erro: erro.message, carregando: false });
      }
    });
    return () => { ativo = false; };
  }, [consulta, dependencia, atualizacao]);
  return estado;
}

function Estado({ estado, repetir, children }) {
  if (estado.carregando) return <p role="status">Carregando indicadores...</p>;
  if (estado.erro) return <div className="alert alert-danger" role="alert">{estado.erro} <button type="button" className="btn btn-secondary btn-small" onClick={repetir}>Tentar novamente</button></div>;
  return children(estado.dados);
}

function PainelGrafico({ titulo, estado, repetir, tipo, preparar, horizontal }) {
  return <section className="card card-outline card-primary dashboard-grafico">
    <div className="card-header"><h3 className="card-title">{titulo}</h3></div>
    <div className="card-body"><Estado estado={estado} repetir={repetir}>{(dados) => {
      if (!dados?.length || dados.every((item) => (item.matriculas ?? item.quantidade) === 0)) return <p>Nenhum registro no período ou categoria consultada.</p>;
      const { rotulos, valores } = preparar(dados);
      return <GraficoDashboard tipo={tipo} rotulos={rotulos} valores={valores} titulo={titulo} horizontal={horizontal} />;
    }}</Estado></div>
  </section>;
}

export default function DashboardAdministrativo() {
  const [meses, setMeses] = useState(12);
  const [atualizacao, setAtualizacao] = useState(0);
  const repetir = () => setAtualizacao((valor) => valor + 1);
  const resumo = useConsulta(buscarResumoDashboard, undefined, atualizacao);
  const matriculas = useConsulta(buscarMatriculasPorMes, meses, atualizacao);
  const cursos = useConsulta(buscarCursosMaisProcurados, undefined, atualizacao);
  const usuarios = useConsulta(buscarUsuariosPorPerfil, undefined, atualizacao);
  return <section className="dashboard-administrativo" aria-labelledby="dashboard-titulo">
    <div className="dashboard-toolbar"><div><h2 id="dashboard-titulo">Indicadores da plataforma</h2><p>Panorama atual de ensino e comunidade</p></div>
      <button type="button" className="btn btn-primary" onClick={repetir} disabled={[resumo, matriculas, cursos, usuarios].some((item) => item.carregando)}>Atualizar indicadores</button>
    </div>
    <Estado estado={resumo} repetir={repetir}>{(dados) => <div className="dashboard-indicadores">{indicadores.map(([campo, nome, cor]) => <article className={`small-box text-bg-${cor}`} key={campo}>
      <div className="inner"><h3>{dados[campo].toLocaleString('pt-BR')}</h3><p>{nome}</p></div>
    </article>)}</div>}</Estado>
    <p className="dashboard-nota">Contas ativas não representam usuários online. Totais e ranking consideram todo o histórico; o período abaixo se aplica apenas à série mensal.</p>
    <label className="dashboard-periodo">Período das matrículas <select className="form-select" value={meses} onChange={(evento) => setMeses(Number(evento.target.value))}>{[1, 3, 6, 12, 24].map((valor) => <option key={valor} value={valor}>{valor} {valor === 1 ? 'mês' : 'meses'}</option>)}</select></label>
    <div className="dashboard-graficos">
      <PainelGrafico titulo="Matrículas por mês" estado={matriculas} repetir={repetir} tipo="line" preparar={(dados) => ({ rotulos: dados.map((item) => { const [ano, mes] = item.mes.split('-'); return `${mes}/${ano}`; }), valores: dados.map((item) => item.matriculas) })} />
      <PainelGrafico titulo="Usuários ativos por perfil" estado={usuarios} repetir={repetir} tipo="doughnut" preparar={(dados) => ({ rotulos: dados.map((item) => perfis[item.perfil] ?? item.perfil), valores: dados.map((item) => item.quantidade) })} />
      <PainelGrafico titulo="Cursos mais procurados · até 10 cursos" estado={cursos} repetir={repetir} tipo="bar" horizontal preparar={(dados) => ({ rotulos: dados.map((item) => item.titulo), valores: dados.map((item) => item.matriculas) })} />
    </div>
  </section>;
}
