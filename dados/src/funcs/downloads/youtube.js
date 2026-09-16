import https from 'https'
import fs from 'fs'
import verificarAPI from '../API.js'

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
)

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

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

function parseDurationToSeconds(duration) {
  if (typeof duration !== 'string') return 0
  const parts = duration.split(':').map(n => parseInt(n, 10) || 0)
  return parts.reduce((acc, part) => acc * 60 + part, 0)
}

// A rota não devolve o canal/artista separado do título, então tentamos
// extrair do formato comum "Artista - Título"; sem isso, cai no genérico.
function guessAuthorName(title) {
  if (typeof title === 'string' && title.includes(' - ')) {
    return title.split(' - ')[0].trim()
  }
  return 'YouTube'
}

async function search(query) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { site_zone, apikey_zone } = CONFIG_FILE
    const url = `${site_zone}/v2/player?text=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apikey_zone)}`

    const data = await request(url)

    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    if (!data?.status) {
      return { ok: false, msg: data?.msg || 'Erro ao buscar vídeo' }
    }

    const seconds = parseDurationToSeconds(data.duration)

    return {
      ok: true,
      data: {
        url: data.youtube_url,
        title: data.title,
        description: '',
        thumbnail: data.thumbnail,
        seconds,
        timestamp: data.duration,
        views: 0,
        ago: '',
        author: { name: guessAuthorName(data.title) },
        downloadUrl: data.download_url
      }
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function mp3(url) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { site_zone, apikey_zone } = CONFIG_FILE
    const api = `${site_zone}/v2/player?text=${encodeURIComponent(url)}&apikey=${encodeURIComponent(apikey_zone)}`

    const data = await request(api)

    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    if (!data?.status || !data?.download_url) {
      return { ok: false, msg: data?.msg || 'URL de download não encontrada' }
    }

    const buffer = await downloadFile(data.download_url)

    return {
      ok: true,
      buffer,
      title: data.title || 'YouTube Audio',
      thumbnail: data.thumbnail || '',
      filename: `${(data.title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function mp4(url) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { site_zone, apikey_zone } = CONFIG_FILE
    const api = `${site_zone}/api/ytmp4?text=${encodeURIComponent(url)}&quality=720p&apikey=${encodeURIComponent(apikey_zone)}`

    const data = await request(api)

    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    const resposta = data?.result

    if (!data?.status || !resposta?.download) {
      return { ok: false, msg: data?.error || 'URL de download não encontrada' }
    }

    const buffer = await downloadFile(resposta.download)

    return {
      ok: true,
      buffer,
      title: resposta.title || 'YouTube Video',
      thumbnail: resposta.thumbnail || '',
      filename: `${(resposta.title || 'video').replace(/[^\w\s]/gi, '')}.mp4`
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

export { search, mp3, mp4 }
export const ytmp3 = mp3
export const ytmp4 = mp4
