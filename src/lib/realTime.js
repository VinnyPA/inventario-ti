// src/lib/realtime.js
import { supabase } from './supabaseClient.js';

// helper para assinar uma tabela e despachar um evento global
export function subscribeTable(table, eventName = `${table}:realtime`) {
const ch = supabase
    .channel(`rt-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      // dispara um CustomEvent pra toda a app
    document.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
    })
    .subscribe();

return ch;
}

// inicializa todas as assinaturas que precisamos
export function initRealtime() {
const channels = [];
channels.push(subscribeTable('inventory', 'inventory:realtime'));
channels.push(subscribeTable('movements', 'movements:realtime'));
  // se tiver tabela separada de auditoria, descomente:
channels.push(subscribeTable('audit_log', 'audit:realtime'));
return channels;
}
