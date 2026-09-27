import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PaginaForum from './componentes/forum/PaginaForum';
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Cadastro from './paginas/Cadastro';
import TermosDeUso from './paginas/TermosDeUso';
import PoliticaDePrivacidade from './paginas/PoliticaDePrivacidade';
import ConfirmacaoEmail from './paginas/ConfirmacaoEmail';
import SolicitarAlteracaoSenha from './paginas/SolicitarAlteracaoSenha';
import AlterarSenha from './paginas/AlterarSenha';
import Configuracoes from './paginas/Configuracoes';
import Administracao from './paginas/Administracao';
import CadastroConvite from './paginas/CadastroConvite';
import RotaProtegida from './componentes/autenticacao/RotaProtegida';
import { AutenticacaoProvedor } from './contextos/ContextoAutenticacao';

function RedirecionarTermosPendentes() {
  const navegar = useNavigate();

  useEffect(() => {
    function redirecionar() {
      navegar('/termos-aceite?reativacao=true', { replace: true });
    }
    globalThis.addEventListener?.('curso-valido-termos-pendentes', redirecionar);
    return () => globalThis.removeEventListener?.('curso-valido-termos-pendentes', redirecionar);
  }, [navegar]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-page">
        <AutenticacaoProvedor><RedirecionarTermosPendentes /><Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/convites/cadastro" element={<CadastroConvite />} />
          <Route path="/confirmacao-email" element={<ConfirmacaoEmail />} />
          <Route path="/solicitar-alteracao-senha" element={<SolicitarAlteracaoSenha />} />
          <Route path="/redefinir-senha" element={<AlterarSenha />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/termos-aceite" element={<TermosDeUso />} />
          <Route path="/termos-aceite.html" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
          <Route path="/politica-privacidade.html" element={<PoliticaDePrivacidade />} />
          <Route element={<RotaProtegida />}><Route path="/forum" element={<PaginaForum />} /><Route path="/configuracoes" element={<Configuracoes />} /></Route>
          <Route element={<RotaProtegida perfis={['ADMINISTRADOR']} />}><Route path="/administracao" element={<Administracao />} /></Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></AutenticacaoProvedor>
      </div>
    </BrowserRouter>
  );
}