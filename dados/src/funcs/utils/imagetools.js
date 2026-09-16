import https from 'https';
import fs from 'fs';
import verificarAPI from '../API.js';

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
);

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

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
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  cache.set(key, {
    val,
    ts: Date.now()
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Resposta inválida da API'));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}



async function removeBg(url) {

  const checkAPI = await verificarAPI();

  if (checkAPI !== true) {
    return {
      ok: false,
      msg: checkAPI
    };
  }

  try {

    if (!url || typeof url !== 'string') {
      return {
        ok: false,
        msg: 'URL da imagem é obrigatória'
      };
    }

    const cached = getCached(`removebg:${url}`);

    if (cached) {
      return {
        ok: true,
        ...cached,
        cached: true
      };
    }

    const { site_zone } = CONFIG_FILE;

    const data = await postJSON(`${site_zone}/api/removebg`, { url });

    const checkAfter = await verificarAPI(data);
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter };
    }

    if (!data?.status || !data?.imagem) {
      return {
        ok: false,
        msg: data?.error || 'A API não retornou uma imagem válida.'
      };
    }

    const result = {
      status: true,
      criador: 'Tokyo',
      type: 'image',
      mime: 'image/png',
      download: data.imagem
    };

    setCache(`removebg:${url}`, result);

    return {
      ok: true,
      ...result
    };

  } catch (error) {

    console.log('[RemoveBG] Erro:', error);

    return {
      ok: false,
      msg: error.message || 'Erro ao remover fundo da imagem'
    };

  }

}




async function upscale(url, scale = 2) {

  const checkAPI = await verificarAPI();

  if (checkAPI !== true) {
    return {
      ok: false,
      msg: checkAPI
    };
  }

  try {

    if (!url || typeof url !== 'string') {
      return {
        ok: false,
        msg: 'URL da imagem é obrigatória'
      };
    }

    const cached = getCached(`upscale:${url}:${scale}`);

    if (cached) {
      return {
        ok: true,
        ...cached,
        cached: true
      };
    }

    const { apikey_zone, site_zone } = CONFIG_FILE;

    const data = await postJSON(`${site_zone}/api/upscaler?apikey=${apikey_zone}`, { url, scale });

    const checkAfter = await verificarAPI(data);
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter };
    }

    if (!data?.status || !data?.url) {
      return {
        ok: false,
        msg: data?.error || 'Erro ao melhorar imagem'
      };
    }

    const result = {
      status: true,
      criador: 'Tokyo',
      type: 'image',
      mime: 'image/png',
      scale,
      download: data.url
    };

    setCache(`upscale:${url}:${scale}`, result);

    return {
      ok: true,
      ...result
    };

  } catch (error) {

    return {
      ok: false,
      msg: error.message || 'Erro ao melhorar imagem'
    };

  }

}

export default {
  removeBg,
  upscale
};

export {
  removeBg,
  upscale
};
