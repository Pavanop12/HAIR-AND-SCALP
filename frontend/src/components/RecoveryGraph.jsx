import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function RecoveryGraph({ scans }) {
  const sorted = [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const labels = sorted.map(s =>
    new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  )
  const scores = sorted.map(s => s.severity_score)

  const data = {
    labels,
    datasets: [{
      label: 'Severity Score',
      data: scores,
      fill: true,
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124,58,237,0.12)',
      pointBackgroundColor: scores.map(s => s <= 30 ? '#10b981' : s <= 60 ? '#f59e0b' : '#ef4444'),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 9,
      tension: 0.4,
      borderWidth: 3,
    }],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13,13,26,0.95)',
        borderColor: 'rgba(124,58,237,0.4)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: ctx => ` Severity: ${ctx.raw.toFixed(1)}`,
          afterLabel: ctx => {
            const s = ctx.raw
            return s <= 30 ? ' Status: Mild' : s <= 60 ? ' Status: Moderate' : ' Status: Severe'
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 12 } },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#94a3b8', font: { family: 'Inter', size: 12 },
          callback: v => v + '%',
        },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  }

  return <Line data={data} options={options} />
}
