import Rodape from '../../comuns/Rodape';
import '../estilos/aulas.css';
import '../estilos/aprendizagem.css';

export default function LayoutAulas({ children }) {
  return <div className="app-container">

    <main className="main-content pagina-aulas">{children}</main>
    <Rodape />
  </div>;
}
