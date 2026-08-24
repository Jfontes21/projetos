const API_BASE = 'https://rickandmortyapi.com/api/character';

const searchInput = document.getElementById('searchInput');
const btnGo = document.getElementById('btn-go');
const btnReset = document.getElementById('btn-reset');
const statusEl = document.getElementById('status');
const catalogEl = document.getElementById('catalog');
const paginationEl = document.getElementById('pagination');

const keys = ['name', 'status', 'species', 'gender', 'origin', 'episode'];
const labels = {
  name: 'Nome',
  status: 'Status',
  species: 'Espécie',
  gender: 'Gênero',
  origin: 'Origem',
  episode: 'Episódios',
};

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

const getVisibleFields = () =>
  keys.filter((key) => document.getElementById(key)?.checked);

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle('status--error', isError);
};

const getStatusClass = (status) => {
  if (status === 'Alive') return 'status-pill--alive';
  if (status === 'Dead') return 'status-pill--dead';
  return 'status-pill--unknown';
};

const fetchCharacters = async (page = 1, query = '') => {
  const trimmed = query.trim();
  let url = `${API_BASE}?page=${page}`;

  if (trimmed) {
    url = /^\d+$/.test(trimmed)
      ? `${API_BASE}/${trimmed}`
      : `${API_BASE}?name=${encodeURIComponent(trimmed)}&page=${page}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Nenhum personagem encontrado.');
    }
    throw new Error('Erro ao carregar personagens.');
  }

  const data = await res.json();

  if (Array.isArray(data.results)) {
    return {
      characters: data.results,
      page: data.info?.pages ? Math.min(page, data.info.pages) : 1,
      totalPages: data.info?.pages || 1,
      totalCount: data.info?.count || data.results.length,
    };
  }

  return {
    characters: [data],
    page: 1,
    totalPages: 1,
    totalCount: 1,
  };
};

const createMetaRow = (label, value) => {
  const row = document.createElement('div');
  row.className = 'meta-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'meta-row__label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'meta-row__value';
  valueEl.textContent = value;

  row.append(labelEl, valueEl);
  return row;
};

const buildCard = (character) => {
  const visibleFields = getVisibleFields();
  const card = document.createElement('article');
  card.className = 'card';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'card__image-wrap';

  const image = document.createElement('img');
  image.className = 'card__image';
  image.src = character.image;
  image.alt = character.name;
  image.loading = 'lazy';

  const body = document.createElement('div');
  body.className = 'card__body';

  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = character.name;

  const meta = document.createElement('div');
  meta.className = 'card__meta';

  visibleFields.forEach((key) => {
    if (key === 'name') return;

    if (key === 'status') {
      const row = document.createElement('div');
      row.className = 'meta-row';

      const labelEl = document.createElement('span');
      labelEl.className = 'meta-row__label';
      labelEl.textContent = labels.status;

      const valueEl = document.createElement('span');
      valueEl.className = 'meta-row__value';
      valueEl.innerHTML = `<span class="status-pill ${getStatusClass(character.status)}">${character.status}</span>`;

      row.append(labelEl, valueEl);
      meta.appendChild(row);
      return;
    }

    if (key === 'origin') {
      meta.appendChild(createMetaRow(labels.origin, character.origin.name));
      return;
    }

    if (key === 'episode') {
      meta.appendChild(createMetaRow(labels.episode, `${character.episode.length} episódio(s)`));
      return;
    }

    meta.appendChild(createMetaRow(labels[key], character[key]));
  });

  imageWrap.appendChild(image);
  body.append(title, meta);
  card.append(imageWrap, body);

  return card;
};

const renderCatalog = (characters) => {
  catalogEl.innerHTML = '';

  if (!characters.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum personagem para exibir.';
    catalogEl.appendChild(empty);
    return;
  }

  characters.forEach((character) => {
    catalogEl.appendChild(buildCard(character));
  });
};

const renderPagination = () => {
  paginationEl.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn--ghost';
  prevBtn.type = 'button';
  prevBtn.textContent = 'Anterior';
  prevBtn.disabled = currentPage <= 1;

  const info = document.createElement('span');
  info.className = 'pagination__info';
  info.textContent = `Página ${currentPage} de ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn--ghost';
  nextBtn.type = 'button';
  nextBtn.textContent = 'Próxima';
  nextBtn.disabled = currentPage >= totalPages;

  prevBtn.addEventListener('click', () => loadPage(currentPage - 1));
  nextBtn.addEventListener('click', () => loadPage(currentPage + 1));

  paginationEl.append(prevBtn, info, nextBtn);
};

const showLoading = () => {
  catalogEl.innerHTML = '<div class="loading-state">Carregando personagens...</div>';
  paginationEl.innerHTML = '';
};

const loadPage = async (page = 1, query = currentQuery) => {
  showLoading();
  setStatus('Carregando catálogo...');

  try {
    const { characters, page: resolvedPage, totalPages: pages, totalCount } =
      await fetchCharacters(page, query);

    currentPage = resolvedPage;
    totalPages = pages;
    currentQuery = query;

    renderCatalog(characters);
    renderPagination();

    const suffix = currentQuery ? ` para "${currentQuery}"` : '';
    setStatus(`${totalCount} personagem(ns) encontrado(s)${suffix}.`);
  } catch (error) {
    catalogEl.innerHTML = `<div class="empty-state">${error.message}</div>`;
    paginationEl.innerHTML = '';
    setStatus(error.message, true);
  }
};

btnGo.addEventListener('click', () => {
  loadPage(1, searchInput.value);
});

btnReset.addEventListener('click', () => {
  searchInput.value = '';
  loadPage(1, '');
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    loadPage(1, searchInput.value);
  }
});

keys.forEach((key) => {
  document.getElementById(key)?.addEventListener('change', () => {
    if (catalogEl.querySelector('.card')) {
      loadPage(currentPage, currentQuery);
    }
  });
});

loadPage(1);
