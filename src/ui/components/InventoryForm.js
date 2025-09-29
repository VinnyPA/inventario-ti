
import { notify } from './Notification.js';
import { createItem } from '../../services/inventory.js';
import { TAGS } from '../../lib/tags.js';
import { InventoryTable } from './InventoryTable.js';
export function InventoryForm() {
const el = document.createElement('form');
el.className = 'form-grid';
el.innerHTML = `
 <input id="name" placeholder="Produto" required />
 <input id="quantity" type="number" placeholder="Qtd" min="0" required />
 <input id="location" placeholder="Localização" />
<select id="tag">
    <option value="">Selecione a TAG</option>
    </select>
 <textarea id="description" placeholder="Descrição"></textarea>
 <button type="submit">Adicionar</button>
 `;

  // popular o select com as TAGS fixas
  const tagSelect = el.querySelector('#tag');
  TAGS.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    tagSelect.appendChild(o);
  });

el.onsubmit = async (ev) => {
ev.preventDefault();
const name = el.querySelector('#name').value.trim();
const quantity = parseInt(el.querySelector('#quantity').value || '0',
10);
const location = el.querySelector('#location').value.trim();
const description = el.querySelector('#description').value.trim();
const selected = tagSelect.value;
if (!selected) { notify('Selecione uma TAG', 'warning'); return; }
const tags = [selected.toUpperCase()];

try {
await createItem({ name, quantity, location, description, tags });
notify('Item criado!', 'success');
ev.target.reset();
// refresh tabela
document.dispatchEvent(new CustomEvent('inventory:changed'));
} catch (e) {
notify(e.message, 'error');
}
};
return el;
}