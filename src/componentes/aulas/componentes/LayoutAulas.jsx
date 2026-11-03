import CabecalhoForum from '../../forum/componentes/CabecalhoForum';
import Rodape from '../../comuns/Rodape';
import '../estilos/aulas.css';

export default function LayoutAulas({ children }) {
  return <div className="app-container">
    <CabecalhoForum />
    <main className="main-content pagina-aulas">{children}</main>
    <Rodape />
  </div>;
}
