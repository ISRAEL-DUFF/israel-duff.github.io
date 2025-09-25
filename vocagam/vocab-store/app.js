const DATASETS = [
  {
    id: 'gnt-nt',
    label: 'Greek New Testament – 1,500 words',
    file: 'common-koine-gnt-1500.json',
    summary: 'Top lemmas from the Westcott-Hort Greek New Testament corpus.'
  },
  {
    id: 'koine-lxx',
    label: 'Koine Greek (LXX) – 1,500 lemmas',
    file: 'common-koine-lxx-greek-1500.json',
    summary: 'Koine frequency list built from the CATSS Septuagint morphological corpus.'
  },
  {
    id: 'koine-eusebius',
    label: 'Koine Greek (Eusebius) – 1,500 lemmas',
    file: 'common-koine-eusebius-1500.json',
    summary: 'Vocabulary extracted from Eusebius of Caesarea’s Historia Ecclesiastica.'
  },
  {
    id: 'attic',
    label: 'Attic Greek – 1,000 lemmas',
    file: 'common-attic-greek-1000.json',
    summary: 'Attic-targeted lemmas filtered from the Perseus Diogenes analyses.'
  },
  {
    id: 'general',
    label: 'General Greek Vocabulary – 404 entries',
    file: 'general-greek-vocabulary.json',
    summary: 'Legacy mixed-discipline vocabulary collection from the word-bank general list.'
  },
  {
    id: 'dcc-core',
    label: 'DCC Greek Core – 524 entries',
    file: 'dcc-greek-core-list.json',
    summary: 'Dickinson College Commentaries Greek core list with frequency counts.'
  }
];

const state = {
  datasetId: null,
  rows: [],
  filters: {
    search: '',
    batch: 'all',
    sort: 'desc'
  }
};

const datasetSelect = document.getElementById('dataset-select');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('freq-sort');
const resetButton = document.getElementById('reset-button');
const metadataEl = document.getElementById('metadata');
const datasetTitle = document.getElementById('dataset-title');
const batchList = document.getElementById('batch-list');
const tableBody = document.getElementById('vocab-body');
const emptyState = document.getElementById('empty-state');
const tableStatus = document.getElementById('table-status');
const copyButton = document.getElementById('copy-batch');

function init() {
  datasetSelect.innerHTML = DATASETS.map(dataset => `<option value="${dataset.id}">${dataset.label}</option>`).join('');
  copyButton.disabled = true;

  datasetSelect.addEventListener('change', handleDatasetChange);
  searchInput.addEventListener('input', handleSearchChange);
  sortSelect.addEventListener('change', handleSortChange);
  resetButton.addEventListener('click', handleReset);
  copyButton.addEventListener('click', handleCopyBatch);

  // Auto-load first dataset
  if (DATASETS.length) {
    datasetSelect.value = DATASETS[0].id;
    loadDataset(DATASETS[0]);
  }
}

async function handleDatasetChange() {
  const selected = DATASETS.find(d => d.id === datasetSelect.value);
  if (selected) {
    await loadDataset(selected);
  }
}

function handleSearchChange(event) {
  state.filters.search = event.target.value.trim();
  render();
}

function handleSortChange(event) {
  state.filters.sort = event.target.value;
  render();
}

function handleReset() {
  searchInput.value = '';
  sortSelect.value = 'desc';
  state.filters.search = '';
  state.filters.sort = 'desc';
  setBatch('all');
  render();
}

async function loadDataset(dataset) {
  datasetTitle.textContent = 'Loading…';
  metadataEl.innerHTML = '';
  batchList.innerHTML = '';
  tableBody.innerHTML = '';
  emptyState.hidden = true;
  copyButton.disabled = true;

  try {
    const response = await fetch(`vocab-data/${dataset.file}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${dataset.file}`);
    }
    const payload = await response.json();

    state.datasetId = dataset.id;
    state.rows = flattenBatches(payload.batches);
    state.currentRows = [];
    state.metadata = payload.metadata || {};
    state.datasetSummary = dataset.summary;
    renderMetadata(payload.metadata, dataset.summary);
    renderBatchList(payload.batches);
    setBatch('all');
    render();
  } catch (error) {
    console.error(error);
    datasetTitle.textContent = 'Error loading dataset';
    metadataEl.innerHTML = `<dd>${error.message}</dd>`;
    copyButton.disabled = true;
  }
}

function flattenBatches(batches) {
  return batches.flatMap(batch => batch.words.map(word => ({
    ...word,
    batchNumber: batch.batchNumber,
    rankRange: batch.rankRange
  })));
}

function renderMetadata(metadata = {}, summary = '') {
  datasetTitle.textContent = metadata.description || 'Vocabulary Dataset';

  const entries = [
    metadata.totalWords && { label: 'Entries', value: metadata.totalWords.toLocaleString() },
    metadata.batchSize && { label: 'Batch Size', value: metadata.batchSize },
    metadata.source && { label: 'Source', value: metadata.source },
    metadata.tokensCounted && { label: 'Tokens', value: metadata.tokensCounted.toLocaleString() },
    metadata.generatedAt && { label: 'Generated', value: formatDate(metadata.generatedAt) },
    summary && { label: 'Notes', value: summary }
  ].filter(Boolean);

  metadataEl.innerHTML = entries
    .map(entry => `<div><dt>${entry.label}</dt><dd>${entry.value}</dd></div>`)
    .join('');
}

function renderBatchList(batches) {
  batchList.innerHTML = '';

  const allItem = document.createElement('li');
  const allButton = document.createElement('button');
  allButton.textContent = 'All words';
  allButton.className = 'batch-button active';
  allButton.type = 'button';
  allButton.dataset.batch = 'all';
  allButton.addEventListener('click', () => {
    setBatch('all');
    render();
  });
  allItem.appendChild(allButton);
  batchList.appendChild(allItem);

  batches.forEach(batch => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'batch-button';
    button.dataset.batch = batch.batchNumber;
    button.textContent = `Batch ${batch.batchNumber} · ${batch.rankRange[0]}–${batch.rankRange[1]}`;
    button.addEventListener('click', () => {
      setBatch(Number(batch.batchNumber));
      render();
    });
    item.appendChild(button);
    batchList.appendChild(item);
  });
}

function updateBatchButtons(activeButton) {
  batchList.querySelectorAll('.batch-button').forEach(button => {
    button.classList.toggle('active', button === activeButton);
  });
}

function setBatch(batch) {
  state.filters.batch = batch;
  const selector = `.batch-button[data-batch="${batch}"]`;
  const button = batchList.querySelector(selector);
  if (button) {
    updateBatchButtons(button);
  }
}

function render() {
  if (!state.rows.length) {
    tableBody.innerHTML = '';
    updateTableStatus([]);
    copyButton.disabled = true;
    return;
  }

  const filtered = applyFilters();
  updateTableStatus(filtered);
  renderTable(filtered);
  state.currentRows = filtered;
  copyButton.disabled = filtered.length === 0;
}

function applyFilters() {
  const { search, batch, sort } = state.filters;
  const normalizedSearch = search ? normalise(search) : '';

  let rows = state.rows;

  if (batch !== 'all') {
    rows = rows.filter(row => row.batchNumber === batch);
  }

  if (normalizedSearch) {
    rows = rows.filter(row => {
      const word = normalise(row.word);
      const beta = row.betaCode ? row.betaCode.toLowerCase() : '';
      return word.includes(normalizedSearch) || beta.includes(normalizedSearch);
    });
  }

  switch (sort) {
    case 'asc':
      rows = [...rows].sort((a, b) => a.frequency - b.frequency || a.rank - b.rank);
      break;
    case 'rank':
      rows = [...rows].sort((a, b) => a.rank - b.rank);
      break;
    default:
      rows = [...rows].sort((a, b) => b.frequency - a.frequency || a.rank - b.rank);
  }

  return rows;
}

function renderTable(rows) {
  if (!rows.length) {
    tableBody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const hasBeta = state.rows.some(row => Boolean(row.betaCode));
  document.querySelector('#vocab-table th:nth-child(3)').style.visibility = hasBeta ? 'visible' : 'hidden';

  const rowsHtml = rows
    .map(row => `
      <tr>
        <td>${row.rank}</td>
        <td>${row.word}</td>
        <td>${row.betaCode ? row.betaCode : '—'}</td>
        <td>${row.frequency.toLocaleString()}</td>
      </tr>
    `)
    .join('');

  tableBody.innerHTML = rowsHtml;
}

function updateTableStatus(rows) {
  if (!tableStatus) return;
  if (!state.rows.length) {
    tableStatus.textContent = '';
    return;
  }

  const total = state.rows.length;
  const { batch, search } = state.filters;
  const parts = [];

  if (batch !== 'all') {
    parts.push(`Batch ${batch}`);
  }
  if (search) {
    parts.push(`Search "${search}"`);
  }

  const filtersSuffix = parts.length ? ` · ${parts.join(' · ')}` : '';
  tableStatus.textContent = `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} entries${filtersSuffix}`;
}

async function handleCopyBatch() {
  if (!state.currentRows || !state.currentRows.length) {
    return;
  }

  const words = state.currentRows.map(row => sanitiseWord(row.word));
  const text = words.join(', ');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    flashCopyButton();
  } catch (error) {
    console.error('Copy failed', error);
    alert('Unable to copy to clipboard.');
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function sanitiseWord(word = '') {
  return word.replace(/[-\u2010-\u2015\u2212]/g, '');
}

function flashCopyButton() {
  if (!copyButton) return;
  const original = copyButton.dataset.defaultLabel || 'Copy batch';
  copyButton.textContent = 'Copied!';
  copyButton.disabled = false;
  setTimeout(() => {
    copyButton.textContent = original;
  }, 1500);
}

function normalise(text) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\u0370-\u03FF\u1F00-\u1FFFa-z0-9·᾽\.\-\s]/g, '');
}

function formatDate(value) {
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  } catch (error) {
    // ignore
  }
  return value;
}

window.addEventListener('DOMContentLoaded', init);
