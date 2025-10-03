// src/ui/pages/AppPage.js
import { signOut } from '../../services/auth.js';
import { InventoryForm } from '../components/InventoryForm.js';
import { InventoryTable } from '../components/InventoryTable.js';
import { notify } from '../components/Notification.js';
import { AuditPanel } from '../components/AuditPanel.js';

export function AppPage() {
  const el = document.createElement('div');
  el.className = 'container app';
  el.innerHTML = `
    <header class="header">
      <h2>Estoque</h2>
      <div class="spacer"></div>
      <button id="menuBtn" title="Abrir Auditoria">☰</button>
      <button id="logout">Sair</button>
    </header>

    <section id="inventorySection" class="grid">
      <div class="card">
        <h3>Novo Item</h3>
        <div id="formRoot"></div>
      </div>

      <div class="card">
        <h3>Itens</h3>
        <div id="tableRoot"></div>
      </div>
    </section>

    <section id="auditSection" class="card" style="display: none; margin-top: 20px;">
      <h3>Auditoria</h3>
      <div id="auditRoot"></div>
    </section>

    <div id="notify-root"></div>
  `;

  // Botão de logout
  el.querySelector('#logout').onclick = async () => {
    try {
      await signOut();
      notify('Sessão encerrada', 'info');
      document.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  // Alternar entre inventário e auditoria
  const menuBtn = el.querySelector('#menuBtn');
  const inventorySection = el.querySelector('#inventorySection');
  const auditSection = el.querySelector('#auditSection');

  menuBtn.onclick = () => {
    const isAuditVisible = auditSection.style.display === 'block';

    // Alterna visibilidade
    inventorySection.style.display = isAuditVisible ? 'grid' : 'none';
    auditSection.style.display = isAuditVisible ? 'none' : 'block';

    // Atualiza ícone
    menuBtn.textContent = isAuditVisible ? '☰' : '←';
    menuBtn.title = isAuditVisible ? 'Abrir Auditoria' : 'Voltar para Inventário';
  };

  // Montar os componentes
  el.querySelector('#formRoot').appendChild(InventoryForm());
  el.querySelector('#tableRoot').appendChild(InventoryTable());
  el.querySelector('#auditRoot').appendChild(AuditPanel());

  return el;
}
