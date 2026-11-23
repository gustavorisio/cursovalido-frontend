import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    restoreMocks: true,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{js,jsx}'],
      reporter: ['text-summary', 'html', 'json'],
      reportOnFailure: true,
      thresholds: {
        lines: 75,
        'src/componentes/aulas/componentes/PlayerAula.jsx': { lines: 50 },
        'src/componentes/aulas/componentes/TabelaRankingAlunos.jsx': { lines: 50 },
        'src/componentes/comuns/VideoApresentacaoInicio.jsx': { lines: 50 },
        'src/paginas/RankingAlunos.jsx': { lines: 50 },
        'src/componentes/administracao/DenunciasForum.jsx': { lines: 50 },
        'src/componentes/forum/componentes/FormularioDenuncia.jsx': { lines: 50 },
      },
    },
  },
})
