import { useEffect, useRef } from 'react';
import { Chart, LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);
Chart.defaults.font.family = 'Arial, sans-serif';

export default function GraficoDashboard({ tipo, rotulos, valores, titulo, horizontal = false }) {
  const canvas = useRef(null);
  useEffect(() => {
    const estilo = window.getComputedStyle(canvas.current);
    const cor = (token, padrao) => estilo.getPropertyValue(token).trim() || padrao;
    const matiz = Math.floor(Math.random() * 360);
    const corPrincipal = `hsl(${matiz}, 68%, 65%)`;
    const texto = cor('--color-brand-950', '#f0f6fc');
    const suave = cor('--color-muted', '#8b949e');
    const linha = cor('--color-line', '#30363d');
    const cores = rotulos.map((_, indice) => `hsl(${(matiz + indice * 137.508) % 360}, 68%, 65%)`);
    const grafico = new Chart(canvas.current, {
      type: tipo,
      data: {
        labels: rotulos,
        datasets: [{
          label: titulo, data: valores,
          borderColor: tipo === 'line' ? corPrincipal : cores,
          backgroundColor: tipo === 'line' ? `hsla(${matiz}, 68%, 65%, 0.2)` : cores,
          pointBackgroundColor: corPrincipal,
          borderWidth: 2, tension: 0.25, fill: tipo === 'line'
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? 'y' : 'x',
        animation: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        plugins: { legend: { display: tipo === 'doughnut', labels: { color: texto } } },
        ...(tipo === 'doughnut' ? {} : {
          scales: {
            [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0, color: suave }, grid: { color: linha } },
            [horizontal ? 'y' : 'x']: { ticks: { color: suave }, grid: { display: false } },
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
