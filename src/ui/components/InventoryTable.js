// src/ui/components/InventoryTable.js
import { listInventory, updateItem, deleteItem, registerMovement } from '../../services/inventory.js';
import { notify } from './Notification.js';
import { debounce } from '../../lib/debounce.js';
import { TAGS } from '../../lib/tags.js';

function exportToCSV(items) {
  const headers = ['Produto', 'Descrição', 'Quantidade', 'Local', 'Tags'];
  const rows = items.map(item => [
    item.name,
    item.description ?? '',
    item.quantity,
    item.location ?? '',
    (item.tags || []).join(', ')
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(value => `"${value}"`).join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'inventario.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function InventoryTable() {
  const wrap = document.createElement('div');
  let latestItems = [];

  // --- FILTROS ---
  const filters = document.createElement('div');
  filters.style.display = 'grid';
  filters.style.gridTemplateColumns = '1fr';
  filters.style.gap = '10px';

  const search = document.createElement('input');
  search.placeholder = 'Buscar...';
  search.className = 'search';
  filters.appendChild(search);

  // --- DROPDOWN DE TAGS ---
  const tagsFilter = document.createElement('div');
  tagsFilter.style.position = 'relative';
  tagsFilter.style.display = 'inline-block';

  const tagsBtn = document.createElement('button');
  tagsBtn.type = 'button';
  tagsBtn.textContent = 'Tags (0)';
  tagsBtn.style.marginRight = '8px';

  const btnClear = document.createElement('button');
  btnClear.type = 'button';
  btnClear.textContent = 'Limpar';
  btnClear.style.fontSize = '12px';

  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '110%';
  menu.style.left = '0';
  menu.style.minWidth = '240px';
  menu.style.maxHeight = '260px';
  menu.style.overflow = 'auto';
  menu.style.padding = '10px';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  menu.style.background = '#0f172a';
  menu.style.border = '1px solid rgba(255,255,255,.08)';
  menu.style.display = 'none';
  menu.style.zIndex = '50';

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.margin = '0';
  list.style.padding = '0';
  list.style.display = 'block';
  list.style.width = '100%';

  // ✅ CHECKBOXES ALINHADOS E RENTES AO TEXTO
  // label envolve input + texto, com inline-flex para alinhamento e sem margens extras
  TAGS.forEach((tg) => {
    const id = `tag-${tg.replace(/\s+/g, '-').toLowerCase()}`;

    const li = document.createElement('li');
    li.className = 'tag-checkbox';
    li.style.display = 'block';
    li.style.marginBottom = '6px';
    li.style.width = '100%';

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.style.display = 'inline-flex';
    label.style.alignItems = 'center';
    label.style.gap = '6px';           // distância mínima entre box e texto
    label.style.lineHeight = '1.2';    // reduz a altura pra ficar rente
    label.style.cursor = 'pointer';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.value = tg;
    cb.style.margin = '0';             // remove margens que empurram o texto
    cb.style.padding = '0';
    cb.style.verticalAlign = 'middle'; // reforço

    const span = document.createElement('span');
    span.textContent = tg;

    label.appendChild(cb);
    label.appendChild(span);
    li.appendChild(label);
    list.appendChild(li);
  });

  menu.appendChild(list);
  tagsFilter.appendChild(tagsBtn);
  tagsFilter.appendChild(btnClear);
  tagsFilter.appendChild(menu);
  filters.appendChild(tagsFilter);

  wrap.appendChild(filters);

  // --- BOTÃO DE EXPORTAR CSV ---
  const exportBtn = document.createElement('button');
  exportBtn.textContent = '📥 Exportar CSV';
  exportBtn.className = 'btn-export';
  exportBtn.style.marginTop = '10px';
  exportBtn.style.marginBottom = '10px';
  wrap.appendChild(exportBtn);

  // --- TABELA ---
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead>
    <tr>
      <th>Produto</th><th>Descrição</th><th>Qtd</th><th>Local</th><th>Tags</th><th>Ações</th>
    </tr>
  </thead><tbody></tbody>`;

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  const currentTags = () =>
    [...menu.querySelectorAll('input[type="checkbox"]:checked')].map(el =>
      (el.value || '').toString().trim().toUpperCase()
    );

  const updateTagsBtn = () => {
    const n = currentTags().length;
    tagsBtn.textContent = `Tags (${n})`;
  };

  const openMenu = () => (menu.style.display = 'block');
  const closeMenu = () => (menu.style.display = 'none');
  const toggleMenu = () => (menu.style.display === 'none' ? openMenu() : closeMenu());

  async function render(q = '', tagsArr = []) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
      const items = await listInventory({ q, tags: tagsArr });
      latestItems = items;
      tbody.innerHTML = '';
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6">Sem itens</td></tr>';
        return;
      }

      for (const it of items) {
        const primaryTag = (it.tags && it.tags[0]) ? it.tags[0] : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${it.name}</td>
          <td>${it.description ?? ''}</td>
          <td>${it.quantity}</td>
          <td>${it.location ?? ''}</td>
          <td>${(it.tags || []).join(', ')}</td>
          <td>
            <button data-edit>Editar</button>
            <button data-in>+Entrada</button>
            <button data-out>-Saída</button>
            <button data-del class="danger">Excluir</button>
          </td>`;

        tr.querySelector('[data-edit]').onclick = async () => {
          const name = prompt('Nome', it.name) ?? it.name;
          const description = prompt('Descrição', it.description ?? '') ?? it.description;
          const location = prompt('Localização', it.location ?? '') ?? it.location;
          const tags = (prompt('Tags (separe por vírgula)', (it.tags || []).join(', ')) || '')
            .split(',').map(s => s.trim()).filter(Boolean).map(s => s.toUpperCase());
          try {
            await updateItem(it.id, { name, description, location, tags });
            notify('Atualizado', 'success');
            render(search.value, currentTags());
          } catch (e) { notify(e.message, 'error'); }
        };

        tr.querySelector('[data-in]').onclick = async () => {
          const qty = parseInt(prompt('Quantidade de entrada?') || '0', 10);
          if (qty > 0 && confirm(`Confirmar entrada de ${qty} em "${primaryTag || it.name}"?`)) {
            try {
              await updateItem(it.id, { quantity: it.quantity + qty });
              await registerMovement({ item_id: it.id, type: 'entrada', quantity: qty, reason: 'Ajuste manual' });
              notify('Entrada registrada', 'success');
              render(search.value, currentTags());
            } catch (e) { notify(e.message, 'error'); }
          }
        };

        tr.querySelector('[data-out]').onclick = async () => {
          const qty = parseInt(prompt('Quantidade de saída?') || '0', 10);
          if (qty > 0 && it.quantity - qty >= 0 && confirm(`Confirmar saída de ${qty} em "${primaryTag || it.name}"?`)) {
            try {
              await updateItem(it.id, { quantity: it.quantity - qty });
              await registerMovement({ item_id: it.id, type: 'saida', quantity: qty, reason: 'Ajuste manual' });
              notify('Saída registrada', 'success');
              render(search.value, currentTags());
            } catch (e) { notify(e.message, 'error'); }
          } else if (qty > 0 && it.quantity - qty < 0) {
            notify('Quantidade insuficiente', 'warning');
          }
        };

        tr.querySelector('[data-del]').onclick = async () => {
          if (confirm(`Excluir "${primaryTag || it.name}"? Esta ação não pode ser desfeita.`)) {
            try {
              await deleteItem(it.id);
              notify('Excluído', 'success');
              render(search.value, currentTags());
            } catch (e) { notify(e.message, 'error'); }
          }
        };

        tbody.appendChild(tr);
      }
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  exportBtn.addEventListener('click', () => {
    if (!latestItems.length) {
      notify('Nada para exportar!', 'warning');
      return;
    }
    exportToCSV(latestItems);
  });

  const triggerRender = () => render(search.value, currentTags());
  search.addEventListener('input', triggerRender);

  tagsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  list.addEventListener('change', () => {
    updateTagsBtn();
    triggerRender();
  });

  btnClear.addEventListener('click', () => {
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));
    updateTagsBtn();
    render(search.value, []);
  });

  document.addEventListener('click', (e) => {
    if (!tagsFilter.contains(e.target)) closeMenu();
  });

  updateTagsBtn();
  render('', []);

  document.addEventListener('inventory:changed', () => render(search.value, currentTags()));

  const realtimeRefresh = debounce(() => render(search.value, currentTags()), 200);
  document.addEventListener('inventory:realtime', realtimeRefresh);
  document.addEventListener('movements:realtime', realtimeRefresh);
  document.addEventListener('audit:realtime', realtimeRefresh);

  return wrap;
}
