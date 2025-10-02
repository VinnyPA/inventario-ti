// src/ui/components/InventoryTable.js
import { listInventory, updateItem, deleteItem, registerMovement } from '../../services/inventory.js';
import { notify } from './Notification.js';
import { debounce } from '../../lib/debounce.js';
import { TAGS } from '../../lib/tags.js';

export function InventoryTable() {
  const wrap = document.createElement('div');

  // --- FILTROS ---
  const filters = document.createElement('div');
  filters.style.display = 'grid';
  filters.style.gridTemplateColumns = '1fr';
  filters.style.gap = '10px';

  // busca por texto
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
  list.style.display = 'grid';
  list.style.gridTemplateColumns = '1fr';
  list.style.rowGap = '6px';

  TAGS.forEach((tg) => {
    const id = `tag-${tg.replace(/\s+/g, '-').toLowerCase()}`;
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.cursor = 'pointer';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.value = tg;

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

  // --- TABELA ---
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead>
    <tr>
      <th>Produto</th><th>Descrição</th><th>Qtd</th><th>Local</th><th>Tags</th><th>Ações</th>
    </tr>
  </thead><tbody></tbody>`;

  // envolve a tabela num container que terá scroll próprio
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  tableWrap.appendChild(table);
  wrap.appendChild(tableWrap);

  // helpers TAGs
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

  // render principal
  async function render(q = '', tagsArr = []) {
    const tbody = table.querySelector('tbody');
    // AGORA SÃO 6 COLUNAS
    tbody.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
      const items = await listInventory({ q, tags: tagsArr }); // OR via overlaps
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

        // Editar
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

        // Entrada
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

        // Saída
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

        // Excluir
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

  // eventos filtros
  const triggerRender = () => render(search.value, currentTags());
  search.addEventListener('input', triggerRender);
  tagsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  list.addEventListener('change', () => {
    updateTagsBtn();
    triggerRender(); // aplica na hora
  });
  btnClear.addEventListener('click', () => {
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));
    updateTagsBtn();
    render(search.value, []); // sem filtro
  });

  // fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!tagsFilter.contains(e.target)) closeMenu();
  });

  // primeira carga
  updateTagsBtn();
  render('', []);

  // refresh externo
  document.addEventListener('inventory:changed', () => render(search.value, currentTags()));

  // ====== TEMPO REAL ======
  const realtimeRefresh = debounce(() => render(search.value, currentTags()), 200);
  document.addEventListener('inventory:realtime', realtimeRefresh);
  document.addEventListener('movements:realtime', realtimeRefresh);
  // aqui estava "refresh" (inexistente)
  document.addEventListener('audit:realtime', realtimeRefresh);

  return wrap;
}
