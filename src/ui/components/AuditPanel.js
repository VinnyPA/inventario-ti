// src/ui/components/AuditPanel.js
import { supabase } from '../../lib/supabaseClient.js';
import { TAGS } from '../../lib/tags.js';
import { notify } from './Notification.js';
import { debounce } from '../../lib/debounce.js';

export function AuditPanel() {
  const box = document.createElement('div');
  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px; margin-bottom:10px">
      <h3 style="margin:0">Auditoria (últimas 50)</h3>
      <select id="tagFilter"><option value="">Filtrar por TAG</option></select>
      <button id="refresh">Atualizar</button>
    </div>
    <table class="table"><thead>
      <tr><th>Quando</th><th>Ação</th><th>Usuário</th></tr>
    </thead><tbody></tbody></table>
  `;

  // --- popular filtro de tags ---
  const tagFilter = box.querySelector('#tagFilter');
  (TAGS || []).forEach(t => {
    const o = document.createElement('option');
    o.value = String(t).toUpperCase();
    o.textContent = String(t).toUpperCase();
    tagFilter.appendChild(o);
  });

  const tbody = box.querySelector('tbody');

  async function load() {
    tbody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    // base query
    let q = supabase
      .from('audit_log')
      .select('created_at, details, actor_email, new_data, old_data')
      .order('created_at', { ascending: false })
      .limit(50);

    const tf = (tagFilter.value || '').trim().toUpperCase();

    try {
      const { data, error } = await q;
      if (error) throw error;

      let rows = data || [];

      if (tf) {
        rows = rows.filter(r => {
          const details = (r.details || '').toString().toUpperCase();
          const nTags = Array.isArray(r?.new_data?.tags) ? r.new_data.tags : [];
          const oTags = Array.isArray(r?.old_data?.tags) ? r.old_data.tags : [];
          const tagFromSnapshots =
            nTags.map(x => String(x).toUpperCase()).includes(tf) ||
            oTags.map(x => String(x).toUpperCase()).includes(tf);

          return details.includes(tf) || tagFromSnapshots;
        });
      }

      renderRows(rows, tbody);
    } catch (e) {
      notify(e.message || 'Erro ao carregar auditoria', 'error');
      tbody.innerHTML = '<tr><td colspan="3">Falha ao carregar</td></tr>';
    }
  }

  function renderRows(data, tbodyEl) {
    tbodyEl.innerHTML = '';
    if (!data || !data.length) {
      tbodyEl.innerHTML = '<tr><td colspan="3">Sem registros</td></tr>';
      return;
    }

    for (const r of data) {
      const when = new Date(r.created_at).toLocaleString('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${when}</td>
        <td>${r.details ? sanitize(r.details) : '(sem detalhes)'}</td>
        <td>${r.actor_email ?? ''}</td>`;
      tbodyEl.appendChild(tr);
    }
  }

  // simples sanitização de texto (evitar HTML indesejado no details)
  function sanitize(str) {
    return String(str).replace(/[<>&"]/g, s => (
      { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[s]
    ));
  }

  // --- ações UI ---
  box.querySelector('#refresh').onclick = load;
  tagFilter.onchange = load;

  // --- tempo real: re-render quando inventory/movements/audit mudarem
const refreshNow   = debounce(() => load(), 150);
const refreshAfter = (() => {
  let t; 
  return () => { clearTimeout(t); t = setTimeout(() => load(), 700); };
})();
 // se o audit_log não estiver em realtime, espere ~700ms após movimentos/inventory
document.addEventListener('inventory:realtime', refreshAfter);
document.addEventListener('movements:realtime', refreshAfter);
 // se habilitar realtime no audit_log, atualiza na hora:
document.addEventListener('audit:realtime', refreshNow);
  // primeira carga
  load();

  return box;
}
