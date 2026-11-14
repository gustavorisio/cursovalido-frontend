import CabecalhoPagina from '../componentes/comuns/CabecalhoPagina';
import { Link } from 'react-router-dom';
import DashboardAdministrativo from '../componentes/administracao/DashboardAdministrativo';
import VoltarAdministracao from '../componentes/administracao/VoltarAdministracao';
import '../componentes/administracao/layoutDashboard.css';

export default function Dashboard() {
  return <div className="layout-dashboard">
    <div className="app-wrapper">
      <a className="dashboard-pular" href="#conteudo-dashboard">Pular para o conteúdo</a>
      <main className="main-content app-main" id="conteudo-dashboard" tabIndex={-1}>
        <div className="container-fluid dashboard-retorno"><VoltarAdministracao /></div>
        <nav className="dashboard-localizacao" aria-label="Localização"><Link to="/administracao">Administração</Link></nav>
        <CabecalhoPagina titulo="Dashboard" descricao="O pulso da sua plataforma, em um só lugar." />
        <div className="app-content"><div className="container-fluid"><DashboardAdministrativo /></div></div>
      </main>
      <footer className="app-footer"><strong>Curso Válido</strong><span>Aprendizagem e comunidade · Painel administrativo</span></footer>
    </div>
  </div>;
}
