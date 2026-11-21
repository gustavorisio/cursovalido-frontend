export default function TabelaRankingAlunos({ alunos = [] }) {
  if (!alunos.length) return <p className="texto-suave">Ainda não há alunos no ranking.</p>;
  return <div className="w-full overflow-x-auto">
    <table className="!m-0 w-full min-w-[760px] border-collapse text-left">
      <thead className="bg-slate-50 text-sm text-slate-600">
        <tr className="border-b border-slate-200">
          <th className="px-5 py-4 font-semibold" scope="col">Posição</th>
          <th className="px-5 py-4 font-semibold" scope="col">Aluno</th>
          <th className="px-5 py-4 text-center font-semibold" scope="col">Level</th>
          <th className="px-5 py-4 text-center font-semibold" scope="col">Comentários</th>
          <th className="px-5 py-4 text-center font-semibold" scope="col">Aulas concluídas</th>
        </tr>
      </thead>
      <tbody>{alunos.map((aluno) => <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50" key={aluno.posicao}>
        <td className="px-5 py-4 font-semibold text-slate-500">{aluno.posicao}</td>
        <th className="px-5 py-4 font-medium text-slate-800" scope="row">{aluno.nome}</th>
        <td className="px-5 py-4 text-center"><button className="min-w-20 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700" type="button" disabled aria-label={`Level ${aluno.nivel}`}>Level {aluno.nivel}</button></td>
        <td className="px-5 py-4 text-center tabular-nums text-slate-700">{Number(aluno.comentarios).toLocaleString('pt-BR')}</td>
        <td className="px-5 py-4 text-center tabular-nums text-slate-700">{Number(aluno.aulasConcluidas).toLocaleString('pt-BR')}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
