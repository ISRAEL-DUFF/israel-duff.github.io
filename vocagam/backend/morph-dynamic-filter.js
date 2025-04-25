// db.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// queryBuilder.js
export function buildGreekMorphQuery(filters) {
  const allowedKeys = [
    'part_of_speech', 'case', 'number', 'gender', 'tense', 'voice',
    'mood', 'person', 'lemma', 'word', 'dialect', 'degree'
  ];

  const query = {
    sql: 'SELECT * FROM greek_morphology WHERE 1=1',
    params: []
  };

  for (const key of allowedKeys) {
    if (filters[key]) {
      query.sql += ` AND ${key} = ?`;
      query.params.push(filters[key]);
    }
  }

  query.sql += ' LIMIT 50';
  return query;
}

// dataAccess.js
import { supabase } from './db.js';
import { buildGreekMorphQuery } from './queryBuilder.js';

export async function fetchGreekWords(filters) {
  const { sql, params } = buildGreekMorphQuery(filters);
  const { data, error } = await supabase.rpc('raw_sql_query', { sql_query: sql, parameters: params });
  if (error) throw error;
  return data;
}

export async function upsertGreekWord(entry) {
  const { data, error } = await supabase
    .from('greek_morphology')
    .upsert(entry, { onConflict: ['word', 'lemma'] });
  if (error) throw error;
  return data;
}

export async function insertGreekWords(entries) {
  const { data, error } = await supabase
    .from('greek_morphology')
    .insert(entries);
  if (error) throw error;
  return data;
}
