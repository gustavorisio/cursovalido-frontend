import { CChart } from '@coreui/react-chartjs';

const cores = ['#58a6ff', '#4bc49e', '#da9aff', '#e9b26e', '#ef8f9d'];
const texto = '#f0f6fc';
const suave = '#8b949e';
const linha = '#30363d';

export default function GraficoDashboard({ tipo, rotulos, valores, titulo, horizontal = false }) {
  const coresCategorias = rotulos.map((_, indice) => cores[indice % cores.length]);
  const ehLinha = tipo === 'line';
  const ehRosca = tipo === 'doughnut';
  const dados = {
    labels: rotulos,
    datasets: [{
      label: titulo,
      data: valores,
      borderColor: ehLinha ? cores[0] : coresCategorias,
      backgroundColor: ehLinha ? '#58a6ff33' : coresCategorias,
      pointBackgroundColor: cores[0],
      borderWidth: 2,
      tension: 0.25,
      fill: ehLinha,
    }],
  };
  const opcoes = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    animation: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : undefined,
    plugins: { legend: { display: ehRosca, labels: { color: texto } } },
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
      <table className="table"><caption>{titulo}</caption><thead><tr><th scope="col">Categoria</th><th scope="col">Quantidade</th></tr></thead>
        <tbody>{rotulos.map((rotulo, i) => <tr key={`${rotulo}-${i}`}><th scope="row">{rotulo}</th><td>{valores[i].toLocaleString('pt-BR')}</td></tr>)}</tbody>
      </table>
    </details>
  </>;
}
