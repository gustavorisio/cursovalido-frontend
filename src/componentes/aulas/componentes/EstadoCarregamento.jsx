export default function EstadoCarregamento({ carga }) {
  if (carga.carregando) return <div className="card empty-list" role="status">Carregando...</div>;
  if (carga.erro) return <div className="card">
    <p className="mensagem-erro" role="alert">{carga.erro}</p>
    <button className="btn btn-secondary" type="button" onClick={carga.tentarNovamente}>Tentar novamente</button>
  </div>;
  return null;
}
