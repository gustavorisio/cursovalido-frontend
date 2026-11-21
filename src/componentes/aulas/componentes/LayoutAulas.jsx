import Rodape from '../../comuns/Rodape';
import '../estilos/aulas.css';
import '../estilos/aprendizagem.css';

export default function LayoutAulas({ children, className = '' }) {
  return <div className={`app-container ${className}`}>

    <main className={`main-content pagina-aulas ${className}`}>{children}</main>
    <Rodape />
  </div>;
}
