import { CChart } from '@coreui/react-chartjs';

const cores = ['#b8860b', '#1f6feb', '#1a7f37', '#8250df', '#cf222e', '#57606a'];
const texto = '#1f2328';
const suave = '#57606a';
const linha = '#eadca8';

export default function GraficoDashboard({ tipo, rotulos, valores, titulo, horizontal = false, series }) {
  const coresCategorias = rotulos.map((_, indice) => cores[indice % cores.length]);
  const ehLinha = tipo === 'line';
  const ehRosca = tipo === 'doughnut';
  const conjuntos = series?.length ? series : [{ nome: titulo, valores }];
  const multiplas = conjuntos.length > 1;
  const dados = {
    labels: rotulos,
    datasets: conjuntos.map((serie, indice) => {
      const cor = cores[indice % cores.length];
      const porCategoria = !ehLinha && !multiplas;
      return {
        label: serie.nome,
        data: serie.valores,
        borderColor: porCategoria ? coresCategorias : cor,
        backgroundColor: ehLinha ? `${cor}22` : porCategoria ? coresCategorias : cor,
        pointBackgroundColor: cor,
        borderWidth: 2,
        tension: 0.25,
        fill: ehLinha && !multiplas,
      };
    }),
  };
  const opcoes = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    animation: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : undefined,
    plugins: { legend: { display: ehRosca || multiplas, labels: { color: texto } } },
    ...(ehRosca ? {} : {
      scales: {
        [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0, color: suave }, grid: { color: linha } },
        [horizontal ? 'y' : 'x']: { ticks: { color: suave }, grid: { display: false } },
      },
    }),
  };

  return <>
    <div className="dashboard-canvas">
      <CChart type={tipo} data={dados} options={opcoes} wrapper={false} customTooltips={false} aria-label={titulo} />
    </div>
    <details><summary>Consultar dados do gráfico</summary>
      <table className="table"><caption>{titulo}</caption>
        <thead><tr><th scope="col">Categoria</th>{conjuntos.map((serie) => <th scope="col" key={serie.nome}>{multiplas ? serie.nome : 'Quantidade'}</th>)}</tr></thead>
        <tbody>{rotulos.map((rotulo, i) => <tr key={`${rotulo}-${i}`}><th scope="row">{rotulo}</th>{conjuntos.map((serie) => <td key={serie.nome}>{Number(serie.valores[i] ?? 0).toLocaleString('pt-BR')}</td>)}</tr>)}</tbody>
      </table>
    </details>
  </>;
}
