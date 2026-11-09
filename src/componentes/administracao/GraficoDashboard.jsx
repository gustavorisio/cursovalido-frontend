import { useEffect, useRef } from 'react';
import { Chart, LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function GraficoDashboard({ tipo, rotulos, valores, titulo, horizontal = false }) {
  const canvas = useRef(null);
  useEffect(() => {
    const cores = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff'];
    const grafico = new Chart(canvas.current, {
      type: tipo,
      data: {
        labels: rotulos,
        datasets: [{
          label: titulo, data: valores, borderColor: '#58a6ff',
          backgroundColor: tipo === 'doughnut' ? cores : '#58a6ff80', borderWidth: 2, tension: 0.25, fill: tipo === 'line'
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? 'y' : 'x',
        animation: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        plugins: { legend: { display: tipo === 'doughnut', labels: { color: '#e6edf3' } } },
        ...(tipo === 'doughnut' ? {} : {
          scales: {
            [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0, color: '#c9d1d9' }, grid: { color: '#30363d' } },
            [horizontal ? 'y' : 'x']: { ticks: { color: '#c9d1d9' }, grid: { display: false } },
          }
        }),
      },
    });
    return () => grafico.destroy();
  }, [tipo, rotulos, valores, titulo, horizontal]);

  return <>
    <div className="dashboard-canvas"><canvas ref={canvas} role="img" aria-label={titulo} /></div>
    <details><summary>Consultar dados do gráfico</summary>
      <table className="table"><caption>{titulo}</caption><thead><tr><th scope="col">Categoria</th><th scope="col">Quantidade</th></tr></thead>
        <tbody>{rotulos.map((rotulo, i) => <tr key={`${rotulo}-${i}`}><th scope="row">{rotulo}</th><td>{valores[i].toLocaleString('pt-BR')}</td></tr>)}</tbody>
      </table>
    </details>
  </>;
}
