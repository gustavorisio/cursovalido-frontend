import { Link, useNavigate } from 'react-router-dom';
import FormularioAlterarSenha from '../componentes/autenticacao/FormularioAlterarSenha';
import Rodape from '../componentes/comuns/Rodape';
import { useAutenticacao } from '../contextos/useAutenticacao';

export default function AlterarSenhaConta() {
  const { sair } = useAutenticacao();
  const navegar = useNavigate();

  function concluir() {
    sair();
    navegar('/login', {
      replace: true,
      state: { mensagem: 'Senha alterada com sucesso. Entre com a nova senha.' },
    });
  }

  return <div className="app-container pagina-configuracoes pagina-alterar-senha">
    <main className="main-content">
      <h1 className="page-title">Alterar senha</h1>
      <section className="card configuracoes-conta">
        <Link className="btn btn-link" to="/configuracoes">Voltar para configurações</Link>
        <FormularioAlterarSenha aoConcluir={concluir} />
      </section>
    </main>
    <Rodape />
  </div>;
}
