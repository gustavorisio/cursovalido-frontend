import { useEffect, useState } from 'react';
import { CAlert, CButton, CCard, CCardBody, CCardHeader, CForm, CFormInput, CFormLabel, CFormSelect } from '@coreui/react';
import { buscarAtividadeDia, buscarResumoDashboard, buscarMatriculasPorMes, buscarCursosMaisProcurados, buscarUsuariosPorPerfil } from '../../servicos/servicoDashboard';
import GraficoDashboard from './GraficoDashboard';
import './dashboard.css';

const indicadores = [
  ['alunosAtivos', 'Alunos ativos'], ['professoresAtivos', 'Professores ativos'],
  ['cursosAtivos', 'Cursos ativos'], ['aulasAtivas', 'Aulas ativas'],
  ['matriculas', 'Matrículas'], ['topicosAtivos', 'Tópicos ativos'],
];
const indicadoresDiarios = [
  ['matriculas', 'Matrículas realizadas'], ['cursosCriados', 'Cursos criados'], ['aulasCriadas', 'Aulas criadas'],
  ['topicosCriados', 'Tópicos criados'],
];
const formatoDia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

function Indicadores({ dados, campos }) {
  return <div className="dashboard-indicadores">
    {campos.map(([campo, nome]) => <CCard as="article" className="small-box" key={campo}>
      <CCardBody><p>{nome}</p><strong>{dados[campo].toLocaleString('pt-BR')}</strong></CCardBody>
    </CCard>)}
  </div>;
}

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
  if (estado.erro) return <CAlert color="danger" role="alert">{estado.erro} <CButton type="button" className="btn-secondary btn-small" onClick={repetir}>Tentar novamente</CButton></CAlert>;
  return children(estado.dados);
}

function PainelGrafico({ titulo, estado, repetir, tipo, preparar, horizontal }) {
  return <CCard as="section" className="dashboard-grafico">
    <CCardHeader><h3 className="card-title">{titulo}</h3></CCardHeader>
    <CCardBody><Estado estado={estado} repetir={repetir}>{(dados) => {
      if (!dados?.length || dados.every((item) => (item.matriculas ?? item.quantidade) === 0)) return <p>Nenhum registro no período ou categoria consultada.</p>;
      const { rotulos, valores } = preparar(dados);
      return <GraficoDashboard tipo={tipo} rotulos={rotulos} valores={valores} titulo={titulo} horizontal={horizontal} />;
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
  return <section className="dashboard-administrativo" aria-labelledby="dashboard-titulo">
    <div className="dashboard-toolbar"><div><h2 id="dashboard-titulo">Indicadores da plataforma</h2><p>Panorama atual de ensino e comunidade</p></div>
      <CButton type="button" className="btn-primary" onClick={repetir} disabled={[atividade, resumo, matriculas, cursos, usuarios].some((item) => item.carregando)}>Atualizar indicadores</CButton>
    </div>
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
    <h3 className="dashboard-secao-titulo">Totais atuais da plataforma</h3>
    <Estado estado={resumo} repetir={repetir}>{(dados) => <Indicadores dados={dados} campos={indicadores} />}</Estado>
    <p className="dashboard-nota">Os totais atuais e o ranking de cursos abrangem todo o histórico disponível. Use o período abaixo para alterar a série mensal.</p>

    <label className="dashboard-periodo">Período das matrículas <CFormSelect value={meses} onChange={(evento) => setMeses(Number(evento.target.value))}>{[1, 3, 6, 12, 24].map((valor) => <option key={valor} value={valor}>{valor} {valor === 1 ? 'mês' : 'meses'}</option>)}</CFormSelect></label>
    <div className="dashboard-graficos">
      <PainelGrafico titulo="Matrículas por mês" estado={matriculas} repetir={repetir} tipo="line" preparar={(dados) => ({ rotulos: dados.map((item) => { const [ano, mes] = item.mes.split('-'); return `${mes}/${ano}`; }), valores: dados.map((item) => item.matriculas) })} />
      <PainelGrafico titulo="Usuários ativos por perfil" estado={usuarios} repetir={repetir} tipo="doughnut" preparar={(dados) => ({ rotulos: dados.map((item) => perfis[item.perfil] ?? item.perfil), valores: dados.map((item) => item.quantidade) })} />
      <PainelGrafico titulo="Cursos mais procurados · até 10 cursos" estado={cursos} repetir={repetir} tipo="bar" horizontal preparar={(dados) => ({ rotulos: dados.map((item) => item.titulo), valores: dados.map((item) => item.matriculas) })} />
    </div>
  </section>;
}
