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
    <button id="logout">Sair</button>
    </header>
    <section class="grid">
       <div class="card"> <h3>Novo Item</h3> <div id="formRoot"></div> </div>
       <div class="card"> <h3>Itens</h3> <div id="tableRoot"></div> </div>
     </section>
     <div class="card" style="margin-top:20px"> <div id="auditRoot"></div> </div>
     <div id="notify-root"></div>
   `;

  el.querySelector('#logout').onclick = async () => {
    try { await signOut(); } catch (e) { notify(e.message, 'error'); }
  };
  el.querySelector('#logout').onclick = async () => {
    try {
      await signOut();
      notify('Sessão encerrada', 'info');
      // força o roteador a ir pra tela de login
      document.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (e) {
      notify(e.message, 'error');
    }
  };

   // Monta componentes
   const formRoot = el.querySelector('#formRoot');
   formRoot.appendChild(InventoryForm());

   const tableRoot = el.querySelector('#tableRoot');
   tableRoot.appendChild(InventoryTable());

   const auditRoot = el.querySelector('#auditRoot');
   auditRoot.appendChild(AuditPanel());

   return el;
 }
