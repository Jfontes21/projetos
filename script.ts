interface Location {
  name: string;
  url: string;
}
 
interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  gender: string;
  origin: Location;
  location: Location;
  image: string;
  episode: string[];
}
 
type CharacterKey = 'name' | 'status' | 'species' | 'gender' | 'origin' | 'episode';
 
const characterId = document.getElementById('characterId') as HTMLInputElement;
const btnGo = document.getElementById('btn-go') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const content = document.getElementById('content') as HTMLDivElement;
const image = document.getElementById('img') as HTMLImageElement;
const statusIndicator = document.getElementById('status-indicator') as HTMLElement;
 
const fetchApi = async (value: string): Promise<Character> => {
  const res = await fetch(`https://rickandmortyapi.com/api/character/${value}`);
  if (!res.ok) {
    throw new Error(`Citizen ${value} not found`);
  }
  return res.json() as Promise<Character>;
};
 
const keys: CharacterKey[] = ['name', 'status', 'species', 'gender', 'origin', 'episode'];
 
const newKeys: Record<CharacterKey, string> = {
  name: 'Nome',
  status: 'Status',
  species: 'Espécie',
  gender: 'Gênero',
  origin: 'Planeta de origem',
  episode: 'Episódios',
};
 
const buildResult = (result: Character): void => {
  content.innerHTML = '';
 
  keys
    .map((key) => document.getElementById(key) as HTMLInputElement)
    .forEach((elem) => {
      if (!elem || !elem.checked) return;
 
      const key = elem.name as CharacterKey;
      const value = result[key];
      const row = document.createElement('p');
      row.className = 'result__row';
 
      if (Array.isArray(value)) {
        row.innerHTML = `<span class="result__label">${newKeys[key]}</span><span class="result__value">${value.length} episódio(s)</span>`;
      } else if (key === 'origin') {
        row.innerHTML = `<span class="result__label">${newKeys[key]}</span><span class="result__value">${(value as Location).name}</span>`;
      } else if (typeof value !== 'object') {
        row.innerHTML = `<span class="result__label">${newKeys[key]}</span><span class="result__value">${value}</span>`;
      }
      content.appendChild(row);
    });
};
 
const setStatus = (label: string, tone: 'idle' | 'loading' | 'error' | 'ok'): void => {
  statusIndicator.textContent = label;
  statusIndicator.className = `terminal__status terminal__status--${tone}`;
};
 
btnGo.addEventListener('click', async () => {
  const value = characterId.value.trim();
 
  if (value === '') {
    content.innerHTML = '<p class="result__placeholder result__placeholder--error">É necessário informar um ID.</p>';
    setStatus('ERRO', 'error');
    return;
  }
 
  setStatus('BUSCANDO...', 'loading');
 
  try {
    const result = await fetchApi(value);
    image.src = result.image;
    image.alt = result.name;
    buildResult(result);
    setStatus('CONECTADO', 'ok');
  } catch {
    content.innerHTML = '<p class="result__placeholder result__placeholder--error">Cidadão não encontrado.</p>';
    image.src = '';
    image.alt = '';
    setStatus('ERRO', 'error');
  }
});
 
btnReset.addEventListener('click', () => location.reload());
 
export {};