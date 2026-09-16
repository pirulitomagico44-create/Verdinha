import https from 'https'
import fs from 'fs'
import verificarAPI from '../API.js'

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
)

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return item.val
}

function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, {
    val,
    ts: Date.now()
  })
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('Resposta inválida da API'))
        }
      })
    }).on('error', reject)
  })
}

function formatResult(data) {
  return {
    criador: 'null',
    title: data.titulo,
    urls: data.is_video ? [data.download_url] : (data.imagens || []),
    type: data.is_video ? 'video' : 'image',
    mime: data.is_video ? 'video/mp4' : 'image/jpeg',
    audio: data.musica?.url || null,
    cover: data.autor?.avatar,
    link: `https://www.tiktok.com/@${data.autor?.username}/video/${data.id}`,
    views: data.stats?.views
  }
}

async function dl(url) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) {
    return { ok: false, msg: checkAPI }
  }

  try {
    if (!url) {
      return { ok: false, msg: 'URL inválida' }
    }

    const cached = getCached(`download:${url}`)
    if (cached) return { ok: true, ...cached, cached: true }

    const { apikey_zone, site_zone } = CONFIG_FILE
    const api = `${site_zone}/api/v2/tiktok?apikey=${apikey_zone}&url=${encodeURIComponent(url)}`

    const data = await request(api)

    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter }
    }

    if (!data?.status) {
      return { ok: false, msg: data?.error || 'Não foi possível obter o vídeo' }
    }

    const response = formatResult(data)

    setCache(`download:${url}`, response)

    return { ok: true, ...response }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function search(query) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) {
    return { ok: false, msg: checkAPI }
  }

  try {
    if (!query) {
      return { ok: false, msg: 'Termo de pesquisa inválido' }
    }

    const cached = getCached(`search:${query}`)
    if (cached) return { ok: true, ...cached, cached: true }

    const { site_zone } = CONFIG_FILE
    const url = `${site_zone}/api/tiktok/search?q=${encodeURIComponent(query)}&count=1`

    const data = await request(url)

    if (!data?.status || !data?.results?.length) {
      return { ok: false, msg: 'Nenhum vídeo encontrado' }
    }

    const video = data.results[0]
    const tiktokUrl = `https://www.tiktok.com/@${video.author}/video/${video.id}`

    const dlResult = await dl(tiktokUrl)
    if (!dlResult.ok) return dlResult

    setCache(`search:${query}`, dlResult)

    return dlResult

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

export { search, dl }
