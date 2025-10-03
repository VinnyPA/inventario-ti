// src/ui/pages/AppPage.js
import { signOut } from '../../services/auth.js';
import { InventoryForm } from '../components/InventoryForm.js';
import { InventoryTable } from '../components/InventoryTable.js';
import { notify } from '../components/Notification.js';
import { AuditPanel } from '../components/AuditPanel.js';

// Constantes para seletores e mensagens
const SELECTORS = {
  LOGOUT_BUTTON: '#logout',
  MENU_BUTTON: '#menuBtn',
  INVENTORY_SECTION: '#inventorySection',
  AUDIT_SECTION: '#auditSection',
  FORM_ROOT: '#formRoot',
  TABLE_ROOT: '#tableRoot',
  AUDIT_ROOT: '#auditRoot',
  NOTIFY_ROOT: '#notify-root'
};

const MESSAGES = {
  LOGOUT_SUCCESS: 'Sessão encerrada',
  MENU_OPEN: 'Abrir Auditoria',
  MENU_CLOSE: 'Voltar para Inventário'
};

export function AppPage() {
  // Criação do elemento principal
  const el = document.createElement('div');
  el.className = 'container app';
  
  // Estrutura do DOM usando template literal para melhor legibilidade
  el.innerHTML = `
    <header class="header">
      <h2>Estoque</h2>
      <div class="spacer"></div>
      <button id="${SELECTORS.MENU_BUTTON.slice(1)}" title="${MESSAGES.MENU_OPEN}" aria-label="Menu de auditoria">☰</button>
      <button id="${SELECTORS.LOGOUT_BUTTON.slice(1)}">Sair</button>
    </header>

    <section id="${SELECTORS.INVENTORY_SECTION.slice(1)}" class="grid">
      <div class="card">
        <h3>Novo Item</h3>
        <div id="${SELECTORS.FORM_ROOT.slice(1)}"></div>
      </div>

      <div class="card">
        <h3>Itens</h3>
        <div id="${SELECTORS.TABLE_ROOT.slice(1)}"></div>
      </div>
    </section>

    <section id="${SELECTORS.AUDIT_SECTION.slice(1)}" class="card" style="display: none; margin-top: 20px;" aria-hidden="true">
      <h3>Auditoria</h3>
      <div id="${SELECTORS.AUDIT_ROOT.slice(1)}"></div>
    </section>

    <div id="${SELECTORS.NOTIFY_ROOT.slice(1)}"></div>
  `;

  // Referências aos elementos DOM
  const elements = {
    logoutButton: el.querySelector(SELECTORS.LOGOUT_BUTTON),
    menuButton: el.querySelector(SELECTORS.MENU_BUTTON),
    inventorySection: el.querySelector(SELECTORS.INVENTORY_SECTION),
    auditSection: el.querySelector(SELECTORS.AUDIT_SECTION),
    formRoot: el.querySelector(SELECTORS.FORM_ROOT),
    tableRoot: el.querySelector(SELECTORS.TABLE_ROOT),
    auditRoot: el.querySelector(SELECTORS.AUDIT_ROOT)
  };

  // Função de logout encapsulada
  const handleLogout = async () => {
    try {
      await signOut();
      notify(MESSAGES.LOGOUT_SUCCESS, 'info');
      document.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      notify(error.message, 'error');
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para alternar entre seções
  const toggleSections = () => {
    const isAuditVisible = elements.auditSection.style.display === 'block';
    
    // Atualiza visibilidade das seções
    elements.inventorySection.style.display = isAuditVisible ? 'grid' : 'none';
    elements.auditSection.style.display = isAuditVisible ? 'none' : 'block';
    
    // Atualiza atributos de acessibilidade
    elements.inventorySection.setAttribute('aria-hidden', isAuditVisible ? 'false' : 'true');
    elements.auditSection.setAttribute('aria-hidden', isAuditVisible ? 'true' : 'false');
    
    // Atualiza botão de menu
    elements.menuButton.textContent = isAuditVisible ? '☰' : '←';
    elements.menuButton.title = isAuditVisible ? MESSAGES.MENU_OPEN : MESSAGES.MENU_CLOSE;
  };

  // Adiciona event listeners
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.menuButton.addEventListener('click', toggleSections);

  // Monta os componentes
  elements.formRoot.appendChild(InventoryForm());
  elements.tableRoot.appendChild(InventoryTable());
  elements.auditRoot.appendChild(AuditPanel());

  return el;
}