import { useEffect, useState } from 'react';
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CForm, CFormInput, CFormLabel, CFormSelect } from '@coreui/react';
import { buscarAtividadeDia, buscarResumoDashboard, buscarMatriculasPorMes, buscarCursosMaisProcurados, buscarUsuariosPorPerfil } from '../../servicos/servicoDashboard';
import GraficoDashboard from './GraficoDashboard';
import './dashboard.css';
import { buscarRankingAlunos } from '../../servicos/servicoGamificacao';
import TabelaRankingAlunos from '../aulas/componentes/TabelaRankingAlunos';

const indicadoresEnsino = [
  ['alunosAtivos', 'Alunos ativos'], ['alunosEngajados', 'Alunos que concluíram aulas'],
  ['matriculas', 'Matrículas'], ['aulasConcluidas', 'Aulas concluídas'],
  ['cursosConcluidos', 'Cursos concluídos'], ['taxaConclusaoMatriculas', 'Taxa de conclusão das matrículas', '%'],
  ['nivelMedioAlunos', 'Nível médio dos alunos'],
];
const indicadoresPlataforma = [
  ['cursosAtivos', 'Cursos ativos'], ['aulasAtivas', 'Aulas publicadas'],
  ['professoresAtivos', 'Professores ativos'], ['topicosAtivos', 'Tópicos ativos'],
];
const indicadoresDiarios = [
  ['matriculas', 'Matrículas realizadas'], ['aulasConcluidas', 'Aulas concluídas'], ['cursosConcluidos', 'Cursos concluídos'],
  ['cursosCriados', 'Cursos criados'], ['aulasCriadas', 'Aulas criadas'], ['topicosCriados', 'Tópicos criados'],
];
const formatoDia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });
const perfis = { ALUNO: 'Alunos', PROFESSOR: 'Professores', ADMINISTRADOR: 'Administradores' };

function formatar(valor, sufixo = '') {
  if (valor === null || valor === undefined) return 'Sem dados';
  return `${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${sufixo}`;
}

function Indicadores({ dados, campos }) {
  return <div className="dashboard-indicadores">
    {campos.map(([campo, nome, sufixo]) => <CCard as="article" className="small-box" key={campo}>
      <CCardBody><p>{nome}</p><strong>{formatar(dados[campo], sufixo)}</strong></CCardBody>
    </CCard>)}
  </div>;
}

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
  if (estado.erro) return <CAlert color="danger" role="alert">{estado.erro} <CButton type="button" className="btn-secondary btn-small" onClick={repetir}>Tentar novamente</CButton></CAlert>;
  return children(estado.dados);
}

function PainelGrafico({ titulo, descricao, estado, repetir, tipo, preparar, horizontal, vazio }) {
  return <CCard as="section" className="dashboard-grafico">
    <CCardHeader><h3 className="card-title">{titulo}</h3>{descricao ? <p className="dashboard-nota">{descricao}</p> : null}</CCardHeader>
    <CCardBody><Estado estado={estado} repetir={repetir}>{(dados) => {
      if (!dados?.length || vazio(dados)) return <p>Nenhum registro no período ou categoria consultada.</p>;
      const { rotulos, valores, series } = preparar(dados);
      return <GraficoDashboard tipo={tipo} rotulos={rotulos} valores={valores} series={series} titulo={titulo} horizontal={horizontal} />;
    }}</Estado></CCardBody>
  </CCard>;
}

export default function DashboardAdministrativo() {
  const hoje = formatoDia.format(new Date());
  const [data, setData] = useState(hoje);
  const [meses, setMeses] = useState(12);
  const [atualizacao, setAtualizacao] = useState(0);
  const repetir = () => setAtualizacao((valor) => valor + 1);
  const atividade = useConsulta(buscarAtividadeDia, data, atualizacao);
  const resumo = useConsulta(buscarResumoDashboard, undefined, atualizacao);
  const matriculas = useConsulta(buscarMatriculasPorMes, meses, atualizacao);
  const cursos = useConsulta(buscarCursosMaisProcurados, undefined, atualizacao);
  const usuarios = useConsulta(buscarUsuariosPorPerfil, undefined, atualizacao);
  const ranking = useConsulta(buscarRankingAlunos, undefined, atualizacao);
  const consultas = [atividade, resumo, matriculas, cursos, usuarios, ranking];
  return <section className="dashboard-administrativo" aria-labelledby="dashboard-titulo">
    <div className="dashboard-toolbar"><div><h2 id="dashboard-titulo">Indicadores do Curso Válido</h2><p>Aprendizagem, engajamento e público da plataforma</p></div>
      <CButton type="button" className="btn-primary" onClick={repetir} disabled={consultas.some((item) => item.carregando)}>Atualizar indicadores</CButton>
    </div>

    <h3 className="dashboard-secao-titulo">Aprendizagem</h3>
    <Estado estado={resumo} repetir={repetir}>{(dados) => <Indicadores dados={dados} campos={indicadoresEnsino} />}</Estado>

    <CCard as="section" className="dashboard-grafico" aria-labelledby="dashboard-ranking-titulo">
      <CCardHeader><h3 id="dashboard-ranking-titulo" className="card-title">Ranking de alunos por nível</h3></CCardHeader>
      <CCardBody><Estado estado={ranking} repetir={repetir}>{(dados) => <TabelaRankingAlunos alunos={dados.slice(0, 5)} />}</Estado></CCardBody>
    </CCard>

    <h3 className="dashboard-secao-titulo">Plataforma e público</h3>
    <Estado estado={resumo} repetir={repetir}>{(dados) => <Indicadores dados={dados} campos={indicadoresPlataforma} />}</Estado>

    <CCard as="section" className="dashboard-dia" aria-labelledby="dashboard-dia-titulo">
      <CCardHeader><h3 id="dashboard-dia-titulo" className="card-title">Atividade por data</h3></CCardHeader>
      <CCardBody>
        <CForm className="dashboard-filtro-data" onSubmit={(evento) => {
          evento.preventDefault();
          const dataEscolhida = evento.currentTarget.elements.namedItem('data').value;
          if (dataEscolhida && dataEscolhida <= hoje) setData(dataEscolhida);
        }}>
          <div>
            <CFormLabel htmlFor="dashboard-data">Data da atividade</CFormLabel>
            <CFormInput id="dashboard-data" name="data" type="date" defaultValue={hoje} max={hoje} required />
          </div>
          <CButton className="btn-primary" type="submit">Consultar data</CButton>
        </CForm>
        <Estado estado={atividade} repetir={repetir}>{(dados) => <>
          <p className="dashboard-data-consultada">Registros de <strong>{dados.data.split('-').reverse().join('/')}</strong></p>
          <Indicadores dados={dados} campos={indicadoresDiarios} />
        </>}</Estado>
      </CCardBody>
    </CCard>

    <p className="dashboard-nota">Os totais e o ranking de cursos abrangem todo o histórico disponível. Use o período abaixo para alterar a série mensal.</p>
    <label className="dashboard-periodo">Período da série mensal <CFormSelect value={meses} onChange={(evento) => setMeses(Number(evento.target.value))}>{[1, 3, 6, 12, 24].map((valor) => <option key={valor} value={valor}>{valor} {valor === 1 ? 'mês' : 'meses'}</option>)}</CFormSelect></label>
    <div className="dashboard-graficos">
      <PainelGrafico titulo="Matrículas e aulas concluídas por mês" estado={matriculas} repetir={repetir} tipo="line"
        vazio={(dados) => dados.every((item) => item.matriculas === 0 && (item.aulasConcluidas ?? 0) === 0)}
        preparar={(dados) => ({
          rotulos: dados.map((item) => { const [ano, mes] = item.mes.split('-'); return `${mes}/${ano}`; }),
          series: [
            { nome: 'Matrículas', valores: dados.map((item) => item.matriculas) },
            { nome: 'Aulas concluídas', valores: dados.map((item) => item.aulasConcluidas ?? 0) },
          ],
        })} />
      <PainelGrafico titulo="Cursos mais procurados · até 10 cursos" descricao="Matrículas, aulas concluídas e conclusões completas de cada curso."
        estado={cursos} repetir={repetir} tipo="bar" horizontal vazio={(dados) => dados.every((item) => item.matriculas === 0)}
        preparar={(dados) => ({
          rotulos: dados.map((item) => item.titulo),
          series: [
            { nome: 'Matrículas', valores: dados.map((item) => item.matriculas) },
            { nome: 'Cursos concluídos', valores: dados.map((item) => item.conclusoes ?? 0) },
          ],
        })} />
      <PainelGrafico titulo="Usuários ativos por perfil" estado={usuarios} repetir={repetir} tipo="doughnut"
        vazio={(dados) => dados.every((item) => item.quantidade === 0)}
        preparar={(dados) => ({ rotulos: dados.map((item) => perfis[item.perfil] ?? item.perfil), valores: dados.map((item) => item.quantidade) })} />
    </div>
  </section>;
}
