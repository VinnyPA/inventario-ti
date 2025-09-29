// src/services/inventory.js
import { supabase } from '../lib/supabaseClient.js';

const fromInv = () => supabase.from('inventory');
const fromMov = () => supabase.from('movements');

// Lista itens com busca por texto e filtro de tags (array)
export async function listInventory({ q = '', tags = [] } = {}) {
  let query = fromInv().select('*').order('updated_at', { ascending: false });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`
    );
  }
  if (tags.length) {
    // retorna itens que CONTÊM todas as tags informadas
  const up = tags.map(t => t.trim()).filter(Boolean).map(t => t.toUpperCase());
  if (up.length) {
    query = query.overlaps('tags', up);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createItem({ name, quantity = 0, description = '', location = '', tags = [] }) {
  const { data, error } = await fromInv()
    .insert([{ name, quantity, description, location, tags }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id, patch) {
  const { data, error } = await fromInv()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id) {
  const { error } = await fromInv().delete().eq('id', id);
  if (error) throw error;
}

export async function registerMovement({ item_id, type, quantity, reason = '' }) {
  const { data, error } = await fromMov()
    .insert([{ item_id, type, quantity, reason }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
