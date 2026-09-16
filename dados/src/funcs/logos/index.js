import https from 'https';
import fs from 'fs';
import verificarAPI from '../API.js';

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
);

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { val, ts: Date.now() });
}

function requestJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return requestBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Mapa dos tipos de logo antigos (vex) pra rota equivalente na zone.api.br.
// A zone.api.br não tem um efeito equivalente pra todo tipo antigo — os que
// não estão aqui respondem com uma mensagem de "efeito indisponível".
const SINGLE_TEXT_MAP = {
  colorful: '/api/ephoto/colorful',
  balloon: '/api/ephoto/balloon',
  glitch: '/api/ephoto/glitch',
  comics: '/api/ephoto/comic3d',
  frozen: '/api/ephoto/frozen-christmas',
  graffitistyle: '/api/photooxy/graffiticover',
  metal: '/api/photooxy/metalictext',
  cemiterio: '/api/photooxy/cemetery'
};

// Tipos com dois textos (text1 pequeno + text2 grande), usados via gerarLogo2.
const DUAL_TEXT_MAP = {
  pornhub: '/api/ephoto/pornhub',
  deadpool: '/api/ephoto/deadpool'
};

async function gerarLogo({ query, type }) {
  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {
    if (!query || !type) {
      return { ok: false, msg: '❌ Parâmetros obrigatórios não informados.' };
    }

    const path = SINGLE_TEXT_MAP[type];

    if (!path) {
      return {
        ok: false,
        msg: `❌ Esse efeito ("${type}") ainda não está disponível na nova API.`
      };
    }

    const cacheKey = `logo:${type}:${query}`;
    const cached = getCached(cacheKey);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_zone, site_zone } = CONFIG_FILE;
    const url = `${site_zone}${path}?apikey=${apikey_zone}&text=${encodeURIComponent(query)}`;

    const json = await requestJSON(url);

    const checkAfter = await verificarAPI(json);
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter };
    }

    if (!json?.status || !json?.imagem) {
      return { ok: false, msg: json?.error || '❌ Não foi possível gerar o logotipo.' };
    }

    const buffer = await requestBuffer(json.imagem);

    if (!buffer || buffer.length === 0) {
      return { ok: false, msg: '❌ Resposta não é uma imagem válida.' };
    }

    const response = { buffer };
    setCache(cacheKey, response);

    return { ok: true, ...response };

  } catch (err) {
    return { ok: false, msg: `❌ Erro ao gerar o logo: ${err.message}` };
  }
}
async function gerarLogo2({ query, query2, type }) {
  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {
    if (!query || !query2 || !type) {
      return { ok: false, msg: '❌ Parâmetros obrigatórios não informados.' };
    }

    const path = DUAL_TEXT_MAP[type];

    if (!path) {
      return {
        ok: false,
        msg: `❌ Esse efeito ("${type}") ainda não está disponível na nova API.`
      };
    }

    const cacheKey = `logo:${type}:${query}:${query2}`;
    const cached = getCached(cacheKey);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_zone, site_zone } = CONFIG_FILE;
    const url = `${site_zone}${path}?apikey=${apikey_zone}&text1=${encodeURIComponent(query)}&text2=${encodeURIComponent(query2)}`;

    const json = await requestJSON(url);

    const checkAfter = await verificarAPI(json);
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter };
    }

    if (!json?.status || !json?.imagem) {
      return { ok: false, msg: json?.error || '❌ Não foi possível gerar o logotipo.' };
    }

    const buffer = await requestBuffer(json.imagem);

    if (!buffer || buffer.length === 0) {
      return { ok: false, msg: '❌ Resposta não é uma imagem válida.' };
    }

    const response = { buffer };
    setCache(cacheKey, response);

    return { ok: true, ...response };

  } catch (err) {
    return { ok: false, msg: `❌ Erro ao gerar o logo: ${err.message}` };
  }
}

export { gerarLogo, gerarLogo2 };
