// db.js
import { createClient } from '@supabase/supabase-js';
// require('dotenv').config();
import * as dotEnv from 'dotenv';
dotEnv.config()
// const { Client } = require('pg');
import * as pg from 'pg';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const client = new pg.Client(process.env.DIRECT_DATABASE_URL);
let connectedToDb = false;

let tableName = 'greek_morphology'

async function fetchQuery(whereParams = {}, limit = 10) {
    try {
        if(!connectedToDb) {
            await client.connect();
            connectedToDb = true;
        }

        let whereCondition = `1=1` // + Object.keys(whereParams).map((k) => ` AND "${k}" = '${whereParams[k]}'`).join(' ');
        let columns = 'id,' // + Object.keys(whereParams).join(',');

        for(const k of Object.keys(whereParams)) {
            whereCondition += ` AND "${k}" = '${whereParams[k]}'`;
            columns += `"${k}",`
        }
        columns = columns.substring(0, columns.length - 1)

        console.log('filters', whereParams, Object.keys(whereParams).map((k) => ` AND "${k}" = '${whereParams[k]}'`))

        console.log(`SELECT ${columns} FROM ${tableName} WHERE ${whereCondition} LIMIT ${limit}`)
      const res = await client.query(`SELECT ${columns} FROM ${tableName} WHERE ${whereCondition} LIMIT ${limit}`);
    //   console.log(res.rows);

      return res.rows
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}

// queryBuilder.js
function buildGreekMorphQuery(filters) {
  const allowedKeys = [
    'part_of_speech', 'case', 'number', 'gender', 'tense', 'voice',
    'mood', 'person', 'lemma', 'word', 'dialect', 'declension'
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

// // dataAccess.js
// import { supabase } from './db.js';
// import { buildGreekMorphQuery } from './queryBuilder.js';

export async function fetchGreekMorphs(filters) {
//   const { sql, params } = buildGreekMorphQuery(filters);
//   const { data, error } = await supabase.rpc('raw_sql_query', { sql_query: sql, parameters: params });
    const data = await fetchQuery(filters, 20)
//   if (error) throw error;
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
