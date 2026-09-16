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

// A rota devolve eventos SSE (event: / data:) em vez de um JSON único;
// ficamos com o último evento "data" recebido, que é o resultado final.
function requestSSE(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let raw = ''

      res.on('data', chunk => {
        raw += chunk
      })

      res.on('end', () => {
        try {
          const dataLines = raw
            .split('\n')
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trim())
            .filter(Boolean)

          if (!dataLines.length) {
            return reject(new Error('Resposta inválida da API'))
          }

          resolve(JSON.parse(dataLines[dataLines.length - 1]))
        } catch {
          reject(new Error('Resposta inválida da API'))
        }
      })
    }).on('error', reject)
  })
}

async function totext(url) {

  const checkAPI = await verificarAPI()

  if (checkAPI !== true) {
    return {
      ok: false,
      msg: checkAPI
    }
  }

  try {

    if (!url) {
      return {
        ok: false,
        msg: 'URL inválida'
      }
    }

    const cached = getCached(`totext:${url}`)

    if (cached) {
      return {
        ok: true,
        ...cached,
        cached: true
      }
    }

    const { apikey_zone, site_zone } = CONFIG_FILE

    const api =
      `${site_zone}/api/ia/transcrever-audio?apikey=${apikey_zone}&url=${encodeURIComponent(url)}`

    const data = await requestSSE(api)

    const checkAfter = await verificarAPI(data)

    if (checkAfter !== true) {
      return {
        ok: false,
        msg: checkAfter
      }
    }

    const texto = data?.texto || data?.text || data?.transcricao || data?.result?.text

    if (!data?.status || !texto) {
      return {
        ok: false,
        msg: data?.error || 'Não foi possível transcrever o áudio'
      }
    }

    const result = {
      texto,
      codigo: 200,
      message: 'sucesso'
    }

    setCache(`totext:${url}`, result)

    return {
      ok: true,
      ...result
    }

  } catch (err) {

    return {
      ok: false,
      msg: err.message
    }

  }
}

export { totext }
