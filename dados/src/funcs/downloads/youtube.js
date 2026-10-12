import https from 'https'
import fs from 'fs'
import verificarAPI from '../ZoneAPI.js'

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function youtubeJob(input, format = 'mp3', option = 128) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { site_zone, apikey_zone } = CONFIG_FILE
    const extra = format === 'mp3'
      ? `&bitrate=${encodeURIComponent(option)}`
      : `&quality=${encodeURIComponent(option)}`

    const createUrl = `${site_zone}/v3/youtube?apikey=${encodeURIComponent(apikey_zone)}&url=${encodeURIComponent(input)}&format=${format}${extra}`
    const created = await request(createUrl)

    if (!created?.status || !created?.job_id) {
      return { ok: false, msg: created?.msg || created?.error || 'Não foi possível criar o download.' }
    }

    for (let i = 0; i < 60; i++) {
      await sleep(2000)

      const data = await request(
        `${site_zone}/v3/youtube-status?id=${encodeURIComponent(created.job_id)}`
      )

      if (data?.state === 'completed' && data?.download_url) {
        return { ok: true, data }
      }

      if (data?.state === 'failed' || data?.state === 'error' || data?.status === false) {
        return { ok: false, msg: data?.msg || data?.error || 'Falha ao processar o YouTube.' }
      }
    }

    return { ok: false, msg: 'O download demorou demais.' }
  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function search(query) {
  const result = await youtubeJob(query, 'mp3', 128)
  if (!result.ok) return result

  const d = result.data
  return {
    ok: true,
    data: {
      url: query,
      title: d.title || 'YouTube',
      description: '',
      thumbnail: d.thumbnail_url || '',
      seconds: d.duration_seconds || 0,
      timestamp: d.duration || '',
      views: 0,
      ago: '',
      author: { name: d.author_name || 'YouTube' },
      downloadUrl: d.download_url
    }
  }
}

async function mp3(input, bitrate = 128) {
  const result = await youtubeJob(input, 'mp3', bitrate)
  if (!result.ok) return result

  const d = result.data
  const buffer = await downloadFile(d.download_url)

  return {
    ok: true,
    buffer,
    title: d.title || 'YouTube Audio',
    thumbnail: d.thumbnail_url || '',
    filename: `${(d.title || 'audio').replace(/[^\w\s-]/gi, '')}.mp3`
  }
}

async function mp4(input, quality = 720) {
  const result = await youtubeJob(input, 'mp4', quality)
  if (!result.ok) return result

  const d = result.data
  const buffer = await downloadFile(d.download_url)

  return {
    ok: true,
    buffer,
    title: d.title || 'YouTube Video',
    thumbnail: d.thumbnail_url || '',
    filename: `${(d.title || 'video').replace(/[^\w\s-]/gi, '')}.mp4`
  }
}

export { search, mp3, mp4 }
export const ytmp3 = mp3
export const ytmp4 = mp4
