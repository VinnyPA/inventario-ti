import { listInventory } from '../../services/inventory.js';

export function LowStockChart() {
  const container = document.createElement('div');
  container.className = 'low-stock-chart';

  const title = document.createElement('h3');
  title.textContent = 'Itens com Estoque Baixo';
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.id = 'lowStockChartCanvas';
  container.appendChild(canvas);

  // Importa Chart.js via CDN dinamicamente
  import('https://cdn.jsdelivr.net/npm/chart.js').then(({ Chart }) => {
    listInventory().then(items => {
      const lowStock = items.filter(i => i.quantity <= 5);

      if (!lowStock.length) {
        const p = document.createElement('p');
        p.textContent = 'Nenhum item com estoque baixo.';
        container.appendChild(p);
        return;
      }

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: lowStock.map(i => i.name),
          datasets: [{
            label: 'Quantidade',
            data: lowStock.map(i => i.quantity),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    });
  });

  return container;
}
