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
    cache.set(key, { val, ts: Date.now() });
}

function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error('Resposta inválida da API'));
                }
            });
        }).on('error', reject);
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

/**
 * Gera figurinha Brat (Retorna a URL da imagem)
 */
async function gerarbrat(query, bg, text_color, blur) {
    const checkAPI = await verificarAPI();
    if (checkAPI !== true) return { ok: false, msg: checkAPI };

    try {
        if (!query) return { ok: false, msg: 'O texto (query) é obrigatório' };

        const cacheKey = `brat:${query.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) return { ok: true, ...cached, cached: true };

        const { site_zone } = CONFIG_FILE;

        const url = `${site_zone}/api/brat?text=${encodeURIComponent(query)}`;

        const data = await request(url);

        const checkAfter = await verificarAPI(data);
        if (checkAfter !== true) return { ok: false, msg: checkAfter };

        if (!data?.status || !data?.imagem) {
            return { ok: false, msg: data?.error || 'Erro ao gerar o sticker Brat' };
        }

        const result = {
            criador: 'Tokyo',
            type: 'image',
            mime: 'image/webp',
            query,
            url: data.imagem
        };

        setCache(cacheKey, result);
        return { ok: true, ...result };

    } catch (err) {
        return { ok: false, msg: err.message };
    }
}


async function gerarbratvid(query, bg, text_color, bpm, blur) {
    const checkAPI = await verificarAPI();
    if (checkAPI !== true) return { ok: false, msg: checkAPI };

    try {
        if (!query) return { ok: false, msg: 'O texto (query) é obrigatório' };

        const cacheKey = `bratvid:${query.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) return { ok: true, ...cached, cached: true };

        const { site_zone } = CONFIG_FILE;

        const url = `${site_zone}/api/brat?text=${encodeURIComponent(query)}&animado=true`;

        const data = await request(url);

        const checkAfter = await verificarAPI(data);
        if (checkAfter !== true) return { ok: false, msg: checkAfter };

        if (!data?.status || !data?.imagem) {
            return { ok: false, msg: data?.error || 'Erro ao gerar o sticker Brat animado' };
        }

        const result = {
            criador: 'Tokyo',
            type: 'video',
            mime: 'image/webp',
            query,
            url: data.imagem
        };

        setCache(cacheKey, result);
        return { ok: true, ...result };

    } catch (err) {
        return { ok: false, msg: err.message };
    }
}


async function gerarwelcomecard(avatar, nome, texto, fundo, corMoldura, corLinhas, glow) {
    const checkAPI = await verificarAPI();
    if (checkAPI !== true) return { ok: false, msg: checkAPI };

    try {

        if (!avatar || !nome) {
            return { ok: false, msg: 'Avatar e Nome são obrigatórios para o Welcome Card' };
        }

        const { site_zone } = CONFIG_FILE;

        const body = { nome, image: avatar };

        if (texto) body.titulo = texto;
        if (fundo) {
            if (/^https?:\/\//i.test(fundo)) body.background = fundo;
            else body.bg = fundo;
        }
        if (corMoldura) body.ringColor = corMoldura;
        if (corLinhas) body.barColor = corLinhas;
        if (glow !== undefined && glow !== null && glow !== '') {
            body.glow = (glow === true || glow === 'true') ? 1 : 0;
        }

        const data = await postJSON(`${site_zone}/canvas/bemvindo`, body);

        const checkAfter = await verificarAPI(data);
        if (checkAfter !== true) {
            return { ok: false, msg: checkAfter };
        }

        if (!data?.status || !data?.imagem) {
            return { ok: false, msg: data?.error || 'Não foi possível gerar o Welcome Card' };
        }

        const result = {
            criador: 'Tokyo',
            type: 'image',
            mime: 'image/png',
            nome,
            url: data.imagem
        };

        return { ok: true, ...result };

    } catch (err) {
        return { ok: false, msg: err.message };
    }
}




export {
    gerarbrat,
    gerarbratvid,
    gerarwelcomecard
};
