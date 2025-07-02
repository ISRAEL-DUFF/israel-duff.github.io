const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE_NAME = 'stories';

// Helper: Validate story payload
function validateStoryPayload(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string') errors.push('Missing or invalid title');
  if (!body.greekText || typeof body.greekText !== 'string') errors.push('Missing or invalid greekText');
  if (!body.englishTranslation || typeof body.englishTranslation !== 'string') errors.push('Missing or invalid englishTranslation');
  // if (!body.audioDataUri || typeof body.audioDataUri !== 'string') errors.push('Missing or invalid audioDataUri');
  if (!body.language || typeof body.language !== 'string') errors.push('Missing or invalid language');
  if (!body.namespace || typeof body.namespace !== 'string') errors.push('Missing or invalid namespace');
  return errors;
}

// CREATE story
router.post('/save', async (req, res) => {
  const errors = validateStoryPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation Error', details: errors });
  }
  const story = {
    // id: uuidv4(),
    title: req.body.title,
    greek_text: req.body.greekText,
    english_translation: req.body.englishTranslation,
    audio_data_uri: req.body.audioDataUri,
    language: req.body.language,
    namespace: req.body.namespace,
    timings: req.body.timings || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from(TABLE_NAME).insert([story]);
  if (error) {
    console.log(error)
    return res.status(500).json({ error: 'Supabase Insert Error', details: error.message });
  }
  res.status(201).json({ message: 'Story created', story });
});

// READ all stories with pagination and filtering
router.get('/list', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const { namespace, language } = req.query;

  let query = supabase.from(TABLE_NAME).select('id, title, namespace, created_at, updated_at', { count: 'exact' });
  if (namespace) query = query.eq('namespace', namespace);
  if (language) query = query.eq('language', language);
  query = query.order('created_at', { ascending: false });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    return res.status(500).json({ error: 'Supabase Fetch Error', details: error.message });
  }
  res.json({
    stories: data.map((s) => {
      return {
        id: s.id,
        title: s.title,
        greekText: s.greek_text,
        englishTranslation: s.english_translation,
        audioDataUri: s.audio_data_uri,
        timings: s.timings || [],
        language: s.language,
        namespace: s.namespace,
        createdAt: s.created_at,
      }
    }),
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    }
  });
});

// READ single story by id
router.get('/by-id/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).single();
  if (error) {
    return res.status(404).json({ error: 'Not Found', details: error.message });
  }
  const s = data
  res.json({
    id: s.id,
    title: s.title,
    greekText: s.greek_text,
    englishTranslation: s.english_translation,
    audioDataUri: s.audio_data_uri,
    timings: s.timings || [],
    language: s.language,
    namespace: s.namespace,
    createdAt: s.created_at,
  });
});

// UPDATE story by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  const { error } = await supabase.from(TABLE_NAME).update(updates).eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Supabase Update Error', details: error.message });
  }
  res.json({ message: 'Story updated' });
});

// DELETE story by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Supabase Delete Error', details: error.message });
  }
  res.json({ message: 'Story deleted' });
});

module.exports = router;


const sentenceTimings = [
  {
    id: 1,
    startTime: 0,
    endTime: 0
  }
]