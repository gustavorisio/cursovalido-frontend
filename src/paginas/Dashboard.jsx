import { useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import DashboardAdministrativo from '../componentes/administracao/DashboardAdministrativo';
import VoltarAdministracao from '../componentes/administracao/VoltarAdministracao';
import adminlteCss from 'admin-lte/dist/css/adminlte.min.css?inline';
import '../componentes/administracao/layoutAdminLTE.css';

const css = `@scope (.layout-adminlte) { ${adminlteCss.replaceAll(':root', ':scope')} }`;
const atalhos = [
  ['/administracao/dashboard', '◫', 'Dashboard'], ['/administracao', '⌂', 'Administração'],
  ['/administracao/usuarios', '♙', 'Usuários'],
  ['/noticias', '▧', 'Notícias'], ['/forum', '☷', 'Fórum'], ['/configuracoes', '⚙', 'Configurações'],
];

export default function Dashboard() {
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenu = useRef(null);
  function fecharMenu() { setMenuAberto(false); botaoMenu.current?.focus(); }
  return <div className={`layout-adminlte sidebar-expand-lg ${menuAberto ? 'sidebar-open' : ''}`} data-bs-theme="dark" onKeyDown={(evento) => { if (evento.key === 'Escape') fecharMenu(); }}>
    <style>{css}</style>
    <div className="app-wrapper">
      <a className="dashboard-pular" href="#conteudo-dashboard">Pular para o conteúdo</a>
      <div className="app-header navbar navbar-expand"><div className="container-fluid">
        <button ref={botaoMenu} className="btn btn-outline-light" type="button" aria-controls="menu-dashboard" aria-expanded={menuAberto} onClick={() => setMenuAberto(!menuAberto)}>☰ <span className="visually-hidden">Alternar menu</span></button>
      </div></div>
      <aside className="app-sidebar shadow" id="menu-dashboard" aria-label="Menu do dashboard">
        <div className="sidebar-brand"><Link className="brand-link" to="/administracao"><span className="brand-text">Curso Válido<span className="dashboard-marca">ADMINISTRAÇÃO</span></span></Link></div>
        <div className="sidebar-wrapper"><nav aria-label="Navegação administrativa"><ul className="nav sidebar-menu flex-column">
          {atalhos.map(([rota, icone, texto]) => <li className="nav-item" key={rota}><NavLink end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={rota}><span className="nav-icon" aria-hidden="true">{icone}</span><p>{texto}</p></NavLink></li>)}
        </ul></nav><p className="dashboard-sidebar-nota">Uma visão da aprendizagem e da comunidade.</p></div>
      </aside>
      {menuAberto && <button className="dashboard-menu-fundo" aria-label="Fechar menu" onClick={fecharMenu} />}
      <main className="app-main" id="conteudo-dashboard" tabIndex={-1}>
        <div className="container-fluid dashboard-retorno"><VoltarAdministracao /></div>
        <div className="app-content-header"><div className="container-fluid"><nav aria-label="Localização"><ol className="breadcrumb"><li className="breadcrumb-item"><Link to="/administracao">Administração</Link></li><li className="breadcrumb-item active" aria-current="page">Dashboard</li></ol></nav><h1>Dashboard</h1><p>O pulso da sua plataforma, em um só lugar.</p></div></div>
        <div className="app-content"><div className="container-fluid"><DashboardAdministrativo /></div></div>
      </main>
      <footer className="app-footer"><strong>Curso Válido</strong><span>Aprendizagem e comunidade · Painel administrativo</span></footer>
    </div>
  </div>;
}
