import fs from 'fs';
import path from 'path';
import sharp from 'sharp'
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
function patchBaileysNewsletterFollow() {
  try {

    const targetFile = path.join(
      process.cwd(),
      'node_modules',
      'baileys',
      'lib',
      'Socket',
      'newsletter.js'
    );
    if (!fs.existsSync(targetFile)) {
      console.log(`[PATCH] Arquivo não encontrado: ${targetFile}`);
      return false;
    }

    let content = fs.readFileSync(targetFile, 'utf-8');

    if (
      content.includes("newsletterFollow: async (jid) =>") &&
      content.includes("action: 'follow'")
    ) {
      console.log('[PATCH] newsletterFollow já está atualizado.');
      return true;
    }

    const oldPattern =
      /newsletterFollow:\s*\(jid\)\s*=>\s*\{\s*return\s+executeWMexQuery\(\s*\{\s*newsletter_id:\s*jid\s*\},\s*QueryIds\.FOLLOW,\s*XWAPaths\.xwa2_newsletter_follow\s*\);\s*\}/;

    const newCode = `newsletterFollow: async (jid) => {
                try {
                    const canais = Array.isArray(jid) ? jid : [jid];

                    for (const id of canais) {
                        await query({
                            tag: 'iq',
                            attrs: {
                                type: 'set',
                                xmlns: 'w:newsletters'
                            },
                            content: [{
                                tag: 'newsletter',
                                attrs: {
                                    jid: id,
                                    action: 'follow'
                                }
                            }]
                        });
                    }
                } catch (e) {
                    return null;
                }
            }`;

    if (!oldPattern.test(content)) {
      console.log('[PATCH] Padrão antigo de newsletterFollow não encontrado.');
      return false;
    }

    const patchedContent = content.replace(oldPattern, newCode);

    if (patchedContent === content) {
      console.log('[PATCH] Nenhuma alteração foi aplicada.');
      return false;
    }

    fs.writeFileSync(targetFile, patchedContent, 'utf-8');
    console.log('[PATCH] newsletterFollow corrigido com sucesso.');
    return true;
  } catch (error) {
    console.error('[PATCH] Erro ao corrigir newsletterFollow:', error.message);
    return false;
  }
}

patchBaileysNewsletterFollow();


import {
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessage,
  getContentType,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from 'baileys';


import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { parseHTML } from 'linkedom';
import axios from 'axios';
import pathz from 'path';
import webpmux from 'node-webpmux';

const originalWriteFileSync = fs.writeFileSync;
const originalWriteFile = fs.writeFile;

function isAluguelFile(file) {
  return typeof file === 'string' && file.includes('alugueis');
}

// 🔴 intercepta writeFileSync
fs.writeFileSync = function (file, data, ...args) {
  if (isAluguelFile(file)) {
    console.log('\n🚨🚨🚨 WRITE DETECTADO (SYNC) 🚨🚨🚨');
    console.log('📁 Arquivo:', file);

    try {
      const parsed = JSON.parse(data);
      console.log('📊 Conteúdo que vai salvar:\n', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('📊 Conteúdo bruto:', data);
    }

    console.trace('📍 STACK TRACE (quem chamou):');
  }

  return originalWriteFileSync.call(this, file, data, ...args);
};

// 🔴 intercepta writeFile async também
fs.writeFile = function (file, data, ...args) {
  if (isAluguelFile(file)) {
    console.log('\n🚨🚨🚨 WRITE DETECTADO (ASYNC) 🚨🚨🚨');
    console.log('📁 Arquivo:', file);

    try {
      const parsed = JSON.parse(data);
      console.log('📊 Conteúdo que vai salvar:\n', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('📊 Conteúdo bruto:', data);
    }

    console.trace('📍 STACK TRACE (quem chamou):');
  }

  return originalWriteFile.call(this, file, data, ...args);
};
import { readFile, writeFile } from 'fs/promises';
import os from 'os';
import https from 'https';
import crypto from 'crypto';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import RentalExpirationManager from './utils/rentalExpirationManager.js';
import { PerformanceOptimizer, getPerformanceOptimizer } from './utils/performanceOptimizer.js';
import { recalcEquipmentBonuses } from './utils/equipment.js';
import * as ia from './funcs/private/ia.js';
import * as vipCommandsManager from './utils/vipCommandsManager.js';
import { getInfo as gdriveGetInfo } from './funcs/utils/gdrive.js';
import { getInfo as mediafireGetInfo } from './funcs/utils/mediafire.js';
import { getInfo as twitterGetInfo } from './funcs/utils/twitter.js';
import { removeBg, upscale } from './funcs/utils/imagetools.js';
import spotifyModule from './funcs/downloads/spotify.js';
import captchaIndex, { initCaptchaIndex, addCaptcha, removeCaptcha, getCaptcha, hasPendingCaptcha } from './utils/captchaIndex.js';
import CaptchaIndex from './utils/captchaIndex.js';
import fsPromises from 'fs/promises';
import {
  formatUptime,
  normalizar,
  isGroupId,
  isUserId,
  isValidLid,
  isValidJid,
  getUserName,
  getLidFromJid,
  buildUserId,
  getBotId,
  ensureDirectoryExists,
  ensureJsonFileExists,
  loadJsonFile,
  initJidLidCache,
  saveJidLidCache,
  getLidFromJidCached,
  normalizeUserId,
  convertIdsToLid,
  idsMatch,
  idInArray
} from './utils/helpers.js';
import {
  loadMsgPrefix,
  saveMsgPrefix,
  loadMsgBotOn,
  saveMsgBotOn,
  loadCmdNotFoundConfig,
  saveCmdNotFoundConfig,
  validateMessageTemplate,
  formatMessageWithFallback,
  loadCustomReacts,
  saveCustomReacts,
  loadReminders,
  saveReminders,
  addCustomReact,
  deleteCustomReact,
  loadDivulgacao,
  saveDivulgacao,
  loadDonoDivulgacao,
  saveDonoDivulgacao,
  loadSubdonos,
  saveSubdonos,
  isSubdono,
  addSubdono,
  removeSubdono,
  getSubdonos,
  loadRentalData,
  saveRentalData,
  isRentalModeActive,
  setRentalMode,
  getGroupRentalStatus,
  setGroupRental,
  loadActivationCodes,
  saveActivationCodes,
  generateActivationCode,
  validateActivationCode,
  useActivationCode,
  extendGroupRental,
  isModoLiteActive,
  loadParceriasData,
  saveParceriasData,
  calculateNextLevelXp,
  getPatent,
  loadEconomy,
  saveEconomy,
  getEcoUser,
  parseAmount,
  fmt,
  timeLeft,
  applyShopBonuses,
  PICKAXE_TIER_MULT,
  PICKAXE_TIER_ORDER,
  SHOP_ITEMS,
  getActivePickaxe,
  ensureEconomyDefaults,
  giveMaterial,
  generateDailyChallenge,
  ensureUserChallenge,
  updateChallenge,
  isChallengeCompleted,
  updateQuestProgress,
  diagnosticDatabase,
  SKILL_LIST,
  ensureUserSkills,
  skillXpForNext,
  addSkillXP,
  getSkillBonus,
  endOfWeekTimestamp,
  endOfMonthTimestamp,
  generateWeeklyChallenge,
  generateMonthlyChallenge,
  ensureUserPeriodChallenges,
  updatePeriodChallenge,
  isPeriodCompleted,
  checkLevelUp,
  checkLevelDown,
  loadCustomAutoResponses,
  saveCustomAutoResponses,
  loadGroupAutoResponses,
  saveGroupAutoResponses,
  addAutoResponse,
  deleteAutoResponse,
  processAutoResponse,
  sendAutoResponse,
  loadCustomCommands,
  saveCustomCommands,
  removeCustomCommand,
  findCustomCommand,
  loadNoPrefixCommands,
  saveNoPrefixCommands,
  loadCommandAliases,
  saveCommandAliases,
  loadGlobalBlacklist,
  saveGlobalBlacklist,
  addGlobalBlacklist,
  removeGlobalBlacklist,
  getGlobalBlacklist,
  loadMenuDesign,
  saveMenuDesign,
  getMenuDesignWithDefaults,
  setSupportMode,
  findSupportTicketById,
  createSupportTicket,
  acceptSupportTicket,
  loadCommandLimits,
  saveCommandLimits,
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  formatTimeLeft,
  runDatabaseSelfTest,
  // Funções de segurança
  loadJsonFileSafe,
  saveJsonFileSafe,
  loadLevelingSafe,
  saveLevelingSafe,
  getLevelingUser,
  validateLevelingUser,
  validateEconomyUser,
  // Funções de normalização de parâmetros
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  matchParam,
  resolveParamAlias,
  // Sistema de Personalização de Grupo
  loadGroupCustomization,
  isGroupCustomizationEnabled,
  setGroupCustomizationEnabled,
  getGroupCustomization,
  setGroupCustomName,
  setGroupCustomPhoto,
  removeGroupCustomName,
  removeGroupCustomPhoto,
  // Sistema de Áudio do Menu
  loadMenuAudio,
  isMenuAudioEnabled,
  getMenuAudioPath,
  setMenuAudio,
  removeMenuAudio,
  // Sistema de Ler Mais do Menu
  isMenuLerMaisEnabled,
  setMenuLerMais,
  getMenuLerMaisText
} from './utils/database.js';
import { parseCustomCommandMeta, buildUsageFromParams, parseArgsFromString, escapeRegExp, validateParamValue } from './utils/helpers.js';
import {
  PACKAGE_JSON_PATH,
  CONFIG_FILE,
  DATABASE_DIR,
  GRUPOS_DIR,
  USERS_DIR,
  DONO_DIR,
  PARCERIAS_DIR,
  TMP_DIR,
  LEVELING_FILE,
  CUSTOM_AUTORESPONSES_FILE,
  DIVULGACAO_FILE,
  NO_PREFIX_COMMANDS_FILE,
  COMMAND_ALIASES_FILE,
  GLOBAL_BLACKLIST_FILE,
  MENU_DESIGN_FILE,
  ECONOMY_FILE,
  MSGPREFIX_FILE,
  CUSTOM_REACTS_FILE,
  REMINDERS_FILE,
  CMD_NOT_FOUND_FILE,
  ANTIFLOOD_FILE,
  ANTIPV_FILE,
  GLOBAL_BLOCKS_FILE,
  GLOBAL_SETTINGS_FILE,
  CMD_LIMIT_FILE,
  CMD_USER_LIMITS_FILE,
  ANTISPAM_FILE,
  BOT_STATE_FILE,
  AUTO_HORARIOS_FILE,
  AUTO_MENSAGENS_FILE,
  MODO_LITE_FILE,
  JID_LID_CACHE_FILE,
  MASS_MENTION_LIMIT_FILE,
  MASS_MENTION_CONFIG_FILE
} from './utils/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);
const OWNER_ONLY_MESSAGE = '🚫 Este comando é apenas para o dono do bot!';

// Função para formatar respostas de IA para WhatsApp (converte ** para *)
const formatAIResponse = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '*$1*')  // ***text*** -> *text*
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')      // **text** -> *text*
    .replace(/_{2,}([^_]+)_{2,}/g, '_$1_')    // __text__ -> _text_
    .replace(/```[\s\S]*?```/g, '')           // Remove blocos de código
    .replace(/`([^`]+)`/g, '$1')              // Remove inline code
    .replace(/^#{1,6}\s+/gm, '')              // Remove headers markdown
    .replace(/\n{3,}/g, '\n\n')               // Limita quebras de linha
    .trim();
};

const writeJsonFile = (filePath, data) => {
  try {
    // Validação de entrada
    if (data === undefined || data === null) {
      console.error(`❌ writeJsonFile: Tentativa de salvar dados nulos em ${filePath}`);
      return false;
    }

    // Testa se dados são serializáveis
    let jsonString;
    try {
      jsonString = JSON.stringify(data, null, 2);
    } catch (stringifyError) {
      console.error(`❌ writeJsonFile: Dados não serializáveis para ${filePath}:`, stringifyError.message);
      return false;
    }

    // Valida JSON gerado
    try {
      JSON.parse(jsonString);
    } catch (validateError) {
      console.error(`❌ writeJsonFile: JSON inválido gerado para ${filePath}`);
      return false;
    }

    ensureDirectoryExists(pathz.dirname(filePath));

    // Escreve em arquivo temporário primeiro (operação atômica)
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, jsonString, 'utf-8');

    // Verifica integridade do arquivo temporário
    try {
      const writtenContent = fs.readFileSync(tempPath, 'utf-8');
      JSON.parse(writtenContent);
    } catch (verifyError) {
      console.error(`❌ writeJsonFile: Verificação falhou para ${filePath}`);
      try { fs.unlinkSync(tempPath); } catch (e) { }
      return false;
    }

    // Move arquivo temporário para destino (atômico)
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever JSON em ${filePath}:`, error.message);
    // Tenta limpar arquivo temporário
    try {
      const tempPath = filePath + '.tmp';
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (e) { }
    return false;
  }
};

/**
 * Versão assíncrona do writeJsonFile - não bloqueia o event loop
 * @param {string} filePath - Caminho do arquivo
 * @param {object} data - Dados a serem salvos
 * @returns {Promise<boolean>}
 */
const writeJsonFileAsync = async (filePath, data) => {
  try {
    if (data === undefined || data === null) {
      console.error(`❌ writeJsonFileAsync: Tentativa de salvar dados nulos em ${filePath}`);
      return false;
    }

    let jsonString;
    try {
      jsonString = JSON.stringify(data, null, 2);
    } catch (stringifyError) {
      console.error(`❌ writeJsonFileAsync: Dados não serializáveis para ${filePath}:`, stringifyError.message);
      return false;
    }

    // Valida JSON gerado
    try {
      JSON.parse(jsonString);
    } catch (validateError) {
      console.error(`❌ writeJsonFileAsync: JSON inválido gerado para ${filePath}`);
      return false;
    }

    await fsPromises.mkdir(pathz.dirname(filePath), { recursive: true });

    // Escreve em arquivo temporário primeiro (operação atômica)
    const tempPath = filePath + '.tmp';
    await fsPromises.writeFile(tempPath, jsonString, 'utf-8');

    // Verifica integridade
    try {
      const writtenContent = await fsPromises.readFile(tempPath, 'utf-8');
      JSON.parse(writtenContent);
    } catch (verifyError) {
      console.error(`❌ writeJsonFileAsync: Verificação falhou para ${filePath}`);
      try { await fsPromises.unlink(tempPath); } catch (e) { }
      return false;
    }

    // Move arquivo temporário para destino (atômico)
    await fsPromises.rename(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever JSON async em ${filePath}:`, error.message);
    try {
      const tempPath = filePath + '.tmp';
      await fsPromises.unlink(tempPath).catch(() => { });
    } catch (e) { }
    return false;
  }
};

/**
 * Leitura assíncrona de arquivo JSON
 * @param {string} filePath - Caminho do arquivo
 * @param {object} defaultValue - Valor padrão se arquivo não existir
 * @returns {Promise<object>}
 */
const readJsonFileAsync = async (filePath, defaultValue = {}) => {
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Erro ao ler JSON async de ${filePath}:`, error.message);
    }
    return defaultValue;
  }
};

/**
 * Verifica se arquivo existe (assíncrono)
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<boolean>}
 */
const fileExistsAsync = async (filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
};




const modules = await import('./funcs/exports.js');
const {
  youtube,
  tiktok,
  totext,
  pinterest,
  igdl,
  kwai,
  sendSticker,
  styleText,
  logos,
  edits,
  Logos2,
  emojiMix,
  upload,
  tictactoe,
  toolsJson,
  vabJson,
  Lyrics,
  commandStats,
  //ia,
  VerifyUpdate,
  temuScammer,
  relationshipManager,
  spotify,
  soundcloud,
  facebook,
  // Novos módulos
  connect4,
  uno,
  memoria,
  achievements,
  gifts,
  reputation,
  qrcode,
  notes,
  calculator,
  audioEdit,
  antitoxic,
  iaExpanded,
  antipalavra,
  transmissao,
  canvas
} = modules.default;


async function createGroupMessage(NazunaSock, groupMetadata, participants, settings, isWelcome = true) {
  const globalJson = JSON.parse(
    fs.readFileSync(DATABASE_DIR + '/global.json', 'utf-8')
  );

  const mentions = participants.map(p => p);

  const replacements = {
    '#numerodele#': participants.map(p => `@${p.split('@')[0]}`).join(', '),
    '#nomedogp#': groupMetadata.subject,
    '#desc#': groupMetadata.desc || 'Nenhuma',
    '#membros#': groupMetadata.participants.length,
  };

  const defaultText = isWelcome
    ? (globalJson.textbv || "╭━━━⊱ 🌟 *BEM-VINDO(A/S)!* 🌟 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🏠 Grupo: *#nomedogp#*\n│ 👥 Membros: *#membros#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n✨ *Seja bem-vindo(a/s) ao grupo!* ✨")
    : (globalJson.exit?.text || "╭━━━⊱ 👋 *ATÉ LOGO!* 👋 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🚪 Saiu do grupo\n│ *#nomedogp#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n💫 *Até a próxima!* 💫");

  const text = formatMessageText(settings.text || defaultText, replacements);

  const message = {
    text,
    mentions
  };

  if (settings.photo === false) {
    // Foto de boas-vindas desativada explicitamente: não envia imagem em nenhuma hipótese.
  } else if (settings.photoType === 'api' && isWelcome) {
    let profilePicUrl = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';

    if (participants.length === 1) {
      profilePicUrl = await NazunaSock.profilePictureUrl(participants[0], 'image')
        .catch(() => profilePicUrl);
    }

    const nome = participants.length === 1
      ? participants[0].split('@')[0]
      : `${participants.length} membros`;

    const result = await canvas.gerarwelcomecard(
      profilePicUrl,
      nome,
      'Bem vindo (a)!',
      globalJson.welcomecard?.fundo || null,
      globalJson.welcomecard?.corMoldura || null,
      globalJson.welcomecard?.corLinhas || null,
      false
    );

    if (result?.ok) {
      message.image = { url: result.url };
      message.caption = text;
      delete message.text;
    }
  } else if (settings.photoType === 'custom' && settings.image) {
    message.image = { url: settings.image };
    message.caption = text;
    delete message.text;
  } else if (globalJson.welcomecard?.fundo) {
    message.image = { url: globalJson.welcomecard.fundo };
    message.caption = text;
    delete message.text;
  }

  return message;
}

async function loadGroupSettings(groupId) {
  const groupFilePath = path.join(DATABASE_DIR, 'grupos', `${groupId}.json`);

  try {
    const data = await readFile(groupFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`❌ Erro ao ler configurações do grupo ${groupId}: ${e.message}`);
    return {};
  }
}



function formatMessageText(template, replacements) {
  let text = template;
  for (const [key, value] of Object.entries(replacements)) {
    text = text.replaceAll(key, value);
  }
  return text;
}

const handleCaptchaResponse = async (nazu, info, from, sender, text) => {

  await CaptchaIndex.init();

  const now = Date.now();
  const senderNormalized = (info.key?.participantAlt || sender)
    ?.replace(/@.*/, '');

  const isCapUser = CaptchaIndex.get(senderNormalized);

  const { total: totalPendentes } = CaptchaIndex.stats();
  //console.log('infooooooooooo', info)
  //console.log('\n--- [INÍCIO DA VALIDAÇÃO DE CAPTCHA] ---');
  //console.log('[DEBUG] Sender:', sender);
  //console.log('[DEBUG] Sender Normalizado:', senderNormalized);
  //console.log('[DEBUG] Texto:', text);
  //console.log('[DEBUG] Pendentes:', totalPendentes);

  try {
    if (isCapUser) {



      if (now >= isCapUser.expiresAt) {

        console.log('[CAPTCHA] EXPIRADO');

        try {
          await nazu.sendMessage(isCapUser.groupId, {
            text: `⏰ @${senderNormalized} demorou demais e foi removido.`,
            mentions: [isCapUser.idOrigin]
          });

          await nazu.groupParticipantsUpdate(
            isCapUser.groupId,
            [isCapUser.idOrigin],
            'remove'
          );

        } catch (e) {
          console.log('[ERRO EXPIRAÇÃO]:', e.message);
        }

        CaptchaIndex.remove(senderNormalized);
        return;
      }

      const respInt = parseInt(text?.trim());
      const answerInt = parseInt(isCapUser.answer);

      console.log('[DEBUG] RESP:', respInt, '| CORRETO:', answerInt);

      if (respInt === answerInt) {

        CaptchaIndex.remove(senderNormalized);

        try {
          const groupMetadata = await nazu.groupMetadata(isCapUser.groupId);
          const groupSettings = await loadGroupSettings(isCapUser.groupId);

          if (groupSettings.bemvindo) {
            const message = await createGroupMessage(
              nazu,
              groupMetadata,
              [isCapUser.idOrigin],
              groupSettings.welcome || { text: groupSettings.textbv }
            );
            await nazu.sendMessage(isCapUser.groupId, message);
          } else {
            await nazu.sendMessage(isCapUser.groupId, {
              text: `✅ @${senderNormalized} liberado com sucesso!`,
              mentions: [isCapUser.idOrigin]
            });
          }
        } catch (e) {
          console.log('[ERRO WELCOME PÓS-CAPTCHA]:', e.message);
          await nazu.sendMessage(isCapUser.groupId, {
            text: `✅ @${senderNormalized} liberado com sucesso!`,
            mentions: [isCapUser.idOrigin]
          });
        }

      }

    } else {
      //   console.log(`[DEBUG] ${senderNormalized} NÃO tem captcha pendente`);
    }

  } catch (error) {
    console.error('[ERRO CRÍTICO]:', error);
  }
}


// ==================== PROTEÇÃO ANTI-BAN: Rate Limit para Menções em Massa ====================
// Sistema controlado pelo dono: pode ativar/desativar proteção por grupo
const MASS_MENTION_THRESHOLD = 150; // Membros mínimos para aplicar proteção (quando ativa)
const MASS_MENTION_MAX_USES = 2;    // Máximo de usos permitidos
const MASS_MENTION_COOLDOWN = 5 * 60 * 60 * 1000; // 5 horas em milissegundos

// Cache em memória para rate limit (persistido em arquivo)
let massMentionLimitCache = null;
let massMentionConfigCache = null;

const loadMassMentionConfig = () => {
  if (massMentionConfigCache) return massMentionConfigCache;
  try {
    if (fs.existsSync(MASS_MENTION_CONFIG_FILE)) {
      massMentionConfigCache = JSON.parse(fs.readFileSync(MASS_MENTION_CONFIG_FILE, 'utf-8'));
    } else {
      massMentionConfigCache = {}; // Vazio = desativado por padrão
    }
  } catch (e) {
    console.error('Erro ao carregar massMentionConfig:', e.message);
    massMentionConfigCache = {};
  }
  return massMentionConfigCache;
};

const saveMassMentionConfig = (data) => {
  massMentionConfigCache = data;
  try {
    ensureDirectoryExists(pathz.dirname(MASS_MENTION_CONFIG_FILE));
    fs.writeFileSync(MASS_MENTION_CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao salvar massMentionConfig:', e.message);
  }
};

const loadMassMentionLimit = () => {
  if (massMentionLimitCache) return massMentionLimitCache;
  try {
    if (fs.existsSync(MASS_MENTION_LIMIT_FILE)) {
      massMentionLimitCache = JSON.parse(fs.readFileSync(MASS_MENTION_LIMIT_FILE, 'utf-8'));
    } else {
      massMentionLimitCache = {};
    }
  } catch (e) {
    console.error('Erro ao carregar massMentionLimit:', e.message);
    massMentionLimitCache = {};
  }
  return massMentionLimitCache;
};

const saveMassMentionLimit = (data) => {
  massMentionLimitCache = data;
  try {
    ensureDirectoryExists(pathz.dirname(MASS_MENTION_LIMIT_FILE));
    fs.writeFileSync(MASS_MENTION_LIMIT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao salvar massMentionLimit:', e.message);
  }
};

/**
 * Verifica se o grupo pode usar comandos de menção em massa
 * @param {string} groupId - ID do grupo
 * @param {number} memberCount - Número de membros do grupo
 * @returns {{ allowed: boolean, remainingUses: number, resetTime: number|null, message: string|null }}
 */
const checkMassMentionLimit = (groupId, memberCount) => {
  // Verifica se a proteção está ativada para este grupo
  const config = loadMassMentionConfig();
  if (!config[groupId] || !config[groupId].enabled) {
    return { allowed: true, remainingUses: -1, resetTime: null, message: null };
  }

  // Se grupo tem menos de 150 membros, não aplica limite mesmo se ativo
  if (memberCount < MASS_MENTION_THRESHOLD) {
    return { allowed: true, remainingUses: -1, resetTime: null, message: null };
  }

  const data = loadMassMentionLimit();
  const now = Date.now();

  // Inicializa dados do grupo se não existir
  if (!data[groupId]) {
    data[groupId] = { uses: [], lastReset: now };
  }

  const groupData = data[groupId];

  // Remove usos antigos (mais de 5 horas)
  groupData.uses = groupData.uses.filter(timestamp => (now - timestamp) < MASS_MENTION_COOLDOWN);

  // Verifica se atingiu o limite
  if (groupData.uses.length >= MASS_MENTION_MAX_USES) {
    const oldestUse = Math.min(...groupData.uses);
    const resetTime = oldestUse + MASS_MENTION_COOLDOWN;
    const timeLeft = resetTime - now;
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return {
      allowed: false,
      remainingUses: 0,
      resetTime: resetTime,
      message: `⚠️ *Proteção Anti-Ban Ativada pelo Dono*\n\n` +
        `Este grupo tem ${memberCount} membros. Para evitar banimento do número do bot pela Meta, ` +
        `o dono ativou uma proteção que limita comandos de marcação em massa a *${MASS_MENTION_MAX_USES} usos a cada 5 horas*.\n\n` +
        `⏰ Próximo uso disponível em: *${hours}h ${minutes}min*`
    };
  }

  saveMassMentionLimit(data);

  return {
    allowed: true,
    remainingUses: MASS_MENTION_MAX_USES - groupData.uses.length,
    resetTime: null,
    message: null
  };
};

/**
 * Registra um uso de menção em massa
 * @param {string} groupId - ID do grupo
 */
const registerMassMentionUse = (groupId) => {
  const data = loadMassMentionLimit();
  const now = Date.now();

  if (!data[groupId]) {
    data[groupId] = { uses: [], lastReset: now };
  }

  // Remove usos antigos antes de adicionar novo
  data[groupId].uses = data[groupId].uses.filter(timestamp => (now - timestamp) < MASS_MENTION_COOLDOWN);
  data[groupId].uses.push(now);

  saveMassMentionLimit(data);
};

// ==================== FIM: Proteção Anti-Ban ====================

let performanceOptimizerInstance = null;
let performanceOptimizerInitPromise = null;

async function initializePerformanceOptimizer() {
  if (performanceOptimizerInstance) {
    return performanceOptimizerInstance;
  }

  if (!performanceOptimizerInitPromise) {
    performanceOptimizerInitPromise = (async () => {
      try {
        const instance = new PerformanceOptimizer();
        await instance.initialize();
        performanceOptimizerInstance = instance;
        return instance;
      } catch (error) {
        console.error('Falha ao inicializar PerformanceOptimizer:', error.message || error);
        performanceOptimizerInstance = null;
        return null;
      }
    })();
  }

  const instance = await performanceOptimizerInitPromise;
  if (!instance) {
    performanceOptimizerInitPromise = null;
  }
  return instance;
}

initializePerformanceOptimizer().catch(err => {
  console.error('Erro inesperado ao iniciar PerformanceOptimizer:', err.message || err);
});

let databaseSelfTestResult = null;
const ensureDatabaseIntegrity = ({ log = false, force = false } = {}) => {
  if (force || log || !databaseSelfTestResult) {
    databaseSelfTestResult = runDatabaseSelfTest({ log });
  }

  if (log && databaseSelfTestResult && !databaseSelfTestResult.ok) {
    const summary = databaseSelfTestResult.results
      .filter(result => !result.ok)
      .map(result => `${result.name}: ${result.issues.join('; ')}`)
      .join(' | ');

    if (summary) {
      console.warn(`⚠️ Inconsistências em arquivos de banco de dados: ${summary}`);
    }
  }

  return databaseSelfTestResult;
};

ensureDatabaseIntegrity();

const buildGroupFilePath = (groupId) => pathz.join(GRUPOS_DIR, `${groupId}.json`);


let packageJson = {};
try {
  packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
} catch (e) {
  console.error('Erro ao ler package.json:', e.message);
}
const botVersion = packageJson.version;

// Inicializa o cache JID→LID
initJidLidCache(JID_LID_CACHE_FILE);

// Salva cache periodicamente (a cada 5 minutos)
setInterval(() => {
  saveJidLidCache();
}, 5 * 60 * 1000);

async function NazuninhaBotExec(nazu, info, store, messagesCache, rentalExpirationManager = null) {
  // Log de início de processamento para debug paralelo
  const msgId = info?.key?.id?.slice(-6) || 'unknown';
  const from = info?.key?.remoteJid || 'unknown';

  let config = loadJsonFile(CONFIG_FILE, {});
  ensureDatabaseIntegrity({ log: Boolean(config?.debug) });

  // Verificação e correção do prefixo reservado $ ao inicializar
  if (config.prefixo === '$') {
    config.prefixo = '/';
    writeJsonFile(CONFIG_FILE, config);

    // Notifica o dono sobre a mudança automática
    const ownerJid = `${config.numerodono}@s.whatsapp.net`;
    try {
      await nazu.sendMessage(ownerJid, {
        text: `⚠️ *PREFIXO AUTOMÁTICO CORRIGIDO*\n\n❌ O símbolo "$" é reservado e não pode ser usado como prefixo.\n\n✅ O prefixo foi alterado automaticamente para "/" ao iniciar o bot.\n\n💡 Use ${config.prefixo}prefix para alterar para outro símbolo válido.`
      });
    } catch (notifyError) {
      console.log('Aviso: Não foi possível notificar o dono sobre a mudança de prefixo:', notifyError.message);
    }
  }

  // Log de debug aprimorado para rastreamento de IDs
  const debugLog = (msg, data = null) => {
    if (config?.debug) {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  };

  const normalizeMessageTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') {
      const parsed = Number(timestamp);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof timestamp === 'object') {
      if (typeof timestamp.toNumber === 'function') return timestamp.toNumber();
      if (typeof timestamp.low === 'number') return timestamp.low;
    }
    return null;
  };

  const getLastMessageInChat = (jid) => {
    if (!messagesCache || messagesCache.size === 0) return null;

    let lastMsg = null;
    let lastTimestamp = 0;

    for (const cachedMsg of messagesCache.values()) {
      if (!cachedMsg?.key?.remoteJid || cachedMsg.key.remoteJid !== jid) continue;
      const ts = normalizeMessageTimestamp(cachedMsg.messageTimestamp);
      if (!ts) continue;

      if (!lastMsg || ts > lastTimestamp) {
        lastMsg = cachedMsg;
        lastTimestamp = ts;
      }
    }

    if (!lastMsg?.key || !lastTimestamp) return null;
    return {
      key: lastMsg.key,
      messageTimestamp: lastTimestamp
    };
  };

  const deleteChatByLastMessage = async (jid) => {
    if (!nazu?.chatModify) return false;

    const lastMsgInChat = getLastMessageInChat(jid);
    if (lastMsgInChat?.key && lastMsgInChat?.messageTimestamp) {
      await nazu.chatModify({
        delete: true,
        lastMessages: [
          {
            key: lastMsgInChat.key,
            messageTimestamp: lastMsgInChat.messageTimestamp
          }
        ]
      }, jid);
      return true;
    }

    await nazu.chatModify({ delete: true }, jid);
    return true;
  };

  const clearChatHistorySafe = async (jid) => {
    if (!nazu?.chatModify) return false;
    try {
      await nazu.chatModify({ clear: 'all' }, jid);
      return true;
    } catch (e) {
      if (typeof e?.message === 'string' && e.message.toLowerCase().includes('not supported')) {
        await deleteChatByLastMessage(jid);
        return true;
      }
      throw e;
    }
  };

  async function getCachedGroupMetadata(groupId) {
    try {
      const optimizer = await initializePerformanceOptimizer();
      if (optimizer?.modules?.cacheManager) {
        const cached = await optimizer.modules.cacheManager.getIndexGroupMeta(groupId);
        if (cached) {
          return cached;
        }

        const freshData = await nazu.groupMetadata(groupId).catch(() => ({}));
        await optimizer.modules.cacheManager.setIndexGroupMeta(groupId, freshData);
        return freshData;
      }

      return await nazu.groupMetadata(groupId).catch(() => ({}));
    } catch (error) {
      return await nazu.groupMetadata(groupId).catch(() => ({}));
    }
  }

  const numerodono = config.numerodono;
  const nomedono = config.nomedono;
  const nomebot = config.nomebot;
  const prefixo = config.prefixo;
  const debug = config.debug;
  const lidowner = config.lidowner;

  // Sistema de degradação automática de pets
  function applyPetDegradation(pets) {
    if (!Array.isArray(pets) || pets.length === 0) return { changed: false };

    const now = Date.now();
    const oneHour = 3600000; // 1 hora em ms
    const oneDayInHours = 24; // Degradação total em 24 horas se não cuidar

    let changed = false;

    pets.forEach(pet => {
      // Inicializa lastUpdate se não existir
      if (!pet.lastUpdate) {
        pet.lastUpdate = now;
        changed = true;
        return;
      }

      const timePassed = now - pet.lastUpdate;
      const hoursPassed = timePassed / oneHour;

      // Só degrada se passou mais de 1 hora
      if (hoursPassed >= 1) {
        // Calcula degradação proporcional ao tempo
        const hungerDegrade = Math.floor(hoursPassed * (100 / oneDayInHours)); // ~4.17 por hora
        const moodDegrade = Math.floor(hoursPassed * (100 / (oneDayInHours * 2))); // ~2.08 por hora (degrada mais devagar)

        // Aplica degradação
        const oldHunger = pet.hunger || 100;
        const oldMood = pet.mood || 100;

        pet.hunger = Math.max(0, oldHunger - hungerDegrade);
        pet.mood = Math.max(0, oldMood - moodDegrade);

        // Se fome está muito baixa, humor degrada mais rápido
        if (pet.hunger < 30) {
          pet.mood = Math.max(0, pet.mood - Math.floor(hoursPassed * 5));
        }

        // Se fome chegou a 0, pet perde HP gradualmente
        if (pet.hunger === 0 && hoursPassed >= 2) {
          const hpLoss = Math.floor(hoursPassed * (pet.maxHp * 0.02)); // 2% do HP máximo por hora
          pet.hp = Math.max(1, (pet.hp || pet.maxHp) - hpLoss); // Nunca deixa morrer (mínimo 1 HP)
        }

        // Atualiza timestamp
        pet.lastUpdate = now;
        changed = true;
      }
    });

    return { changed };
  }

  // ═══════════════════════════════════════════════════════════════════
  // FUNÇÕES AUXILIARES DO SISTEMA RPG
  // ═══════════════════════════════════════════════════════════════════

  // Multiplicadores de picareta por tier
  const PICKAXE_TIER_MULT = {
    'bronze': 1.0,
    'ferro': 1.5,
    'diamante': 2.5
  };

  // Formata valores monetários
  function fmt(num) {
    if (!isFinite(num) || num == null) return '0';
    const n = Math.floor(num);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Função para remover acentos das palavras
  function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Calcula tempo restante de cooldown
  function timeLeft(timestamp) {
    const diff = Math.max(0, timestamp - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins > 0) return `${mins}min ${secs}s`;
    return `${secs}s`;
  }

  // Parse de quantidade (suporta "all", "max", "tudo", etc)
  function parseAmount(str, max) {
    if (!str) return 0;
    const s = str.toString().toLowerCase().trim();
    if (['all', 'tudo', 'max', 'todo', 'todos'].includes(s)) {
      return Math.floor(max);
    }
    const num = parseFloat(s.replace(/[^\d.-]/g, ''));
    return isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
  }

  // Obtém picareta ativa do usuário
  function getActivePickaxe(user) {
    if (!user || !user.tools || !user.tools.pickaxe) return null;
    const pk = user.tools.pickaxe;
    // Verifica se não está quebrada
    if (pk.dur <= 0) return null;
    return pk;
  }

  // Aplica bônus de itens da loja
  function applyShopBonuses(user, econ) {
    let mineBonus = 0;
    let workBonus = 0;
    let bankCapacity = 10000; // Capacidade padrão
    let fishBonus = 0;
    let exploreBonus = 0;
    let huntBonus = 0;
    let forgeBonus = 0;

    // Verifica itens no inventário
    for (const [itemKey, qty] of Object.entries(user.inventory || {})) {
      if (qty <= 0) continue;
      const item = econ.shop?.[itemKey];
      if (!item || !item.effect) continue;

      // Aplica efeitos dos itens (multiplicando pela quantidade)
      if (item.effect.mineBonus) mineBonus += item.effect.mineBonus * qty;
      if (item.effect.workBonus) workBonus += item.effect.workBonus * qty;
      if (item.effect.bankCapacity) bankCapacity += item.effect.bankCapacity * qty;
      if (item.effect.fishBonus) fishBonus += item.effect.fishBonus * qty;
      if (item.effect.exploreBonus) exploreBonus += item.effect.exploreBonus * qty;
      if (item.effect.huntBonus) huntBonus += item.effect.huntBonus * qty;
      if (item.effect.forgeBonus) forgeBonus += item.effect.forgeBonus * qty;
    }

    // Verifica ferramenta equipada (picareta)
    if (user.tools?.pickaxe) {
      const pk = user.tools.pickaxe;
      const pkItem = econ.shop?.[pk.key];
      if (pkItem?.effect) {
        if (pkItem.effect.mineBonus) mineBonus += pkItem.effect.mineBonus;
      }
    }

    return {
      mineBonus,
      workBonus,
      bankCapacity,
      fishBonus,
      exploreBonus,
      huntBonus,
      forgeBonus
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // FIM DAS FUNÇÕES AUXILIARES DO RPG
  // ═══════════════════════════════════════════════════════════════════


  async function handleAutoDownload(nazu, from, url, info) {
    try {

      // Detectar tipo de URL e usar o módulo específico
      const urlLower = url.toLowerCase();
      let downloadModule = null;
      let platformName = '';

      // YouTube
      if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        downloadModule = youtube;
        platformName = 'YouTube';
      }
      // TikTok
      else if (urlLower.includes('tiktok.com') || urlLower.includes('vt.tiktok.com')) {
        downloadModule = tiktok;
        platformName = 'TikTok';
      }
      // Instagram
      else if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
        downloadModule = igdl;
        platformName = 'Instagram';
      }
      // Kwai
      else if (urlLower.includes('kwai.com') || urlLower.includes('kwa.am')) {
        downloadModule = kwai;
        platformName = 'kwai';
      }
      // Facebook
      else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
        downloadModule = facebook;
        platformName = 'Facebook';
      }
      // Pinterest
      else if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) {
        downloadModule = pinterest;
        platformName = 'Pinterest';
      }
      // Spotify
      else if (urlLower.includes('spotify.com') || urlLower.includes('open.spotify.com')) {
        downloadModule = spotify;
        platformName = 'Spotify';
      }
      // SoundCloud
      else if (urlLower.includes('soundcloud.com')) {
        downloadModule = soundcloud;
        platformName = 'SoundCloud';
      }
      else {
        // URL não suportada
        return false;
      }

      // Processar download baseado na plataforma
      let result = null;

      // YouTube - baixar apenas áudio (MP3)
      if (platformName === 'YouTube') {
        result = await youtube.mp3(url, 128);
        if (result && result.ok) {
          await nazu.sendMessage(from, {
            audio: result.buffer,
            mimetype: 'audio/mpeg',
            fileName: result.filename || 'audio.mp3'
          }, { quoted: info });
          return true;
        }
      }

      // TikTok
      // TikTok
      else if (platformName === 'TikTok') {

        // Aviso antes de qualquer verificação/download
        await nazu.sendMessage(from, { text: 'Aguarde um momentinho... ☀️' }, { quoted: info });

        const result = await tiktok.dl(url);

        if (!result?.ok) {
          // Mostra só a mensagem de erro da API
          await nazu.sendMessage(from, { text: result.msg || 'Erro desconhecido' }, { quoted: info });
          return false;
        }

        if (result.urls?.length > 0) {
          const videoUrl = result.urls[0];

          await nazu.sendMessage(from, {
            video: { url: videoUrl },
            caption: `📱 *TikTok*\n\n${result.title || ''}`,
            mimetype: 'video/mp4'
          }, { quoted: info });

          return true;
        }

        await nazu.sendMessage(from, { text: '❌ Nenhum vídeo disponível para este TikTok.' }, { quoted: info });
        return false;
      }

      // Instagram
      else if (platformName === 'Instagram') {

        // Aviso antes de qualquer verificação/download
        await nazu.sendMessage(from, { text: 'Aguarde um momentinho... ☀️' }, { quoted: info });

        const result = await igdl.dl(url);

        if (!result?.ok || !result.data || result.data.length === 0) {
          await nazu.sendMessage(from, { text: result?.msg || 'Nenhum conteúdo encontrado no Instagram.' }, { quoted: info });
          return false;
        }

        const media = result.data[0];

        if (media.type === 'video') {
          await nazu.sendMessage(from, {
            video: { url: media.url },
            caption: '📸 *Instagram*',
            mimetype: 'video/mp4'
          }, { quoted: info });
        } else {
          await nazu.sendMessage(from, {
            image: { url: media.url },
            caption: '📸 *Instagram*'
          }, { quoted: info });
        }

        return true;
      }
      // Kwai
      else if (platformName === 'Kwai') {
        result = await kwai.dl(url);
        if (result && result.ok && result.data && result.data.length > 0) {
          const media = result.data[0];
          if (media.type === 'video') {
            await nazu.sendMessage(from, {
              video: media.buff,
              caption: '📸 *Kwai*',
              mimetype: 'video/mp4'
            }, { quoted: info });
          } else {
            await nazu.sendMessage(from, {
              image: media.buff,
              caption: '📸 *Kwai*'
            }, { quoted: info });
          }
          return true;
        }
      }

      // Facebook
      else if (platformName === 'Facebook') {
        result = await facebook.downloadHD(url);
        if (result && result.ok && result.buffer) {
          await nazu.sendMessage(from, {
            video: result.buffer,
            caption: `📘 *Facebook* - ${result.resolution || 'HD'}`,
            mimetype: 'video/mp4'
          }, { quoted: info });
          return true;
        }
      }

      // Pinterest
      else if (platformName === 'Pinterest') {
        result = await pinterest.dl(url);
        if (result && result.ok && result.urls && result.urls.length > 0) {
          const mediaUrl = result.urls[0];
          if (result.type === 'video') {
            await nazu.sendMessage(from, {
              video: { url: mediaUrl },
              caption: '📌 *Pinterest*',
              mimetype: 'video/mp4'
            }, { quoted: info });
          } else {
            await nazu.sendMessage(from, {
              image: { url: mediaUrl },
              caption: '📌 *Pinterest*'
            }, { quoted: info });
          }
          return true;
        }
      }

      // Spotify - baixar áudio
      else if (platformName === 'Spotify') {
        result = await spotify.download(url);
        if (result && result.ok && result.buffer) {
          await nazu.sendMessage(from, {
            audio: result.buffer,
            mimetype: 'audio/mpeg',
            fileName: result.filename || `${result.title || 'audio'}.mp3`
          }, { quoted: info });
          return true;
        }
      }

      // SoundCloud - baixar áudio
      else if (platformName === 'SoundCloud') {
        result = await soundcloud.download(url);
        if (result && result.ok && result.buffer) {
          await nazu.sendMessage(from, {
            audio: result.buffer,
            mimetype: 'audio/mpeg',
            fileName: result.filename || `${result.title || 'audio'}.mp3`
          }, { quoted: info });
          return true;
        }
      }

      else {
        // Mapeamento de métodos para cada plataforma
        const methodMap = {
          'Instagram': 'dl',
          'Facebook': 'downloadHD',
          'TikTok': 'dl',
          'Pinterest': 'dl'
        };

        const methodName = methodMap[platformName] || 'download';

        if (downloadModule && typeof downloadModule[methodName] === 'function') {
          result = await downloadModule[methodName](url);
          if (result && result.data) {
            const videoUrl = result.data.video || result.data.videoUrl || result.data.url;
            if (videoUrl) {
              await nazu.sendMessage(from, {
                video: { url: videoUrl },
                caption: `🎬 *${platformName}*`,
                mimetype: 'video/mp4'
              }, { quoted: info });
              return true;
            }
          }
        }
      }

      return false;

    } catch (e) {
      console.error('Erro no autodl:', e);
      return false;
    }
  }
  const { default: menus } = await import('./menus/index.js');
  const {
    menu,
    menudown,
    menuadm,
    menubn,
    menuDono,
    menuMembros,
    menuFerramentas,
    menuSticker,
    menuIa,
    menuAlterador,
    menuLogos,
    menuedits,
    menuTopCmd,
    menuRPG,
    menuVIP,
    menuBuscas,
    menuBrawlStars
  } = menus;
  const prefix = prefixo;
  const numerodonoStr = String(numerodono);

  // Otimização: Cache de dados estáticos com TTL
  const optimizer = getPerformanceOptimizer();

  const antipvData = await optimizer.getCachedFile(
    DATABASE_DIR + '/antipv.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path)
  );
  const premiumListaZinha = await optimizer.getCachedFile(
    DONO_DIR + '/premium.json',
    60000, // 1 minuto
    (path) => loadJsonFile(path)
  );
  const banGpIds = await optimizer.getCachedFile(
    DONO_DIR + '/bangp.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path)
  );
  const antifloodData = await optimizer.getCachedFile(
    DATABASE_DIR + '/antiflood.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path)
  );

  const antiSpamGlobal = await optimizer.getCachedFile(
    DATABASE_DIR + '/antispam.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path, {
      enabled: false,
      limit: 5,
      interval: 10,
      blockTime: 600,
      users: {},
      blocks: {}
    })
  );
  const globalBlocks = await optimizer.getCachedFile(
    DATABASE_DIR + '/globalBlocks.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path, {
      commands: {},
      users: {}
    })
  );
  const botState = await optimizer.getCachedFile(
    DATABASE_DIR + '/botState.json',
    30000, // 30 segundos
    (path) => loadJsonFile(path, {
      status: 'on'
    })
  );
  const modoLiteFile = DATABASE_DIR + '/modolite.json';
  let modoLiteGlobal = await optimizer.getCachedFile(
    modoLiteFile,
    30000, // 30 segundos
    (path) => loadJsonFile(path, {
      status: false
    })
  );
  if (!fs.existsSync(modoLiteFile)) {
    writeJsonFile(modoLiteFile, modoLiteGlobal);
  };

  if (typeof global.autoStickerMode === 'undefined') {
    global.autoStickerMode = 'default';
  }
  try {
    var r;
    

const from = info.key.remoteJid;
    const isGroup = from?.endsWith('@g.us') || false;
    if (!info.key.participant && !info.key.remoteJid) return;
    let sender;
    if (isGroup) {
      // Prioriza participant, depois busca por LID, com fallback para JID
      sender = info.key.participant || info.message?.participant;

      if (!sender) {
        const participants = Object.keys(info.key).filter(k => k.startsWith("participant")).map(k => info.key[k]).filter(Boolean);
        if (participants.length) {
          sender = participants.find(p => p.includes("@lid")) || participants.find(p => p.includes("@s.whatsapp.net")) || participants[0];
        }
      }

      // Se ainda não encontrou, tenta extrair do contextInfo
      if (!sender && info.message?.extendedTextMessage?.contextInfo?.participant) {
        sender = info.message.extendedTextMessage.contextInfo.participant;
      }

      // Se for JID, converte para LID usando cache
      if (sender && isValidJid(sender)) {
        sender = await getLidFromJidCached(nazu, sender);
      }
    } else {
      sender = info.key.remoteJid;

      // Se for JID no PV, converte para LID usando cache
      if (sender && isValidJid(sender)) {
        sender = await getLidFromJidCached(nazu, sender);
      }
    }

    // Debug: log do sender identificado
    debugLog('Sender identificado:', { sender, isGroup, from: from?.substring(0, 20) });

    // Se sender ainda for undefined, ignora a mensagem (ex: mensagens de sistema, stubs, etc)
    if (!sender) {
      debugLog('Sender não identificado, ignorando mensagem');
      return;
    }

    const pushname = info.pushName || '';
    const isStatus = from?.endsWith('@broadcast') || false;
    const nmrdn = buildUserId(numerodono, config);
    const subDonoList = loadSubdonos();
    const isSubOwner = isSubdono(sender);
    const ownerJid = `${numerodono}@s.whatsapp.net`;
    const botId = getBotId(nazu);
    const isBotSender = sender === botId || sender === nazu.user?.id?.split(':')[0] + '@s.whatsapp.net' || sender === nazu.user?.id?.split(':')[0] + '@lid';

    const senderBase = sender.split('@')[0];
    const ownerBase = String(numerodono);
    const lidOwnerBase = lidowner ? lidowner.split('@')[0] : null;

    const isOwner = senderBase === ownerBase ||
      sender === nmrdn ||
      sender === ownerJid ||
      (lidowner && sender === lidowner) ||
      (lidOwnerBase && senderBase === lidOwnerBase) ||
      info.key.fromMe ||
      isBotSender;

    const isOwnerOrSub = isOwner || isSubOwner;

    // Debug: log das verificações de permissão
    debugLog('Verificações de permissão:', {
      sender: sender?.substring(0, 30),
      senderBase,
      ownerBase,
      isOwner,
      isSubOwner
    });

    const type = getContentType(info.message);

    // ==================== CONFIG ====================
    const activeIntervals = new Map();

    // ==================== START ====================
    function startAutoAcceptSystem(nazu, from) {
      if (activeIntervals.has(from)) return;

      const interval = setInterval(async () => {
        try {
          const groupFile = buildGroupFilePath(from);
          const groupData = await readJsonFileAsync(groupFile, {});

          // Verifica se a função de auto-aceitar está ligada nas configurações do grupo
          if (!groupData.autoAcceptRequests) return;

          let requests = [];

          try {
            if (nazu.groupRequestParticipantsList) {
              requests = await nazu.groupRequestParticipantsList(from);
            } else if (nazu.groupGetRequestParticipants) {
              requests = await nazu.groupGetRequestParticipants(from);
            }
          } catch (err) {
            console.error('[SYSTEM] ERRO AO BUSCAR REQUESTS:', err);
            return;
          }

          if (!requests || requests.length === 0) return;

          for (const req of requests) {
            const jid = req.jid;
            if (!jid) continue;

            // Aprovação Direta (Sem Captcha)
            try {
              await nazu.groupRequestParticipantsUpdate(from, [jid], 'approve');
            } catch (err) {
              console.error('[SYSTEM] ERRO AO APROVAR USUÁRIO:', jid, err);
            }
          }

        } catch (err) {
          console.error('[SYSTEM] ERRO GERAL NO LOOP:', err);
        }
      }, 5000);

      activeIntervals.set(from, interval);
    }




    const isMedia = ["imageMessage", "videoMessage", "audioMessage"].includes(type);
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isVisuU2 = type === 'viewOnceMessageV2';
    const isVisuU = type === 'viewOnceMessage';
    const ROLE_GOING_BASE = '🙋';
    const ROLE_NOT_GOING_BASE = '🤷';
    const isGoingEmoji = (emoji) => typeof emoji === 'string' && emoji.includes(ROLE_GOING_BASE);
    const isNotGoingEmoji = (emoji) => typeof emoji === 'string' && emoji.includes(ROLE_NOT_GOING_BASE);
    const isButtonMessage = info.message.interactiveMessage || info.message.templateButtonReplyMessage || info.message.buttonsMessage || info.message.interactiveResponseMessage || info.message.listResponseMessage || info.message.buttonsResponseMessage ? true : false;
    const isStatusMention = JSON.stringify(info.message).includes('groupStatusMentionMessage');
    const getMessageText = message => {
      if (!message) return '';

      if (message.interactiveResponseMessage) {
        const interactiveResponse = message.interactiveResponseMessage;

        if (interactiveResponse.nativeFlowResponseMessage?.paramsJson) {
          try {
            const params = JSON.parse(interactiveResponse.nativeFlowResponseMessage.paramsJson);
            return params.id || '';
          } catch (error) {
            console.error('Erro ao processar resposta de single_select:', error);
          }
        }

        if (interactiveResponse.body?.text) {
          return interactiveResponse.body.text;
        }

        if (interactiveResponse.selectedDisplayText) {
          return interactiveResponse.selectedDisplayText;
        }

        if (typeof interactiveResponse === 'string') {
          return interactiveResponse;
        }
      }

      if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
        return message.listResponseMessage.singleSelectReply.selectedRowId;
      }

      if (message.buttonsResponseMessage?.selectedButtonId) {
        return message.buttonsResponseMessage.selectedButtonId;
      }

      return message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || message.videoMessage?.caption || message.documentWithCaptionMessage?.message?.documentMessage?.caption || message.viewOnceMessage?.message?.imageMessage?.caption || message.viewOnceMessage?.message?.videoMessage?.caption || message.viewOnceMessageV2?.message?.imageMessage?.caption || message.viewOnceMessageV2?.message?.videoMessage?.caption || message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || message.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || '';
    };
    const body = getMessageText(info.message) || info?.text || '';

    // ==================== INTERAÇÃO DA VERDINHA ====================
    if (!info.key?.fromMe && isGroup && body.trim()) {
      try {
        const groupFilePathVerdinha = pathz.join(GRUPOS_DIR, `${from}.json`);
        const configVerdinha = fs.existsSync(groupFilePathVerdinha)
          ? JSON.parse(fs.readFileSync(groupFilePathVerdinha, 'utf-8'))
          : {};

        const interacaoAtiva = configVerdinha.interacaoVerdinha === true;

        if (interacaoAtiva) {
          const texto = normalizar(body);

          // Histórico temporário separado por grupo
          if (!Array.isArray(configVerdinha.memoriaVerdinha)) {
            configVerdinha.memoriaVerdinha = [];
          }

          const contextInfo =
            info.message?.extendedTextMessage?.contextInfo ||
            info.message?.imageMessage?.contextInfo ||
            info.message?.videoMessage?.contextInfo ||
            info.message?.documentMessage?.contextInfo ||
            info.message?.viewOnceMessage?.message?.imageMessage?.contextInfo ||
            info.message?.viewOnceMessage?.message?.videoMessage?.contextInfo ||
            info.message?.viewOnceMessageV2?.message?.imageMessage?.contextInfo ||
            info.message?.viewOnceMessageV2?.message?.videoMessage?.contextInfo;

          const quotedParticipant = contextInfo?.participant;
          const quotedStanzaId = contextInfo?.stanzaId;

          const botJid = nazu.user?.id?.split(':')[0];
          const botLid = nazu.user?.lid?.split(':')[0];

          const respondeuVerdinha =
            !!quotedStanzaId &&
            !!quotedParticipant &&
            (
              quotedParticipant === botId ||
              quotedParticipant === `${botJid}@s.whatsapp.net` ||
              quotedParticipant === `${botLid}@lid`
            );

          // Só responde quando for chamada pelo nome ou quando responderem a ela
          const chamouVerdinha = texto.includes('verdinha');

          // Nome exibido de quem enviou a mensagem
          const nomePessoa =
            info.pushName ||
            info.verifiedBizName ||
            'Pessoa do grupo';

          // Guarda a mensagem atual no histórico do grupo
          configVerdinha.memoriaVerdinha.push({
            autor: nomePessoa,
            mensagem: body.trim(),
            horario: Date.now()
          });

          // Mantém somente as últimas 15 mensagens
          configVerdinha.memoriaVerdinha =
            configVerdinha.memoriaVerdinha.slice(-15);

          writeJsonFile(groupFilePathVerdinha, configVerdinha);

          if (chamouVerdinha || respondeuVerdinha) {
            const historico = configVerdinha.memoriaVerdinha
              .map((item) => `${item.autor}: ${item.mensagem}`)
              .join('\n');

            const promptVerdinha = `Você é a Verdinha, uma bot brasileira de WhatsApp.

IDENTIDADE FIXA:
- Seu nome é Verdinha.
- Sua dona oficial é Alice.
- Se perguntarem quem é sua dona, responda que é a Alice.
- Nunca altere ou invente outra dona.

PERSONALIDADE:
- leve, fofa e carinhosa 💚
- espontânea e natural
- levemente irônica, mas nunca cruel, humilhante ou debochada
- conversa como uma amiga de grupo
- pode usar emojis, sem exagerar
- não seja formal
- não escreva respostas enormes
- normalmente responda em 1 a 3 frases
- não fique repetindo que é uma IA
- não invente informações pessoais
- use o histórico para entender o contexto da conversa
- não trate mensagens antigas como se fossem novas
- se não entender algo, peça esclarecimento de forma natural

HISTÓRICO RECENTE DESTE GRUPO:
${historico}

MENSAGEM QUE PRECISA SER RESPONDIDA:
${body}`;

            await nazu.sendPresenceUpdate('composing', from);

            const respostaGemini = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: promptVerdinha
            });

            const resposta = respostaGemini.text?.trim();

            await nazu.sendPresenceUpdate('paused', from);

            if (resposta) {
              await nazu.sendMessage(
                from,
                { text: resposta },
                { quoted: info }
              );

              // Guarda também a resposta da Verdinha no histórico
              configVerdinha.memoriaVerdinha.push({
                autor: 'Verdinha',
                mensagem: resposta,
                horario: Date.now()
              });

              configVerdinha.memoriaVerdinha =
                configVerdinha.memoriaVerdinha.slice(-15);

              writeJsonFile(groupFilePathVerdinha, configVerdinha);
            }
          }
        }
      } catch (erroGemini) {
        await nazu.sendPresenceUpdate('paused', from).catch(() => {});
        console.error('[GEMINI VERDINHA]', erroGemini);
      }
    }
    // ==================== INICIAR ====================
    startAutoAcceptSystem(nazu, from);

    // ==================== NO HANDLER ====================
    // chamar isso em TODA mensagem




    let args = body.trim().split(/ +/).slice(1);
    let q = args.join(' ');
    const budy2 = normalizar(body);
    const menc_prt = info.message?.extendedTextMessage?.contextInfo?.participant;
    const menc_jid2 = info.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const menc_os2 = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt;
    const sender_ou_n = (menc_jid2 && menc_jid2.length > 0) ? menc_jid2[0] : menc_prt || sender;
    const groupFile = buildGroupFilePath(from);
    // Otimização: Carregar groupData com cache (TTL curto de 5 segundos)
    let groupData = {};
    if (isGroup) {
      try {
        groupData = await optimizer.getGroupDataCached(
          from,
          async () => {
            try {
              // Usa leitura assíncrona para não bloquear event loop
              return await readJsonFileAsync(groupFile, {});
            } catch (e) {
              console.error(`Erro ao ler groupFile ${groupFile}:`, e);
              return {};
            }
          },
          5000 // 5 segundos TTL
        );
      } catch (e) {
        console.error('Erro ao carregar groupData com cache:', e);
        try {
          // Fallback assíncrono
          groupData = await readJsonFileAsync(groupFile, {});
        } catch (e2) {
          console.error('Erro ao carregar groupData sem cache:', e2);
          groupData = {};
        }
      }
    }

    // ==== Helpers de Rolê (definidos fora de blocos para uso global dentro da função) ====
    function ensureRoleParticipants(roleData) {
      if (!roleData.participants || typeof roleData.participants !== 'object') {
        roleData.participants = {};
      }
      if (!Array.isArray(roleData.participants.going)) {
        roleData.participants.going = [];
      }
      if (!Array.isArray(roleData.participants.notGoing)) {
        roleData.participants.notGoing = [];
      }
      return roleData.participants;
    }

    const MAX_MENTIONS_IN_ANNOUNCE = 25;

    function buildRoleAnnouncementText(code, roleData, groupPrefix = prefix) {
      const participants = ensureRoleParticipants(roleData);
      const going = participants.going || [];
      const notGoing = participants.notGoing || [];
      const lines = [];
      lines.push('🪩 *Rolê*');
      lines.push(`🎫 Código: *${code}*`);
      if (roleData.title) lines.push(`📛 Título: ${roleData.title}`);
      if (roleData.when) lines.push(`🗓️ Quando: ${roleData.when}`);
      if (roleData.where) lines.push(`📍 Onde: ${roleData.where}`);
      if (roleData.description) lines.push(`📝 Descrição: ${roleData.description}`);
      lines.push('');
      const goingCount = going.length;
      lines.push(`🙋 Confirmados (${goingCount}):`);
      if (goingCount > 0) {
        const goingPreview = going.slice(0, MAX_MENTIONS_IN_ANNOUNCE);
        lines.push(goingPreview.map(id => `• @${getUserName(id)}`).join('\n'));
        if (goingCount > goingPreview.length) lines.push(`… e mais ${goingCount - goingPreview.length}`);
      } else {
        lines.push('• —');
      }
      const notGoingCount = notGoing.length;
      lines.push('');
      lines.push(`🤷 Desistiram (${notGoingCount}):`);
      if (notGoingCount > 0) {
        const notGoingPreview = notGoing.slice(0, MAX_MENTIONS_IN_ANNOUNCE);
        lines.push(notGoingPreview.map(id => `• @${getUserName(id)}`).join('\n'));
        if (notGoingCount > notGoingPreview.length) lines.push(`… e mais ${notGoingCount - notGoingPreview.length}`);
      } else {
        lines.push('• —');
      }
      lines.push('');
      lines.push(`🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou ${code}`);
      lines.push(`🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou ${code}`);
      return lines.join('\n');
    }

    async function refreshRoleAnnouncement(code, roleData) {
      try {
        if (!roleData || !roleData.announcementKey || !roleData.announcementKey.id) return;
        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
              id: roleData.announcementKey.id,
              participant: roleData.announcementKey.participant || undefined
            }
          });
        } catch (e) {
          console.warn('Não consegui remover a divulgação antiga do rolê (reação):', e.message || e);
        }
        const announcementText = buildRoleAnnouncementText(code, roleData, prefix);
        const goingList = roleData.participants?.going || [];
        const notGoingList = roleData.participants?.notGoing || [];
        const mentions = [
          ...goingList.slice(0, MAX_MENTIONS_IN_ANNOUNCE),
          ...notGoingList.slice(0, MAX_MENTIONS_IN_ANNOUNCE)
        ];
        const sentMessage = await nazu.sendMessage(from, { text: announcementText, mentions });
        if (sentMessage?.key?.id) {
          if (!groupData.roleMessages || typeof groupData.roleMessages !== 'object') {
            groupData.roleMessages = {};
          }
          delete groupData.roleMessages[roleData.announcementKey.id];
          groupData.roleMessages[sentMessage.key.id] = code;
          roleData.announcementKey = {
            id: sentMessage.key.id,
            fromMe: sentMessage.key.fromMe ?? true,
            participant: sentMessage.key.participant || null
          };
          if (!groupData.roles || typeof groupData.roles !== 'object') {
            groupData.roles = {};
          }
          groupData.roles[code] = roleData;
          persistGroupData();
        }
      } catch (e) {
        console.error('Erro ao atualizar anúncio do rolê:', e);
      }
    }
    const groupMetadata = !isGroup ? {} : await getCachedGroupMetadata(from).catch(() => ({}));
    const groupName = groupMetadata?.subject || '';
    if (isGroup) {
      // Otimização: Verificar existência com cache
      const fileExists = await optimizer.fileExists(groupFile);
      if (!fileExists) {
        writeJsonFile(groupFile, {
          mark: {},
          createdAt: new Date().toISOString(),
          groupName: groupName
        });
        // Invalida cache de exists após criar arquivo
        optimizer.invalidateJson(groupFile);
      }
      try {
        // Carregamento seguro e assíncrono de dados do grupo
        let rawContent = '';
        try {
          rawContent = await fsPromises.readFile(groupFile, 'utf-8');
        } catch (readError) {
          if (readError.code !== 'ENOENT') {
            console.error(`❌ Erro ao ler arquivo do grupo ${from}:`, readError.message);
          }
          rawContent = '';
        }

        if (!rawContent || rawContent.trim() === '') {
          console.warn(`⚠️ Arquivo de grupo vazio para ${from}, criando novo`);
          groupData = { mark: {}, createdAt: new Date().toISOString() };
        } else {
          // Remove BOM e caracteres inválidos
          rawContent = rawContent.replace(/^\uFEFF/, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

          try {
            groupData = JSON.parse(rawContent);
          } catch (parseError) {
            console.error(`❌ JSON inválido no grupo ${from}, tentando recuperar:`, parseError.message);

            // Tenta remover trailing commas e parsear novamente
            try {
              rawContent = rawContent.replace(/,\s*([\]}])/g, '$1');
              groupData = JSON.parse(rawContent);
              console.log(`✅ Dados do grupo ${from} recuperados após sanitização`);
            } catch (retryError) {
              console.error(`❌ Falha na recuperação do grupo ${from}, usando dados padrão`);
              groupData = { mark: {}, createdAt: new Date().toISOString(), recovered: true };
            }
          }
        }

        // Validação básica
        if (!groupData || typeof groupData !== 'object') {
          groupData = { mark: {} };
        }
      } catch (error) {
        console.error(`❌ Erro crítico ao carregar dados do grupo ${from}:`, error.message);
        groupData = { mark: {}, error: true };
      };
      // default flags
      groupData.modorpg = typeof groupData.modorpg === 'boolean' ? groupData.modorpg : false;
      groupData.minMessage = groupData.minMessage || null;
      groupData.moderators = groupData.moderators || [];
      groupData.allowedModCommands = groupData.allowedModCommands || [];
      groupData.mutedUsers = groupData.mutedUsers || {};
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      groupData.levelingEnabled = groupData.levelingEnabled || false;
      groupData.adminWhitelist = groupData.adminWhitelist || {};
      if (!groupData.roles || typeof groupData.roles !== 'object') {
        groupData.roles = {};
      }
      if (!groupData.roleMessages || typeof groupData.roleMessages !== 'object') {
        groupData.roleMessages = {};
      }

      if (groupName && groupData.groupName !== groupName) {
        groupData.groupName = groupName;
        // Salva de forma assíncrona para não bloquear
        writeJsonFileAsync(groupFile, groupData).then(() => {
          // Otimização: Invalida cache quando groupData é salvo
          if (isGroup) {
            optimizer.invalidateGroup(from);
          }
        }).catch(err => console.error('Erro ao salvar groupData:', err));
      };
    };
    // Otimização: Cache de parcerias
    let parceriasData = {};
    if (isGroup) {
      parceriasData = await optimizer.memoize(
        `parcerias:${from}`,
        () => Promise.resolve(loadParceriasData(from)),
        10000 // 10 segundos
      );
    }
    /**
     * Persiste dados do grupo de forma assíncrona
     * Não bloqueia o event loop durante a escrita
     */
    const persistGroupData = () => {
      if (isGroup) {
        // Usa escrita assíncrona em background
        writeJsonFileAsync(groupFile, groupData).then(() => {
          // Otimização: Invalida cache quando groupData é salvo
          optimizer.invalidateGroup(from);
        }).catch(err => console.error('Erro ao persistir groupData:', err));
      }
    };

    // Função para verificar se um usuário está na whitelist para determinado anti
    const isUserWhitelisted = (userId, antiType) => {
      if (!groupData.adminWhitelist || typeof groupData.adminWhitelist !== 'object') {
        return false;
      }

      const userWhitelist = groupData.adminWhitelist[userId];
      if (!userWhitelist || !Array.isArray(userWhitelist.antis)) {
        return false;
      }

      return userWhitelist.antis.includes(antiType);
    };

    // Helpers para mutar usuários (suporte a LID/JID)
    const isUserInMap = (map, userId) => {
      if (!map || !userId) return false;
      if (map[userId]) return true;
      const keys = Object.keys(map);
      return keys.some(key => idsMatch(key, userId));
    };
    const removeUserFromMap = (map, userId) => {
      if (!map || !userId) return false;
      let removed = false;
      if (map[userId]) {
        delete map[userId];
        removed = true;
      }
      for (const key of Object.keys(map)) {
        if (idsMatch(key, userId)) {
          delete map[key];
          removed = true;
        }
      }
      return removed;
    };
    const groupPrefix = groupData.customPrefix || prefixo;
    var isCmd = body.trim().startsWith(groupPrefix);

    // Reage automaticamente às mensagens que começam com o prefixo
    if (isCmd && !info.key.fromMe) {
      try {
        await nazu.sendMessage(from, {
          react: {
            text: '💚',
            key: info.key
          }
        });
      } catch (err) {
        console.log('[REAÇÃO] Não foi possível reagir:', err.message);
      }
    }

    // Suporte para "! comando" (com espaço após o prefixo)
    const bodyWithoutPrefix = body.trim().slice(groupPrefix.length).trimStart();

    const aliases = loadCommandAliases();
    const matchedAlias = aliases.find(item => normalizar(bodyWithoutPrefix.split(/ +/).shift().trim()) === item.alias);

    // Se encontrou um alias, aplicar parâmetros fixos
    if (matchedAlias && matchedAlias.fixedParams) {
      const userArgs = bodyWithoutPrefix.split(/ +/).slice(1).join(' ');
      const combinedParams = matchedAlias.fixedParams + (userArgs ? ' ' + userArgs : '');
      q = combinedParams;
      args.length = 0;
      args.push(...combinedParams.split(/ +/));
    }

    var command = isCmd ? matchedAlias ? matchedAlias.command : normalizar(bodyWithoutPrefix.split(/ +/).shift().trim()).replace(/\s+/g, '') : null;

    // Recalcular args usando bodyWithoutPrefix para suportar "! comando" (com espaço)
    if (isCmd && !matchedAlias) {
      const newArgs = bodyWithoutPrefix.split(/ +/).slice(1);
      args.length = 0;
      args.push(...newArgs);
      q = newArgs.join(' ');
    }

    const isPremium = premiumListaZinha[sender] || premiumListaZinha[from] || isOwner;

    // Verificação de captcha para solicitações de entrada em grupos (DEVE vir ANTES de antipv)
    // Otimizado: usa índice de captcha em vez de varrer todos os arquivos
    if (!isGroup && !info.key.fromMe) { // Ignora mensagens do próprio bot
      const captchaData = getCaptcha(sender);

      if (captchaData) {
        if (debug) {
          console.log('[DEBUG CAPTCHA] Captcha pendente encontrado via índice:', {
            sender,
            body: body.trim(),
            expectedAnswer: captchaData.answer,
            groupId: captchaData.groupId
          });
        }

        const userAnswer = parseInt(body.trim());

        if (debug) {
          console.log('[DEBUG CAPTCHA] Resposta do usuário:', userAnswer, 'É número?', !isNaN(userAnswer));
        }

        if (isNaN(userAnswer)) {
          await reply('❌ Resposta inválida! Por favor, envie apenas o número da resposta.');
          return;
        }

        const groupPath = pathz.join(GRUPOS_DIR, captchaData.groupFile || `${captchaData.groupId.replace('@g.us', '')}.json`);

        if (userAnswer === captchaData.answer) {
          // Resposta correta - aprovar no grupo
          try {
            if (debug) {
              console.log('[DEBUG CAPTCHA] ✅ Resposta correta! Aprovando no grupo:', captchaData.groupId);
            }
            await nazu.groupRequestParticipantsUpdate(captchaData.groupId, [sender], 'approve');
            await reply('✅ *Correto!* Você foi aprovado no grupo. Bem-vindo! 🎉');

            // Limpar captcha pendente do índice
            removeCaptcha(sender);

            // Também limpa do arquivo do grupo (async para não bloquear)
            readJsonFileAsync(groupPath, {}).then(async groupDataCaptcha => {
              if (groupDataCaptcha.pendingCaptchas?.[sender]) {
                delete groupDataCaptcha.pendingCaptchas[sender];
                await writeJsonFileAsync(groupPath, groupDataCaptcha);
              }

              // Notificação X9
              if (groupDataCaptcha.x9) {
                await nazu.sendMessage(captchaData.groupId, {
                  text: `✅ *X9 Report:* @${sender.split('@')[0]} passou na verificação de captcha e foi aprovado automaticamente.`,
                  mentions: [sender],
                }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
              }
            }).catch(err => console.error('Erro ao limpar captcha do arquivo:', err));

          } catch (err) {
            await reply('❌ Erro ao aprovar sua solicitação. Tente novamente mais tarde.');
            console.error('Erro ao aprovar após captcha:', err);
          }
        } else {
          // Resposta incorreta - recusar
          try {
            if (debug) {
              console.log('[DEBUG CAPTCHA] ❌ Resposta incorreta! Recusando no grupo:', captchaData.groupId);
            }
            await nazu.groupRequestParticipantsUpdate(captchaData.groupId, [sender], 'reject');
            await reply('❌ *Resposta incorreta!* Sua solicitação foi recusada. Você pode tentar solicitar novamente.');

            // Limpar captcha pendente do índice
            removeCaptcha(sender);

            // Também limpa do arquivo do grupo (async)
            readJsonFileAsync(groupPath, {}).then(async groupDataCaptcha => {
              if (groupDataCaptcha.pendingCaptchas?.[sender]) {
                delete groupDataCaptcha.pendingCaptchas[sender];
                await writeJsonFileAsync(groupPath, groupDataCaptcha);
              }
            }).catch(err => console.error('Erro ao limpar captcha do arquivo:', err));

          } catch (err) {
            await reply('❌ Resposta incorreta!');
            console.error('Erro ao recusar após captcha:', err);
          }
        }
        return;
      }
    }





    if (!isGroup) {
      // Exceção para comandos de transmissão que devem funcionar no PV
      const tm2Commands = ['inscrevertm', 'inscrevertm2', 'desinscrever', 'desinscrevertm', 'cancelartm'];
      const supportAdminCommands = ['ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar'];
      const isSupportAdminCommand = supportAdminCommands.some(cmd => command === cmd);
      const isTm2Command = tm2Commands.some(cmd => command === cmd) || isSupportAdminCommand;

      if (antipvData.mode === 'antipv' && !isOwner && !isPremium && !isTm2Command) {
        return;
      };
      if (antipvData.mode === 'antipv2' && isCmd && !isOwner && !isPremium && !isTm2Command) {
        await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
        return;
      };
      if (antipvData.mode === 'antipv3' && isCmd && !isOwner && !isPremium && !isTm2Command) {
        await nazu.updateBlockStatus(sender, 'block');
        await reply('🚫 Você foi bloqueado por usar comandos no privado!');
        return;
      };
      if (antipvData.mode === 'antipv4' && !isOwner && !isPremium && !isTm2Command) {
        await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
        return;
      };
    };
    if (isGroup && banGpIds[from] && !isOwner && !isPremium) {
      return;
    };
    // Enhanced participant ID extraction with both LID and JID support
    const extractParticipantId = (participant) => {
      if (!participant) return null;
      // Retorna LID se disponível, senão retorna o ID padrão
      let id = participant.lid || participant.id || null;

      // Remove :XX se existir (ex: 267955023654984:13@lid -> 267955023654984@lid)
      if (id && id.includes(':')) {
        const suffix = id.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        id = id.split(':')[0] + suffix;
      }

      return id;
    };

    // Helper para normalizar nomes de clã - remove acentos e caracteres não alfanuméricos
    function normalizeClanName(name) {
      if (!name) return '';
      const n = name.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return n.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase();
    }

    // Helper para normalizar comandos - remove acentos mas mantém espaços
    function normalizeCommand(cmd) {
      if (!cmd) return '';
      const n = cmd.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return n.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
    }

    // Extrai IDs dos membros (pode estar em JID)
    const rawMembers = !isGroup ? [] :
      groupMetadata.participants?.map(extractParticipantId).filter(Boolean) || [];

    // Extrai IDs dos admins (pode estar em JID)
    const rawAdmins = !isGroup ? [] :
      groupMetadata.participants?.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(extractParticipantId).filter(Boolean) || [];

    // Converte todos os membros e admins para LID (usando cache)
    const AllgroupMembers = await convertIdsToLid(nazu, rawMembers);
    const groupAdmins = await convertIdsToLid(nazu, rawAdmins);

    // Debug log
    debugLog('Membros e Admins convertidos:', {
      totalMembros: AllgroupMembers.length,
      totalAdmins: groupAdmins.length,
      admins: groupAdmins.map(a => a?.substring(0, 20))
    });

    // Robust bot ID extraction with multiple fallback mechanisms
    const getBotNumber = (nazu) => {
      try {
        // Tenta pegar LID primeiro
        if (nazu.user?.lid) {
          // Remove o sufixo `:XX` se existir (ex: 267955023654984:13@lid -> 267955023654984@lid)
          const lid = nazu.user.lid;
          const cleanLid = lid.includes(':') ? lid.split(':')[0] + '@lid' : lid;
          return cleanLid;
        }

        // Fallback para ID padrão
        if (nazu.user?.id) {
          const botId = nazu.user.id.split(':')[0];
          return `${botId}@s.whatsapp.net`;
        }

        // Usa helper se disponível
        if (typeof getBotId === 'function') {
          return getBotId(nazu);
        }

        console.warn('Unable to determine bot number - user object:', nazu.user);
        return null;
      } catch (error) {
        console.error('Error extracting bot number:', error);
        return null;
      }
    };

    const botNumber = getBotNumber(nazu);

    // Converte o botNumber para LID se for JID
    const botNumberLid = botNumber && isValidJid(botNumber)
      ? await getLidFromJidCached(nazu, botNumber)
      : botNumber;

    const isBotAdmin = !isGroup || !botNumberLid ? false : idInArray(botNumberLid, groupAdmins);

    let isGroupAdmin = false;
    if (isGroup) {
      const isModeratorActionAllowed = groupData.moderators?.includes(sender) && groupData.allowedModCommands?.includes(command);

      // Usa a função idsMatch para comparação robusta
      const isAdminMatch = idInArray(sender, groupAdmins);

      isGroupAdmin = isAdminMatch || isOwner || isModeratorActionAllowed;

      // Debug: log das verificações de admin
      debugLog('Verificação de admin:', {
        sender: sender?.substring(0, 30),
        senderBase: sender?.split('@')[0],
        groupAdminsCount: groupAdmins.length,
        groupAdmins: groupAdmins.map(a => a?.substring(0, 20)),
        isAdminMatch,
        isGroupAdmin,
        isModerator: isModeratorActionAllowed,
        isBotAdmin,
        botNumber: botNumberLid?.substring(0, 30)
      });
    }
    const isModoBn = groupData.modobrincadeira;
    const isOnlyAdmin = groupData.soadm;
    const soadmBypassCommands = ['suporte', 'ticketsuporte', 'suporteticket', 'ticket'];

    // Se modo soadm ativo e não é admin, ignorar aliases silenciosamente
    if (isGroup && isOnlyAdmin && !isGroupAdmin && !isOwner && matchedAlias) {
      return; // Ignora silenciosamente o alias para não-admins
    }

    const isAntiPorn = groupData.antiporn;
    const isMuted = isUserInMap(groupData.mutedUsers, sender);
    const isMuted2 = isUserInMap(groupData.mutedUsers2, sender);
    const isAntiLinkGp = groupData.antilinkgp;
    const ismodoADV = groupData.modoADV;

    const isAntiLinkCanal = groupData.antilinkcanal;
    const isAntiLinkSoft = groupData.antilinksoft;
    const isAntiDel = groupData.antidel;
    const isAntiBtn = groupData.antibtn;
    const isAntiStatus = groupData.antistatus;
    const isAutoRepo = groupData.autorepo;
    const isAssistente = groupData.assistente;
    const isModoLite = isGroup && isModoLiteActive(groupData, modoLiteGlobal);

    if (type === 'reactionMessage') {
      await processReactionMessage();
      return;
    }

    if (isGroup && groupData.minMessage && (isImage || isVideo || isVisuU || isVisuU2) && !isGroupAdmin && !isOwner) {
      let caption = '';
      if (isImage) {
        caption = info.message.imageMessage?.caption || '';
      } else if (isVideo) {
        caption = info.message.videoMessage?.caption || '';
      } else if (isVisuU) {
        caption = info.message.viewOnceMessage?.message?.imageMessage?.caption || info.message.viewOnceMessage?.message?.videoMessage?.caption || '';
      } else if (isVisuU2) {
        caption = info.message.viewOnceMessageV2?.message?.imageMessage?.caption || info.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';
      }
      if (caption.length < groupData.minMessage.minDigits) {
        try {
          await nazu.sendMessage(from, { delete: info.key });
          if (groupData.minMessage.action === 'ban') {
            if (isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              await reply(`🚫 Usuário removido por enviar mídia sem legenda suficiente (mínimo: ${groupData.minMessage.minDigits} caracteres).`);
            } else {
              await reply(`⚠️ Mídia sem legenda suficiente detectada, mas não sou admin para remover o usuário.`);
            }
          } else { // adv
            await reply(`⚠️ Advertência: Envie mídias com pelo menos ${groupData.minMessage.minDigits} caracteres na legenda para evitar remoção.`);
          }
        } catch (error) {
          console.error('Erro ao processar minMessage:', error);
        }
      }
    };

    if (isGroup && isStatusMention && isAntiStatus && !isGroupAdmin) {
      if (!isUserWhitelisted(sender, 'antistatus')) {
        if (isBotAdmin) {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        }
      }
    }
    if (isGroup && isButtonMessage && isAntiBtn && !isGroupAdmin) {
      if (!isUserWhitelisted(sender, 'antibtn')) {
        if (isBotAdmin) {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        }
      }
    }
    if (isGroup && isCmd && isOnlyAdmin && !isGroupAdmin && !soadmBypassCommands.includes(command)) {
      return;
    }
    if (isGroup && info.message.protocolMessage && info.message.protocolMessage.type === 0 && isAntiDel) {
      const deletedMsgKey = info.message.protocolMessage.key;
      const cacheKey = `${deletedMsgKey.remoteJid || from}_${deletedMsgKey.id}`;
      const cachedInfo = messagesCache.get(cacheKey);

      if (!cachedInfo || !cachedInfo.message) return;

      const msgOriginal = cachedInfo.message;

      const clone = JSON.parse(
        JSON.stringify(msgOriginal)
          .replaceAll('conversation', 'text')
          .replaceAll('Message', '')
      );

      for (const key in clone) {
        const media = clone[key];
        if (media && typeof media === 'object' && media.url) {
          clone[key] = {
            url: media.url
          };
          for (const subkey in media) {
            if (subkey !== 'url') {
              clone[subkey] = media[subkey];
            }
          }
        }
      }


      const participant = cachedInfo.key.participant || info.message.protocolMessage.key.participant;
      const fromGroup = cachedInfo.key.remoteJid;

      if (!participant) return;

      let userName = 'Usuário Desconhecido';
      let profilePic = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg';
      const pushNameFromMsg = cachedInfo?.pushName || '';

      if (pushNameFromMsg) {
        userName = pushNameFromMsg;
      } else {
        try {
          const fetchedName = await nazu.getName(fromGroup, participant);
          const numeroLimpoFallback = participant.split('@')[0];

          if (fetchedName && fetchedName !== numeroLimpoFallback) {
            userName = fetchedName;
          } else {
            userName = numeroLimpoFallback;
          }
        } catch (e) {
          userName = participant.split('@')[0];
        }
      }

      try {
        profilePic = await nazu.profilePictureUrl(participant, 'image');
      } catch (e) {
      }

      clone.contextInfo = {
        isForwarded: false,
        mentionedJid: [participant],
        externalAdReply: {
          title: `MENSAGEM APAGADA POR: ${userName}`,
          body: `Número: ${participant.split("@")[0]}`,
          thumbnailUrl: profilePic,
          sourceUrl: '',
          mediaType: 1,
          renderLargerThumbnail: false,
        },
      };

      try {
        await nazu.sendMessage(fromGroup, clone);
      } catch (err) {
        console.error('ERRO CRÍTICO AO REENVIAR MENSAGEM:', err);
      }
    }
    if (isGroup && isCmd && !isGroupAdmin && groupData.blockedCommands && groupData.blockedCommands[command]) {
      await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
      return;
    };

    if (isCmd && antiSpamGlobal?.enabled && !isOwnerOrSub) {
      try {
        const cfg = antiSpamGlobal;
        cfg.users = cfg.users || {};
        cfg.blocks = cfg.blocks || {};
        const now = Date.now();
        const blockInfo = cfg.blocks[sender];
        if (blockInfo && blockInfo.until && now < blockInfo.until) {
          const msLeft = blockInfo.until - now;
          const secs = Math.ceil(msLeft / 1000);
          const m = Math.floor(secs / 60), s = secs % 60;
          return reply(`🚫 Você está temporariamente bloqueado de usar comandos por anti-spam.
⏳ Aguarde ${m > 0 ? `${m}m ${s}s` : `${secs}s`}.`);
        } else if (blockInfo && blockInfo.until && now >= blockInfo.until) {
          delete cfg.blocks[sender];
        }
        const intervalMs = (cfg.interval || 10) * 1000;
        const limit = Math.max(1, parseInt(cfg.limit || 5));
        const arr = (cfg.users[sender]?.times || []).filter(ts => now - ts <= intervalMs);
        arr.push(now);
        cfg.users[sender] = { times: arr };
        if (arr.length > limit) {
          const blockMs = Math.max(1, parseInt(cfg.blockTime || 600)) * 1000;
          cfg.blocks[sender] = { until: now + blockMs, at: new Date().toISOString(), count: arr.length };
          writeJsonFile(DATABASE_DIR + '/antispam.json', cfg);
          return reply(`🚫 Anti-spam: você excedeu o limite de ${limit} comandos em ${cfg.interval}s.
🔒 Bloqueado por ${Math.floor(blockMs / 60000)} min.`);
        }
        writeJsonFile(DATABASE_DIR + '/antispam.json', cfg);
      } catch (e) {
        console.error('Erro no AntiSpam Global:', e);
      }
    }
    if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
      try {
        const afkReason = groupData.afkUsers[sender].reason;
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        delete groupData.afkUsers[sender];
        writeJsonFile(groupFile, groupData);
        // Otimização: Invalida cache quando groupData é salvo
        if (isGroup) {
          optimizer.invalidateGroup(from);
        }
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
      } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
      }
    }
    if (isGroup && isMuted && !isGroupAdmin && !isOwner) {
      try {
        await nazu.sendMessage(from, {
          text: `🤫 *Usuário mutado detectado*\n\n@${getUserName(sender)}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`,
          mentions: [sender]
        }, {
          quoted: info
        });
        await nazu.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        }
        removeUserFromMap(groupData.mutedUsers, sender);
        writeJsonFile(groupFile, groupData);
        // Otimização: Invalida cache quando groupData é salvo
        if (isGroup) {
          optimizer.invalidateGroup(from);
        }
        return;
      } catch (error) {
        console.error("Erro ao processar usuário mutado:", error);
      }
    }
    if (isGroup && isMuted2 && !isGroupAdmin && !isOwner) {
      try {
        await nazu.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
      } catch (error) {
        console.error("Erro ao deletar mensagem de usuário mutado2:", error);
      }
      return;
    }
    const rentalModeOn = isRentalModeActive();
    let groupHasActiveRental = false;
    let rentalStatusChecked = false;
    if (isGroup && rentalModeOn) {
      const rentalStatus = getGroupRentalStatus(from);
      groupHasActiveRental = rentalStatus.active;
      rentalStatusChecked = true;
      const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'addsubdono', 'remsubdono', 'listasubdonos'];
      if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply("⏳ O aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou solicite ao dono a renovação.");
        return;
      }
    }



    if (isGroup && !isCmd && body && /\b[A-F0-9]{8}\b/.test(body.toUpperCase())) {
      const potentialCode = body.match(/\b[A-F0-9]{8}\b/)[0].toUpperCase();
      const validation = validateActivationCode(potentialCode);
      if (validation.valid) {
        try {
          const activationResult = useActivationCode(potentialCode, from, sender);
          await reply(activationResult.message);
          if (activationResult.success) {
            return;
          }
        } catch (e) {
          console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        }
      }
    }
    if (isGroup) {
      try {
        groupData.contador = groupData.contador || [];
        const userIndex = groupData.contador.findIndex(user => user.id === sender);
        if (userIndex !== -1) {
          const userData = groupData.contador[userIndex];
          if (isCmd) {
            userData.cmd = (userData.cmd || 0) + 1;
          } else if (type === "stickerMessage") {
            userData.figu = (userData.figu || 0) + 1;
          } else {
            userData.msg = (userData.msg || 0) + 1;
          }
          if (pushname && userData.pushname !== pushname) {
            userData.pushname = pushname;
          }
          userData.lastActivity = new Date().toISOString();
        } else {
          groupData.contador.push({
            id: sender,
            msg: isCmd ? 0 : 1,
            cmd: isCmd ? 1 : 0,
            figu: type === "stickerMessage" ? 1 : 0,
            pushname: pushname || 'Usuário Desconhecido',
            firstSeen: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          });
        }
        writeJsonFile(groupFile, groupData);
        // Otimização: Invalida cache quando groupData é salvo
        if (isGroup) {
          optimizer.invalidateGroup(from);
        }
      } catch (error) {
        console.error("Erro no sistema de contagem de mensagens:", error);
      }
    }

    if (isGroup && groupData.levelingEnabled) {
      try {
        const levelingData = loadLevelingSafe();
        const userData = getLevelingUser(levelingData, sender);

        // Atualiza contadores
        userData.messages = (userData.messages || 0) + 1;
        if (isCmd) {
          userData.commands = (userData.commands || 0) + 1;
          userData.xp = (userData.xp || 0) + 10;
        } else {
          userData.xp = (userData.xp || 0) + 5;
        }
        userData.lastMessage = Date.now();

        // Verifica level up e salva
        checkLevelUp(sender, userData, levelingData, nazu, from);
        saveLevelingSafe(levelingData);
      } catch (levelingError) {
        console.error('❌ Erro no sistema de leveling:', levelingError.message);
      }
    }
    async function reply(text, options = {}) {
      try {
        const {
          mentions = [],
          noForward = false,
          noQuote = false
        } = options;
        const messageContent = {
          text: text.trim(),
          mentions: mentions
        };
        const sendOptions = {
          sendEphemeral: true
        };
        if (!noForward) {
          sendOptions.contextInfo = {
            forwardingScore: 50,
            isForwarded: true,
            externalAdReply: {
              showAdAttribution: true
            }
          };
        }
        if (!noQuote) {
          sendOptions.quoted = info;
        }
        const result = await nazu.sendMessage(from, messageContent, sendOptions);
        return result;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return null;
      }
    }
    nazu.reply = reply;
    const reagir = async (emj, options = {}) => {
      try {
        const messageKey = options.key || info.key;
        const delay = options.delay || 500;
        if (!messageKey) {
          console.error("Chave de mensagem inválida para reação");
          return false;
        }
        if (typeof emj === 'string') {
          if (emj.length < 1 || emj.length > 5) {
            console.warn("Emoji inválido para reação:", emj);
            return false;
          }
          await nazu.sendMessage(from, {
            react: {
              text: emj,
              key: messageKey
            }
          });
          return true;
        } else if (Array.isArray(emj) && emj.length > 0) {
          for (const emoji of emj) {
            if (typeof emoji !== 'string' || emoji.length < 1 || emoji.length > 5) {
              console.warn("Emoji inválido na sequência:", emoji);
              continue;
            }
            await nazu.sendMessage(from, {
              react: {
                text: emoji,
                key: messageKey
              }
            });
            if (delay > 0 && emj.indexOf(emoji) < emj.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erro ao reagir com emoji:", error);
        return false;
      }
    };
    nazu.react = reagir;


    async function processReactionMessage() {
      try {
        if (!isGroup) {
          return;
        }

        const reaction = info.message?.reactionMessage;
        if (!reaction || !reaction.key || !reaction.key.id) {
          return;
        }

        const targetMessageId = reaction.key.id;
        const emoji = reaction.text || '';
        const actorId = sender;

        if (!actorId) {
          return;
        }

        const roleCode = groupData.roleMessages?.[targetMessageId];
        if (roleCode && groupData.roles && groupData.roles[roleCode]) {
          const roleData = groupData.roles[roleCode];
          roleData.participants = roleData.participants && typeof roleData.participants === 'object' ? roleData.participants : {};
          const goingSet = new Set(Array.isArray(roleData.participants.going) ? roleData.participants.going : []);
          const notGoingSet = new Set(Array.isArray(roleData.participants.notGoing) ? roleData.participants.notGoing : []);
          let changed = false;

          if (!emoji) {
            if (goingSet.delete(actorId) || notGoingSet.delete(actorId)) {
              changed = true;
            }
          } else if (isGoingEmoji(emoji)) {
            if (!goingSet.has(actorId)) {
              changed = true;
            }
            goingSet.add(actorId);
            if (notGoingSet.delete(actorId)) {
              changed = true;
            }
          } else if (isNotGoingEmoji(emoji)) {
            if (!notGoingSet.has(actorId)) {
              changed = true;
            }
            notGoingSet.add(actorId);
            if (goingSet.delete(actorId)) {
              changed = true;
            }
          } else {
            return;
          }

          if (changed) {
            roleData.participants.going = Array.from(goingSet);
            roleData.participants.notGoing = Array.from(notGoingSet);
            roleData.participants.updatedAt = new Date().toISOString();
            persistGroupData();

            try {
              if (emoji) {
                const confirmationText = isGoingEmoji(emoji)
                  ? `🙋 Presença confirmada no rolê *${roleData.title || roleCode}*.`
                  : `🤷 Você sinalizou que não vai mais no rolê *${roleData.title || roleCode}*.`;
                await nazu.sendMessage(actorId, {
                  text: `${confirmationText}
Código: *${roleCode}*`,
                  mentions: [actorId]
                });
              }
            } catch (dmError) {
              console.warn('Não foi possível enviar confirmação de reação:', dmError.message || dmError);
            }

            // Atualiza a mensagem principal do rolê com as novas listas
            await refreshRoleAnnouncement(roleCode, roleData);
          }
          return;
        }
      } catch (reactionError) {
        console.error('Erro ao processar reação de rolê/resenha:', reactionError);
      }
    }
    const parsePipeArgs = (input) => (input || '').split('|').map(part => part.trim()).filter(Boolean);
    const sanitizeRoleCode = (code) => normalizar(code || '', true).replace(/[^0-9a-z]/gi, '').toUpperCase();

    const formatRoleSummary = (code, roleData, index = null) => {
      const participants = ensureRoleParticipants(roleData);
      const goingCount = participants.going.length;
      const notGoingCount = participants.notGoing.length;
      const lines = [];
      if (index !== null) {
        lines.push(`*${index + 1}.*`);
      }
      lines.push(`🎫 *Código:* ${code}`);
      if (roleData.title) {
        lines.push(`📛 *Título:* ${roleData.title}`);
      }
      if (roleData.when) {
        lines.push(`🗓️ *Quando:* ${roleData.when}`);
      }
      if (roleData.where) {
        lines.push(`📍 *Onde:* ${roleData.where}`);
      }
      if (roleData.description) {
        lines.push(`📝 *Descrição:* ${roleData.description}`);
      }
      lines.push(`🙋 *Confirmados:* ${goingCount}`);
      lines.push(`🤷 *Desistências:* ${notGoingCount}`);
      return lines.join('\n');
    };
    const formatMentionList = (ids) => ids.map(id => `@${getUserName(id)}`).join(' ');
    const parseTimeToMinutes = (timeStr) => {
      if (typeof timeStr !== 'string') return null;

      // Validate basic format
      const m = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!m) return null;

      const h = parseInt(m[1]);
      const mi = parseInt(m[2]);

      // Validate hour range
      if (h < 0 || h > 23) return null;

      // Validate minute range
      if (mi < 0 || mi > 59) return null;

      return h * 60 + mi;
    };

    // Enhanced time validation function
    const validateTimeFormat = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') {
        return { valid: false, error: 'Horário inválido. O horário não pode ser vazio.' };
      }

      // Check for valid format
      const isValidFormat = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr);
      if (!isValidFormat) {
        return { valid: false, error: 'Formato inválido. Use HH:MM (24 horas).' };
      }

      // Parse and validate components
      const [hours, minutes] = timeStr.split(':').map(Number);

      if (hours < 0 || hours > 23) {
        return { valid: false, error: 'Hora inválida. Use entre 00 e 23.' };
      }

      if (minutes < 0 || minutes > 59) {
        return { valid: false, error: 'Minuto inválido. Use entre 00 e 59.' };
      }

      // Check for edge cases
      if (timeStr === '24:00') {
        return { valid: false, error: 'Use 23:59 como horário máximo.' };
      }

      return { valid: true, timeStr };
    };
    const normalizeScheduleTime = (timeStr) => {
      if (typeof timeStr !== 'string') return null;
      const trimmed = timeStr.trim();
      const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) return null;
      const hours = String(parseInt(match[1], 10)).padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    };
    const hasRunForScheduleToday = (entry, today, targetTime) => {
      if (!entry) return false;
      if (typeof entry === 'string') {
        return entry === today;
      }
      if (typeof entry === 'object') {
        const { date, time } = entry;
        if (!date || date !== today) return false;
        if (!targetTime) return true;
        if (!time) return true;
        return time === targetTime;
      }
      return false;
    };
    const recordScheduleRun = (schedule, key, today, targetTime) => {
      if (!schedule || typeof schedule !== 'object') return;
      schedule.lastRun = typeof schedule.lastRun === 'object' && schedule.lastRun !== null ? schedule.lastRun : {};
      schedule.lastRun[key] = {
        date: today,
        time: targetTime
      };
    };
    const formatScheduleLastRun = (entry) => {
      if (!entry) return '—';
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object') {
        const date = entry.date || '—';
        if (entry.time) {
          return `${date} ${entry.time}`;
        }
        return date;
      }
      return '—';
    };
    const getNowMinutes = () => {
      // Use Brazil/Sao_Paulo timezone for accurate time comparisons
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      return saoPauloTime.getHours() * 60 + saoPauloTime.getMinutes();
    };
    const getTodayStr = () => {
      // Use Brazil/Sao_Paulo timezone for consistent date handling
      const d = new Date();
      const saoPauloDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const y = saoPauloDate.getFullYear();
      const m = String(saoPauloDate.getMonth() + 1).padStart(2, '0');
      const day = String(saoPauloDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const tzFormat = (date) => new Date(date).toLocaleString('pt-BR');
    const parseAbsoluteDateTime = (str) => {
      if (!str) return null;
      const cleaned = str.toLowerCase().replace(/\s+às\s+/g, ' ').replace(/\s+as\s+/g, ' ').trim();
      let m = cleaned.match(/\b(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\s+(\d{1,2}):(\d{2})\b/);
      if (m) {
        let [, d, mo, y, h, mi] = m;
        d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
        y = y ? parseInt(y) : new Date().getFullYear();
        if (y < 100) y += 2000;
        const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
        if (!isNaN(dt.getTime())) return dt.getTime();
      }
      m = cleaned.match(/\b(\d{1,2}):(\d{2})\s+(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\b/);
      if (m) {
        let [, h, mi, d, mo, y] = m;
        d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
        y = y ? parseInt(y) : new Date().getFullYear();
        if (y < 100) y += 2000;
        const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
        if (!isNaN(dt.getTime())) return dt.getTime();
      }
      m = cleaned.match(/\bhoje\b\s*(\d{1,2}):(\d{2})/);
      if (m) {
        const now = new Date();
        const h = parseInt(m[1]); const mi = parseInt(m[2]);
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
        return dt.getTime();
      }
      m = cleaned.match(/\bamanh[ãa]\b\s*(\d{1,2}):(\d{2})/);
      if (m) {
        const now = new Date();
        const h = parseInt(m[1]); const mi = parseInt(m[2]);
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, mi, 0, 0);
        return dt.getTime();
      }
      return null;
    };
    const parseRelative = (str) => {
      if (!str) return null;
      const m = str.toLowerCase().match(/\bem\s+(\d{1,5})\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b/);
      if (!m) return null;
      const n = parseInt(m[1]);
      const unit = m[2];
      let ms = 0;
      if (/^m(in|ins|inutos?)?$/.test(unit)) ms = n * 60 * 1000;
      else if (/^h|hora/.test(unit)) ms = n * 60 * 60 * 1000;
      else if (/^d|dia/.test(unit)) ms = n * 24 * 60 * 60 * 1000;
      else return null;
      return Date.now() + ms;
    };
    const parseReminderInput = (text) => {
      if (!text) return null;
      const relTs = parseRelative(text);
      if (relTs) {
        const after = text.toLowerCase().replace(/\bem\s+\d{1,5}\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b\s*/, '');
        const msg = after.trim();
        return { at: relTs, message: msg || 'Seu lembrete!' };
      }
      let m = text.toLowerCase().replace(/\s+às\s+/g, ' ').match(/(\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?\s+\d{1,2}:\d{2})/);
      if (!m) m = text.toLowerCase().match(/(\d{1,2}:\d{2}\s+\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?)/);
      if (!m) {
        let hm = text.toLowerCase().match(/(hoje\s*\d{1,2}:\d{2}|amanh[ãa]\s*\d{1,2}:\d{2})/);
        if (hm) {
          const ts = parseAbsoluteDateTime(hm[1]);
          const msg = text.toLowerCase().replace(hm[1], '').replace(/\s+às\s+/g, ' ').trim();
          if (ts) return { at: ts, message: msg || 'Seu lembrete!' };
        }
        return null;
      }
      const whenStr = m[1];
      const ts = parseAbsoluteDateTime(whenStr);
      if (!ts) return null;
      const msg = text.toLowerCase().replace(whenStr, '').replace(/\s+às\s+/g, ' ').trim();
      return { at: ts, message: msg || 'Seu lembrete!' };
    };

    let remindersWorkerStarted = global.remindersWorkerStarted || false;
    const startRemindersWorker = (nazuInstance) => {
      try {
        if (remindersWorkerStarted) return;
        remindersWorkerStarted = true;
        global.remindersWorkerStarted = true;
        setInterval(async () => {
          try {
            // Otimização: Cache de reminders
            const list = await optimizer.memoize(
              'reminders:all',
              () => Promise.resolve(loadReminders()),
              5000 // 5 segundos
            );
            if (!Array.isArray(list) || list.length === 0) return;
            const now = Date.now();
            let changed = false;
            for (const r of list) {
              if (!r || r.status === 'sent') continue;
              if (typeof r.at !== 'number') continue;
              if (r.at <= now) {
                const textMsg = `⏰ Lembrete${r.createdByName ? ` de ${r.createdByName}` : ''}: ${r.message}`;
                try {
                  if (r.chatId && String(r.chatId).endsWith('@g.us')) {
                    await nazuInstance.sendMessage(r.chatId, { text: textMsg, mentions: r.userId ? [r.userId] : [] });
                  } else {
                    const dest = r.chatId || r.userId;
                    if (dest) await nazuInstance.sendMessage(dest, { text: textMsg });
                  }
                  r.status = 'sent';
                  r.sentAt = new Date().toISOString();
                  changed = true;
                } catch (e) {
                }
              }
            }
            if (changed) {
              saveReminders(list);
              // Invalida cache após salvar
              optimizer.clearStatic('reminders:all');
              // Invalida cache após salvar
              optimizer.clearStatic('reminders:all');
            }
          } catch (err) {
          }
        }, 30 * 1000);
      } catch (e) {
      }
    };
    startRemindersWorker(nazu);
    // GP schedule using cron jobs (daily execution)
    let gpScheduleWorkerStarted = global.gpScheduleWorkerStarted || false;
    const gpCronJobs = {}; // key: `${groupId}:${type}` where type is 'open'|'close'

    const unscheduleGroupJob = (groupId, type) => {
      const key = `${groupId}:${type}`;
      const j = gpCronJobs[key];
      if (j && typeof j.stop === 'function') {
        try { j.stop(); } catch (e) { }
      }
      delete gpCronJobs[key];
    };

    const scheduleGroupJob = (groupId, type, timeStr, nazuInstance) => {
      if (!groupId || !timeStr) return;
      const normalized = normalizeScheduleTime(timeStr);
      if (!normalized) return;
      const [hh, mm] = normalized.split(':');
      if (typeof hh === 'undefined' || typeof mm === 'undefined') return;
      const key = `${groupId}:${type}`;
      // unschedule previous if exists
      unscheduleGroupJob(groupId, type);

      const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;
      try {
        const task = cron.schedule(cronExpr, async () => {
          try {
            const filePath = buildGroupFilePath(groupId);
            if (!fs.existsSync(filePath)) return;
            let data = {};
            try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { data = {}; }
            data.schedule = data.schedule || {};
            const schedule = data.schedule;

            if (type === 'open') {
              try {
                await nazuInstance.groupSettingUpdate(groupId, 'not_announcement');
                await nazuInstance.sendMessage(groupId, { text: '🔓 Grupo aberto automaticamente pelo agendamento diário.' });
                console.log(`[Cron] ✅ Grupo ABERTO automaticamente: ${groupId.substring(0, 15)}... às ${normalized}`);
              } catch (e) {
                console.error(`[Cron Error] open ${groupId}:`, e);
              }
            } else {
              try {
                await nazuInstance.groupSettingUpdate(groupId, 'announcement');
                await nazuInstance.sendMessage(groupId, { text: '🔒 Grupo fechado automaticamente pelo agendamento diário.' });
                console.log(`[Cron] ✅ Grupo FECHADO automaticamente: ${groupId.substring(0, 15)}... às ${normalized}`);
              } catch (e) {
                console.error(`[Cron Error] close ${groupId}:`, e);
              }
            }

            // record run and persist
            recordScheduleRun(schedule, type, getTodayStr(), normalized);
            data.schedule = schedule;
            try { writeJsonFile(filePath, data); } catch (e) { console.error('[Cron] Failed to write schedule run:', e); }
          } catch (e) {
            console.error('[Cron] Unexpected error in scheduled job:', e);
          }
        }, { timezone: 'America/Sao_Paulo' });

        gpCronJobs[key] = task;
      } catch (e) {
        console.error('[Cron] Failed to schedule job', cronExpr, e);
      }
    };

    const loadAllGroupSchedules = (nazuInstance) => {
      try {
        if (!ensureDirectoryExists(GRUPOS_DIR)) return;
        const files = fs.readdirSync(GRUPOS_DIR).filter(f => f.endsWith('.json'));
        let loadedCount = 0;
        for (const f of files) {
          const groupId = f.replace(/\.json$/, '');
          if (!groupId.endsWith('@g.us')) continue;
          const filePath = pathz.join(GRUPOS_DIR, f);
          let data = {};
          try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { continue; }
          const schedule = data.schedule && typeof data.schedule === 'object' ? data.schedule : {};
          if (schedule.openTime) {
            scheduleGroupJob(groupId, 'open', schedule.openTime, nazuInstance);
            console.log(`[Cron] ✅ Agendamento ABRIR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.openTime}`);
            loadedCount++;
          }
          if (schedule.closeTime) {
            scheduleGroupJob(groupId, 'close', schedule.closeTime, nazuInstance);
            console.log(`[Cron] ✅ Agendamento FECHAR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.closeTime}`);
            loadedCount++;
          }
        }
        if (loadedCount > 0) {
          console.log(`[Cron] 📅 Total de ${loadedCount} agendamento(s) carregado(s) com sucesso`);
        }
      } catch (e) {
        console.error('[Cron] Failed to load group schedules:', e);
      }
    };

    const startGpScheduleWorker = (nazuInstance) => {
      try {
        if (gpScheduleWorkerStarted) return;
        gpScheduleWorkerStarted = true;
        global.gpScheduleWorkerStarted = true;
        // load existing schedules and create cron jobs
        loadAllGroupSchedules(nazuInstance);
      } catch (e) {
        console.error('[Cron] startGpScheduleWorker error:', e);
      }
    };
    startGpScheduleWorker(nazu);

    let autoHorariosWorkerStarted = global.autoHorariosWorkerStarted || false;
    const startAutoHorariosWorker = (nazuInstance) => {
      try {
        if (autoHorariosWorkerStarted) return;
        autoHorariosWorkerStarted = true;
        global.autoHorariosWorkerStarted = true;

        setInterval(async () => {
          try {
            const now = new Date();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            if (minutes !== 0 || seconds > 30) return;

            const autoSchedulesPath = './dados/database/autohorarios.json';
            if (!fs.existsSync(autoSchedulesPath)) return;

            let autoSchedules = {};
            try {
              autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
            } catch (e) {
              return;
            }

            const currentHour = now.getHours();

            for (const [chatId, config] of Object.entries(autoSchedules)) {
              if (!config.enabled) continue;
              if (!chatId.endsWith('@g.us')) continue;

              try {
                const currentTime = new Date();
                const currentBrazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000));

                const games = [
                  { name: "🎯 FORTUNE TIGER", hours: [9, 11, 14, 16, 18, 20, 22] },
                  { name: "🐂 FORTUNE OX", hours: [8, 10, 13, 15, 17, 19, 21] },
                  { name: "🐭 FORTUNE MOUSE", hours: [7, 12, 14, 16, 19, 21, 23] },
                  { name: "🐰 FORTUNE RABBIT", hours: [6, 9, 11, 15, 18, 20, 22] },
                  { name: "🐉 FORTUNE DRAGON", hours: [8, 10, 12, 16, 18, 21, 23] },
                  { name: "💎 GATES OF OLYMPUS", hours: [7, 9, 13, 17, 19, 22, 0] },
                  { name: "⚡ GATES OF AZTEC", hours: [6, 11, 14, 16, 20, 22, 1] },
                  { name: "🍭 SWEET BONANZA", hours: [8, 12, 15, 17, 19, 21, 23] },
                  { name: "🏺 HAND OF MIDAS", hours: [7, 10, 13, 16, 18, 20, 0] },
                  { name: "🌟 STARLIGHT PRINCESS", hours: [6, 9, 12, 15, 19, 22, 1] },
                  { name: "🔥 FIRE PORTALS", hours: [8, 11, 14, 17, 20, 23, 2] },
                  { name: "⭐ STAR CLUSTERS", hours: [7, 10, 12, 16, 18, 21, 0] },
                  { name: "🌊 AQUA MILLIONS", hours: [6, 9, 13, 15, 19, 22, 1] },
                  { name: "🎪 CIRCUS LAUNCH", hours: [8, 11, 14, 16, 20, 23, 2] },
                  { name: "🏖️ CASH PATROL", hours: [7, 10, 13, 17, 19, 21, 0] },
                  { name: "🎊 PARTY FEVER", hours: [6, 12, 15, 18, 20, 22, 1] },
                  { name: "🎭 MYSTERY JOKER", hours: [8, 10, 14, 16, 19, 23, 2] },
                  { name: "🎰 SPIN PARTY", hours: [7, 9, 13, 15, 18, 21, 0] },
                  { name: "💰 MONEY MAKER", hours: [6, 11, 12, 17, 20, 22, 1] }
                ];

                let responseText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                responseText += `┃    🎰 *HORÁRIOS PAGANTES*   ┃\n`;
                responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                responseText += `🕐 *Atualizado automaticamente:*\n`;
                responseText += `📅 ${currentBrazilTime.toLocaleDateString('pt-BR')}\n`;
                responseText += `⏰ ${currentBrazilTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

                games.forEach(game => {
                  const todayHours = game.hours.map(baseHour => {
                    const variation = Math.floor(Math.random() * 21) - 10;
                    const finalHour = baseHour + Math.floor(variation / 60);
                    const finalMinutes = Math.abs(variation % 60);

                    const displayHour = finalHour < 0 ? 24 + finalHour : finalHour > 23 ? finalHour - 24 : finalHour;
                    return `${displayHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
                  });

                  responseText += `${game.name}\n`;
                  responseText += `🕐 ${todayHours.join(' • ')}\n\n`;
                });

                if (config.link) {
                  responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                  responseText += `┃      🔗 *LINK DE APOSTAS*     ┃\n`;
                  responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                  responseText += `${config.link}\n\n`;
                }

                responseText += `⚠️ *AVISOS IMPORTANTES:*\n`;
                responseText += `🔞 *Conteúdo para maiores de 18 anos*\n`;
                responseText += `📊 Estes são horários estimados\n`;
                responseText += `🎯 Jogue com responsabilidade\n`;
                responseText += `💰 Nunca aposte mais do que pode perder\n`;
                responseText += `🆘 Procure ajuda se tiver vício em jogos\n`;
                responseText += `⚖️ Apostas podem causar dependência\n\n`;
                responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                responseText += `┃  🍀 *BOA SORTE E JOGUE*    ┃\n`;
                responseText += `┃     *CONSCIENTEMENTE!* 🍀  ┃\n`;
                responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;

                await nazuInstance.sendMessage(chatId, { text: responseText });

                config.lastSent = Date.now();

              } catch (e) {
                console.error(`Erro ao enviar auto horários para ${chatId}:`, e);
              }
            }

            try {
              writeJsonFile(autoSchedulesPath, autoSchedules);
            } catch (e) {
              console.error('Erro ao salvar auto schedules:', e);
            }

          } catch (err) {
            console.error('Erro no auto horários worker:', err);
          }
        }, 60 * 1000);

      } catch (e) {
        console.error('Erro ao iniciar auto horários worker:', e);
      }
    };
    startAutoHorariosWorker(nazu);

    // Auto Mensagens Worker usando cron jobs (executa conforme horários programados)
    let autoMensagensWorkerStarted = global.autoMensagensWorkerStarted || false;
    const autoMsgCronJobs = global.autoMsgCronJobs || {}; // key: `${groupId}:${msgId}`
    global.autoMsgCronJobs = autoMsgCronJobs; // Garantir persistência global

    const unscheduleAutoMessage = (groupId, msgId) => {
      const key = `${groupId}:${msgId}`;
      const j = autoMsgCronJobs[key];
      if (j && typeof j.stop === 'function') {
        try { j.stop(); } catch (e) { }
      }
      delete autoMsgCronJobs[key];
    };

    const scheduleAutoMessage = (groupId, msgConfig, nazuInstance) => {
      if (!groupId || !msgConfig || !msgConfig.id || !msgConfig.time) return;

      const normalized = normalizeScheduleTime(msgConfig.time);
      if (!normalized) return;

      const [hh, mm] = normalized.split(':');
      if (typeof hh === 'undefined' || typeof mm === 'undefined') return;

      const key = `${groupId}:${msgConfig.id}`;

      // Remover agendamento anterior se existir
      unscheduleAutoMessage(groupId, msgConfig.id);

      const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;

      try {
        const task = cron.schedule(cronExpr, async () => {
          try {
            // Recarregar dados do arquivo para pegar versão mais recente
            const filePath = pathz.join(GRUPOS_DIR, `${groupId}.json`);
            if (!fs.existsSync(filePath)) {
              console.warn(`[AutoMsg] Arquivo do grupo não encontrado: ${groupId}`);
              return;
            }

            let groupFileData = {};
            try {
              groupFileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
              console.error(`[AutoMsg] Erro ao ler arquivo do grupo ${groupId}:`, e);
              return;
            }

            const autoMessages = groupFileData.autoMessages || [];
            const currentMsg = autoMessages.find(m => m.id === msgConfig.id);

            if (!currentMsg) {
              console.warn(`[AutoMsg] Mensagem ${msgConfig.id} não encontrada no arquivo`);
              return;
            }

            if (!currentMsg.enabled) {
              console.log(`[AutoMsg] Mensagem ${msgConfig.id} está desativada, pulando envio`);
              return;
            }

            // Construir e enviar a mensagem
            const messageContent = {};

            if (currentMsg.type === 'text') {
              messageContent.text = currentMsg.content;
            } else if (currentMsg.type === 'image') {
              messageContent.image = { url: currentMsg.mediaPath };
              if (currentMsg.caption) messageContent.caption = currentMsg.caption;
            } else if (currentMsg.type === 'video') {
              messageContent.video = { url: currentMsg.mediaPath };
              if (currentMsg.caption) messageContent.caption = currentMsg.caption;
            } else if (currentMsg.type === 'document') {
              messageContent.document = { url: currentMsg.mediaPath };
              messageContent.fileName = currentMsg.fileName || 'documento.pdf';
              if (currentMsg.caption) messageContent.caption = currentMsg.caption;
            } else if (currentMsg.type === 'sticker') {
              messageContent.sticker = { url: currentMsg.mediaPath };
            } else if (currentMsg.type === 'audio') {
              messageContent.audio = { url: currentMsg.mediaPath };
              messageContent.mimetype = 'audio/mp4';
            }

            await nazuInstance.sendMessage(groupId, messageContent);
            console.log(`[AutoMsg] ✅ Mensagem enviada automaticamente: Grupo ${groupId.substring(0, 15)}... ID ${msgConfig.id} às ${normalized}`);

          } catch (e) {
            console.error(`[AutoMsg Error] ${groupId}:${msgConfig.id}:`, e);
          }
        }, {
          scheduled: true,
          timezone: 'America/Sao_Paulo'
        });

        // Iniciar a task imediatamente
        task.start();
        autoMsgCronJobs[key] = task;
        console.log(`[AutoMsg] 🔔 Agendamento criado para ${key} em ${cronExpr} (timezone: America/Sao_Paulo)`);
      } catch (e) {
        console.error('[AutoMsg] Failed to schedule message', cronExpr, e);
      }
    };

    const loadAllAutoMessages = (nazuInstance) => {
      try {
        if (!ensureDirectoryExists(GRUPOS_DIR)) return;
        const files = fs.readdirSync(GRUPOS_DIR).filter(f => f.endsWith('.json'));
        let loadedCount = 0;

        for (const f of files) {
          const groupId = f.replace(/\.json$/, '');
          if (!groupId.endsWith('@g.us')) continue;

          const filePath = pathz.join(GRUPOS_DIR, f);
          let data = {};
          try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { continue; }

          const autoMessages = data.autoMessages && Array.isArray(data.autoMessages) ? data.autoMessages : [];

          for (const msgConfig of autoMessages) {
            if (msgConfig.enabled && msgConfig.time) {
              scheduleAutoMessage(groupId, msgConfig, nazuInstance);
              console.log(`[AutoMsg] ✅ Mensagem agendada: Grupo ${groupId.substring(0, 15)}... ID ${msgConfig.id} às ${msgConfig.time}`);
              loadedCount++;
            }
          }
        }

        if (loadedCount > 0) {
          console.log(`[AutoMsg] 📨 Total de ${loadedCount} mensagem(ns) automática(s) carregada(s) com sucesso`);
        }
      } catch (e) {
        console.error('[AutoMsg] Failed to load auto messages:', e);
      }
    };

    const startAutoMensagensWorker = (nazuInstance) => {
      try {
        if (autoMensagensWorkerStarted) return;
        autoMensagensWorkerStarted = true;
        global.autoMensagensWorkerStarted = true;

        // Carregar mensagens existentes e criar cron jobs
        loadAllAutoMessages(nazuInstance);

        // Recarregar periodicamente para garantir que os agendamentos permaneçam ativos
        if (!global.autoMensagensRefreshTimer) {
          global.autoMensagensRefreshTimer = setInterval(() => {
            try {
              loadAllAutoMessages(nazuInstance);
            } catch (e) {
              console.error('[AutoMsg] refresh error:', e);
            }
          }, 6 * 60 * 60 * 1000); // a cada 6 horas
        }
      } catch (e) {
        console.error('[AutoMsg] startAutoMensagensWorker error:', e);
      }
    };

    startAutoMensagensWorker(nazu);

    // ============== DIVULGAÇÃO DO DONO (NOVO SISTEMA) ==============
    let donoDivulgacaoWorkerStarted = global.donoDivulgacaoWorkerStarted || false;
    let donoDivulgacaoCronJob = global.donoDivulgacaoCronJob || null;

    const unscheduleDonoDivulgacaoJob = () => {
      if (donoDivulgacaoCronJob && typeof donoDivulgacaoCronJob.stop === 'function') {
        try { donoDivulgacaoCronJob.stop(); } catch (e) { }
      }
      donoDivulgacaoCronJob = null;
      global.donoDivulgacaoCronJob = null;
    };

    const runDonoDivulgacaoSend = async (nazuInstance, messageText, source = 'manual') => {
      const config = loadDonoDivulgacao();
      const groups = Array.isArray(config.groups) ? config.groups : [];
      const text = (messageText || config.message || '').trim();

      if (!text) {
        return { success: false, message: '❌ Nenhuma mensagem configurada para divulgar.' };
      }
      if (groups.length === 0) {
        return { success: false, message: '❌ Nenhum grupo registrado para divulgação.' };
      }

      let sent = 0;
      let failed = 0;

      for (const groupId of groups) {
        if (!isGroupId(groupId)) {
          failed++;
          continue;
        }
        try {
          await nazuInstance.sendMessage(groupId, { text });
          sent++;
        } catch (e) {
          failed++;
        }
      }

      config.stats = config.stats || { totalSent: 0, lastManual: null, lastAuto: null };
      config.stats.totalSent = (config.stats.totalSent || 0) + sent;
      if (source === 'auto') {
        config.stats.lastAuto = new Date().toISOString();
      } else {
        config.stats.lastManual = new Date().toISOString();
      }

      saveDonoDivulgacao(config);

      return { success: true, sent, failed };
    };

    const scheduleDonoDivulgacaoJob = (timeStr, nazuInstance) => {
      const normalized = normalizeScheduleTime(timeStr);
      if (!normalized) return false;
      const [hh, mm] = normalized.split(':');
      if (typeof hh === 'undefined' || typeof mm === 'undefined') return false;

      unscheduleDonoDivulgacaoJob();

      const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;
      try {
        const task = cron.schedule(cronExpr, async () => {
          try {
            const config = loadDonoDivulgacao();
            const schedule = config.schedule || {};

            if (!schedule.enabled || !schedule.time) return;
            const targetTime = normalizeScheduleTime(schedule.time);
            if (!targetTime) return;

            const today = getTodayStr();
            if (hasRunForScheduleToday(schedule.lastRun, today, targetTime)) return;

            const result = await runDonoDivulgacaoSend(nazuInstance, null, 'auto');
            if (result.success) {
              schedule.lastRun = { date: today, time: targetTime };
              config.schedule = schedule;
              saveDonoDivulgacao(config);
            }
          } catch (e) {
            console.error('[DivDono] Erro no agendamento:', e);
          }
        }, { timezone: 'America/Sao_Paulo' });

        task.start();
        donoDivulgacaoCronJob = task;
        global.donoDivulgacaoCronJob = task;
        return true;
      } catch (e) {
        console.error('[DivDono] Falha ao agendar job', cronExpr, e);
        return false;
      }
    };

    const startDonoDivulgacaoWorker = (nazuInstance) => {
      try {
        if (donoDivulgacaoWorkerStarted) return;
        donoDivulgacaoWorkerStarted = true;
        global.donoDivulgacaoWorkerStarted = true;

        const config = loadDonoDivulgacao();
        if (config.schedule?.enabled && config.schedule?.time) {
          scheduleDonoDivulgacaoJob(config.schedule.time, nazuInstance);
        }
      } catch (e) {
        console.error('[DivDono] Erro ao iniciar worker:', e);
      }
    };

    startDonoDivulgacaoWorker(nazu);

    const getFileBuffer = async (mediakey, mediaType, options = {}) => {
      try {
        if (!mediakey) {
          throw new Error('Chave de mídia inválida');
        }

        // Corrige os tipos aceitos pelo Baileys
        const typeMap = {
          sticker: 'image',
          stickerMessage: 'image',
          imageMessage: 'image',
          videoMessage: 'video',
          audioMessage: 'audio',
          documentMessage: 'document'
        };

        const downloadType = typeMap[mediaType] || mediaType;

        console.log("[BUFFER] Tipo solicitado:", mediaType);
        console.log("[BUFFER] Tipo usado no download:", downloadType);

        const stream = await downloadContentFromMessage(
          mediakey,
          downloadType
        );

        const chunks = [];
        let totalSize = 0;
        const MAX_BUFFER_SIZE = 50 * 1024 * 1024;

        for await (const chunk of stream) {
          chunks.push(chunk);
          totalSize += chunk.length;

          if (totalSize > MAX_BUFFER_SIZE) {
            throw new Error(`Tamanho máximo excedido (${MAX_BUFFER_SIZE / 1024 / 1024}MB)`);
          }
        }

        const buffer = Buffer.concat(chunks);

        console.log("[BUFFER] Bytes recebidos:", buffer.length);
        console.log("[BUFFER] Header:", buffer.subarray(0, 16).toString("hex"));

        return buffer;

      } catch (err) {
        console.error("[BUFFER] Erro:", err);
        throw err;
      }
    };
    const getMediaInfo = message => {
      if (!message) return null;
      if (message.imageMessage) return {
        media: message.imageMessage,
        type: 'image'
      };
      if (message.videoMessage) return {
        media: message.videoMessage,
        type: 'video'
      };
      if (message.viewOnceMessage?.message?.imageMessage) return {
        media: message.viewOnceMessage.message.imageMessage,
        type: 'image'
      };
      if (message.viewOnceMessage?.message?.videoMessage) return {
        media: message.viewOnceMessage.message.videoMessage,
        type: 'video'
      };
      if (message.viewOnceMessageV2?.message?.imageMessage) return {
        media: message.viewOnceMessageV2.message.imageMessage,
        type: 'image'
      };
      if (message.viewOnceMessageV2?.message?.videoMessage) return {
        media: message.viewOnceMessageV2.message.videoMessage,
        type: 'video'
      };
      return null;
    };

    /**
     * Processa uma imagem usando ffmpeg para formato adequado para foto de perfil
     * Redimensiona para 640x640 (máximo) e converte para JPEG
     */
    const processImageForProfile = async (imageBuffer) => {
      const tempDir = pathz.join(__dirname, '..', 'database', 'tmp');
      ensureDirectoryExists(tempDir);

      const inputFile = pathz.join(tempDir, `input_${Date.now()}.jpg`);
      const outputFile = pathz.join(tempDir, `output_${Date.now()}.jpg`);

      try {
        // Salva o buffer de entrada
        fs.writeFileSync(inputFile, imageBuffer);

        // Processa com ffmpeg: redimensiona para 640x640 mantendo proporção e converte para JPEG
        const cmd = `ffmpeg -hide_banner -loglevel error -i "${inputFile}" -vf "scale=640:640:force_original_aspect_ratio=decrease,pad=640:640:(ow-iw)/2:(oh-ih)/2:color=white" -q:v 5 -y "${outputFile}"`;

        await execAsync(cmd, { timeout: 15000 });

        // Lê o arquivo processado
        const processedBuffer = fs.readFileSync(outputFile);

        // Limpa arquivos temporários
        try {
          fs.unlinkSync(inputFile);
          fs.unlinkSync(outputFile);
        } catch (cleanupError) {
          console.warn('Aviso: Erro ao limpar arquivos temporários:', cleanupError.message);
        }

        return processedBuffer;
      } catch (error) {
        // Limpa arquivos temporários em caso de erro
        try {
          if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        } catch (cleanupError) {
          // Ignora erros de limpeza
        }
        throw new Error(`Erro ao processar imagem: ${error.message}`);
      }
    };

    if (isGroup && info.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
      if (groupData.afkUsers) {
        for (const jid of mentioned) {
          if (groupData.afkUsers[jid]) {
            const afkData = groupData.afkUsers[jid];
            const afkSince = new Date(afkData.since).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            });
            let afkMsg = `😴 @${getUserName(jid)} está AFK desde ${afkSince}.`;
            if (afkData.reason) {
              afkMsg += `\nMotivo: ${afkData.reason}`;
            }
            await reply(afkMsg, {
              mentions: [jid]
            });
          }
        }
      }
    }
    if (isGroup && isAntiPorn && !info.key.fromMe) {
      if (!isGroupAdmin && !isUserWhitelisted(sender, 'antiporn')) {
        const mediaInfo = getMediaInfo(info.message);
        if (mediaInfo && mediaInfo.type === 'image') {
          try {
            const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
            const mediaURL = await upload(imageBuffer, true);
            if (mediaURL) {
              const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${encodeURIComponent(mediaURL)}`);
              let scores = {
                Porn: 0,
                Hentai: 0
              };
              if (Array.isArray(apiResponse.data)) {
                scores = apiResponse.data.reduce((acc, item) => {
                  if (item && typeof item.className === 'string' && typeof item.probability === 'number') {
                    if (item.className === 'Porn' || item.className === 'Hentai') {
                      acc[item.className] = Math.max(acc[item.className] || 0, item.probability);
                    }
                  }
                  return acc;
                }, {
                  Porn: 0,
                  Hentai: 0
                });
              } else {
                console.warn("Anti-porn API response format unexpected:", apiResponse.data);
              }
              const pornThreshold = 0.7;
              const hentaiThreshold = 0.7;
              const isPorn = scores.Porn >= pornThreshold;
              const isHentai = scores.Hentai >= hentaiThreshold;
              if (isPorn || isHentai) {
                const reason = isPorn ? 'Pornografia' : 'Hentai';
                await reply(`🚨 Conteúdo impróprio detectado! (${reason})`);

                const pornGroupFilePath = buildGroupFilePath(from);
                let pornGroupData = fs.existsSync(pornGroupFilePath) ? JSON.parse(fs.readFileSync(pornGroupFilePath)) : {};
                pornGroupData.warnings = pornGroupData.warnings || {};

                try {
                  await nazu.sendMessage(from, { delete: info.key });
                } catch { }

                if (pornGroupData.modoADV) {
                  pornGroupData.warnings[sender] = pornGroupData.warnings[sender] || [];
                  pornGroupData.warnings[sender].push({
                    reason: `Conteúdo impróprio (${reason})`,
                    timestamp: Date.now(),
                    issuer: botNumber
                  });
                  const warningCount = pornGroupData.warnings[sender].length;
                  fs.writeFileSync(pornGroupFilePath, JSON.stringify(pornGroupData, null, 2));
                  if (warningCount >= 3) {
                    if (isBotAdmin) {
                      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                      delete pornGroupData.warnings[sender];
                      fs.writeFileSync(pornGroupFilePath, JSON.stringify(pornGroupData, null, 2));
                      await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar conteúdo impróprio e foi removido.`, { mentions: [sender] });
                    } else {
                      await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
                    }
                  } else {
                    await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar conteúdo impróprio (${reason}).\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
                  }
                } else {
                  if (isBotAdmin) {
                    try {
                      await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                      await reply(`🔞 @${getUserName(sender)}, conteúdo impróprio detectado. Você foi removido do grupo.`, { mentions: [sender] });
                    } catch (adminError) {
                      console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                      await reply(`⚠️ Não consegui remover @${getUserName(sender)} automaticamente após detectar conteúdo impróprio. Admins, por favor, verifiquem!`, { mentions: [sender] });
                    }
                  } else {
                    await reply(`@${getUserName(sender)} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`, { mentions: [sender] });
                  }
                }
              }
            } else {
              console.warn("Falha no upload da imagem para verificação anti-porn.");
            }
          } catch (error) {
            console.error("Erro na verificação anti-porn:", error);
          }
        }
      }
    }
    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      if (!isUserWhitelisted(sender, 'antiloc')) {
        const locGroupFilePath = buildGroupFilePath(from);
        let locGroupData = fs.existsSync(locGroupFilePath) ? JSON.parse(fs.readFileSync(locGroupFilePath)) : {};
        locGroupData.warnings = locGroupData.warnings || {};

        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
        } catch { }

        if (locGroupData.modoADV) {
          locGroupData.warnings[sender] = locGroupData.warnings[sender] || [];
          locGroupData.warnings[sender].push({
            reason: 'Envio de localização',
            timestamp: Date.now(),
            issuer: botNumber
          });
          const warningCount = locGroupData.warnings[sender].length;
          fs.writeFileSync(locGroupFilePath, JSON.stringify(locGroupData, null, 2));
          if (warningCount >= 3) {
            if (isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              delete locGroupData.warnings[sender];
              fs.writeFileSync(locGroupFilePath, JSON.stringify(locGroupData, null, 2));
              await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar localização e foi removido.`, { mentions: [sender] });
            } else {
              await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
            }
          } else {
            await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar localização.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
          }
        } else {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🗺️ @${getUserName(sender)}, localização não permitida. Você foi removido do grupo.`, { mentions: [sender] });
        }
      }
    }
    if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
      antifloodData[from].users = antifloodData[from].users || {};
      const now = Date.now();
      const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
      const interval = antifloodData[from].interval * 1000;
      if (now - lastCmd < interval) {
        return reply(`⏳ Aguarde ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos antes de usar outro comando.`);
      }
      antifloodData[from].users[sender] = {
        lastCmd: now
      };
      // Nota: Não salvamos em disco aqui para evitar race conditions.
      // O cache será salvo periodicamente pelo optimizer.
    }
    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      if (!isUserWhitelisted(sender, 'antidoc')) {
        const docGroupFilePath = buildGroupFilePath(from);
        let docGroupData = fs.existsSync(docGroupFilePath) ? JSON.parse(fs.readFileSync(docGroupFilePath)) : {};
        docGroupData.warnings = docGroupData.warnings || {};

        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
        } catch { }

        if (docGroupData.modoADV) {
          docGroupData.warnings[sender] = docGroupData.warnings[sender] || [];
          docGroupData.warnings[sender].push({
            reason: 'Envio de documento',
            timestamp: Date.now(),
            issuer: botNumber
          });
          const warningCount = docGroupData.warnings[sender].length;
          fs.writeFileSync(docGroupFilePath, JSON.stringify(docGroupData, null, 2));
          if (warningCount >= 3) {
            if (isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              delete docGroupData.warnings[sender];
              fs.writeFileSync(docGroupFilePath, JSON.stringify(docGroupData, null, 2));
              await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar documentos e foi removido.`, { mentions: [sender] });
            } else {
              await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
            }
          } else {
            await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar documento.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
          }
        } else {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`📄 @${getUserName(sender)}, documentos não são permitidos. Você foi removido do grupo.`, { mentions: [sender] });
        }
      }
    }

    if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
      const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch && urlMatch.length > 0) {
        // Processa apenas o primeiro link encontrado
        try {
          handleAutoDownload(nazu, from, urlMatch[0], info)
            .then(() => null)
            .catch((e) => {
              console.error('Erro no autodl:', e);
            });
        } catch (e) {
          console.error('Erro no autodl:', e);
        }
      }
    }
    if (isGroup && groupData.autoSticker && !info.key.fromMe) {
      try {
        const mediaImage = info.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage;
        const mediaVideo = info.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage;
        if (mediaImage || mediaVideo) {
          const isVideo = !!mediaVideo;
          if (isVideo && mediaVideo.seconds > 9.9) {
            return;
          }
          const buffer = await getFileBuffer(isVideo ? mediaVideo : mediaImage, isVideo ? 'video' : 'image');
          const shouldForceSquare = global.autoStickerMode === 'square';
          await sendSticker(nazu, from, {
            sticker: buffer,
            author: `『${pushname}』`,
            packname: `${nomebot}`, type: isVideo ? 'video' : 'image',
            forceSquare: shouldForceSquare
          }, {
            quoted: info
          });
        }
      } catch (e) {
        console.error("Erro ao converter mídia em figurinha automática:", e);
      }
    }


    if (isGroup && groupData.autotranscrever && !info.key.fromMe) {
      try {

        const audioMessage =
          info.message?.audioMessage;

        const isPTT =
          audioMessage?.ptt === true;

        if (isPTT && audioMessage) {


          reply('📝 transcrevendo áudio, aguarde...');


          const media =
            await getFileBuffer(audioMessage, "audio");


          const linkz =
            await upload(media);


          const resultado =
            await totext.totext(linkz);

          if (!resultado?.ok) {
            return;
          }
          reply(
            `📝 *autotranscrever:*\n\n${resultado.texto}`
          );

        }

      } catch (e) {
        console.error(
          "Erro no autotranscrever:",
          e
        );
      }
    }

    let quotedMessageContent = null;
    if (type === 'extendedTextMessage' && info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      quotedMessageContent = info.message.extendedTextMessage.contextInfo.quotedMessage;
    }
    const isQuotedMsg = !!quotedMessageContent?.conversation;
    const isQuotedMsg2 = !!quotedMessageContent?.extendedTextMessage?.text;
    const isQuotedImage = !!quotedMessageContent?.imageMessage;
    const isQuotedVisuU = !!quotedMessageContent?.viewOnceMessage;
    const isQuotedVisuU2 = !!quotedMessageContent?.viewOnceMessageV2;
    const isQuotedVideo = !!quotedMessageContent?.videoMessage;
    const isQuotedDocument = !!quotedMessageContent?.documentMessage;
    const isQuotedDocW = !!quotedMessageContent?.documentWithCaptionMessage;
    const isQuotedAudio = !!quotedMessageContent?.audioMessage;
    const isQuotedSticker = !!quotedMessageContent?.stickerMessage;
    const isQuotedContact = !!quotedMessageContent?.contactMessage;
    const isQuotedLocation = !!quotedMessageContent?.locationMessage;
    const isQuotedProduct = !!quotedMessageContent?.productMessage;
    if (body.startsWith('$')) {
      if (!isOwner) return;
      try {
        exec(q, (err, stdout) => {
          if (err) {
            return reply(`❌ *Erro na execução*\n\n${err}`);
          }
          if (stdout) {
            reply(`✅ *Resultado do comando*\n\n${stdout}`);
          }
        });
      } catch (error) {
        reply(`❌ *Erro ao executar comando*\n\n${error}`);
      }
    }
    if (body.startsWith('>>')) {
      if (!isOwner) return;
      try {
        (async () => {
          try {
            const codeLines = body.slice(2).trim().split('\n');
            if (codeLines.length > 1) {
              if (!codeLines[codeLines.length - 1].includes('return')) {

                codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
              }
            } else {
              if (!codeLines[0].includes('return')) {

                codeLines[0] = 'return ' + codeLines[0];
              }
            }
            const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);
            let output;
            if (typeof result === 'object' && result !== null) {

              output = JSON.stringify(result, null, 2);
            } else if (typeof result === 'function') {

              output = result.toString();
            } else {

              output = String(result);
            }
            return reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => reply(String(e)));
          } catch (e) {
            return reply(`❌ *Erro na execução*\n\n${String(e)}`);
          }
        })();
      } catch (e) {
        reply(`❌ *Erro crítico*\n\n${String(e)}`);
      }
    }

    // Verifica se o usuário é um parceiro registrado
    const isParceiro = !!(parceriasData?.active && parceriasData?.partners?.[sender]);

    if (isGroup && isAntiLinkGp && !isGroupAdmin && !isParceiro) {
      if (!isUserWhitelisted(sender, 'antilinkgp')) {

        let foundGroupLink = false;
        let link_dgp = null;

        try {

          const groupFilePath = buildGroupFilePath(from);

          let groupData =
            fs.existsSync(groupFilePath)
              ? JSON.parse(
                fs.readFileSync(groupFilePath)
              )
              : {};

          groupData.warnings =
            groupData.warnings || {};

          if (
            budy2 &&
            budy2.includes(
              'chat.whatsapp.com'
            )
          ) {

            foundGroupLink = true;

            link_dgp =
              await nazu.groupInviteCode(
                from
              );

            if (
              budy2.includes(
                link_dgp
              )
            )
              foundGroupLink = false;

          }

          if (
            !foundGroupLink &&
            info.message
              ?.requestPaymentMessage
          ) {

            const paymentText =
              info.message
                .requestPaymentMessage
                ?.noteMessage
                ?.extendedTextMessage
                ?.text || '';

            if (
              paymentText.includes(
                'chat.whatsapp.com'
              )
            ) {

              foundGroupLink = true;

              link_dgp =
                link_dgp ||
                await nazu.groupInviteCode(
                  from
                );

              if (
                paymentText.includes(
                  link_dgp
                )
              )
                foundGroupLink = false;

            }

          }

          if (foundGroupLink) {

            if (isOwner)
              return;

            if (
              !AllgroupMembers.includes(
                sender
              )
            )
              return;

            // apagar mensagem
            try {

              await nazu.sendMessage(
                from,
                {
                  delete: {
                    remoteJid: from,
                    fromMe: false,
                    id: info.key.id,
                    participant: sender
                  }
                }
              );

            } catch { }

            // MODO ADVERTÊNCIA
            if (groupData.modoADV) {

              groupData.warnings[sender] =
                groupData.warnings[
                sender
                ] || [];

              groupData.warnings[
                sender
              ].push({
                reason:
                  'Envio de link de outro grupo',
                timestamp:
                  Date.now(),
                issuer:
                  botNumber
              });

              const warningCount =
                groupData
                  .warnings[
                  sender
                ].length;

              fs.writeFileSync(
                groupFilePath,
                JSON.stringify(
                  groupData,
                  null,
                  2
                )
              );

              if (
                warningCount >= 3
              ) {

                if (
                  isBotAdmin
                ) {

                  await nazu.groupParticipantsUpdate(
                    from,
                    [sender],
                    'remove'
                  );

                  delete groupData
                    .warnings[
                    sender
                  ];

                  fs.writeFileSync(
                    groupFilePath,
                    JSON.stringify(
                      groupData,
                      null,
                      2
                    )
                  );

                  await reply(
                    `🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar links de grupos e foi removido.`,
                    {
                      mentions: [
                        sender
                      ]
                    }
                  );

                } else {

                  await reply(
                    `⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`,
                    {
                      mentions: [
                        sender
                      ]
                    }
                  );

                }

              } else {

                await reply(
                  `⚠️ @${getUserName(sender)} recebeu uma advertência por enviar links.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`,
                  {
                    mentions: [
                      sender
                    ]
                  }
                );

              }

              return;

            }

            // REMOVER DIRETO (modo antigo)
            if (
              isBotAdmin
            ) {

              await nazu.groupParticipantsUpdate(
                from,
                [sender],
                'remove'
              );

              await reply(
                `🔗 @${getUserName(sender)}, links de outros grupos não são permitidos. Você foi removido do grupo.`,
                {
                  mentions: [
                    sender
                  ]
                }
              );

            } else {

              await reply(
                `🔗 Atenção @${getUserName(sender)}! Links de outros grupos não são permitidos. Não consigo remover você, mas a mensagem foi apagada.`,
                {
                  mentions: [
                    sender
                  ]
                }
              );

            }

            return;

          }

        } catch (error) {

          console.error(
            "Erro no sistema antilink de grupos:",
            error
          );

        }

      }
    }
    if (isGroup && isAntiLinkCanal && !isGroupAdmin && !isParceiro) {
      if (!isUserWhitelisted(sender, 'antilinkcanal')) {
        let foundChannelLink = false;
        try {
          if (budy2.includes('whatsapp.com/channel/')) {
            foundChannelLink = true;
          }
          if (!foundChannelLink && info.message?.requestPaymentMessage) {
            const paymentText = info.message.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text || '';
            if (paymentText.includes('whatsapp.com/channel/')) {
              foundChannelLink = true;
            }
          }
          if (foundChannelLink) {
            if (isOwner) return;
            if (!AllgroupMembers.includes(sender)) return;

            const canalGroupFilePath = buildGroupFilePath(from);
            let canalGroupData = fs.existsSync(canalGroupFilePath) ? JSON.parse(fs.readFileSync(canalGroupFilePath)) : {};
            canalGroupData.warnings = canalGroupData.warnings || {};

            try {
              await nazu.sendMessage(from, {
                delete: {
                  remoteJid: from,
                  fromMe: false,
                  id: info.key.id,
                  participant: sender
                }
              });
            } catch { }

            if (canalGroupData.modoADV) {
              canalGroupData.warnings[sender] = canalGroupData.warnings[sender] || [];
              canalGroupData.warnings[sender].push({
                reason: 'Envio de link de canal',
                timestamp: Date.now(),
                issuer: botNumber
              });
              const warningCount = canalGroupData.warnings[sender].length;
              fs.writeFileSync(canalGroupFilePath, JSON.stringify(canalGroupData, null, 2));
              if (warningCount >= 3) {
                if (isBotAdmin) {
                  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                  delete canalGroupData.warnings[sender];
                  fs.writeFileSync(canalGroupFilePath, JSON.stringify(canalGroupData, null, 2));
                  await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar links de canais e foi removido.`, { mentions: [sender] });
                } else {
                  await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
                }
              } else {
                await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar link de canal.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
              }
              return;
            }

            if (isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              await reply(`📢 @${getUserName(sender)}, links de canais não são permitidos. Você foi removido do grupo.`, { mentions: [sender] });
            } else {
              await reply(`📢 Atenção, @${getUserName(sender)}! Links de canais não são permitidos. Não consigo remover você, mas evite compartilhar esses links.`, { mentions: [sender] });
            }
            return;
          }
        } catch (error) {
          console.error("Erro no sistema antilink de canais:", error);
        }
      }
    }
    if (isGroup && isAntiLinkSoft && !isGroupAdmin && !isParceiro && budy2.includes('http') && !isOwner) {
      if (!isUserWhitelisted(sender, 'antilinksoft')) {
        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });

          if (groupData.modoADV) {
            groupData.warnings = groupData.warnings || {};
            groupData.warnings[sender] = groupData.warnings[sender] || [];
            groupData.warnings[sender].push({
              reason: 'Envio de link (soft)',
              timestamp: Date.now(),
              issuer: botNumber
            });
            const warningCount = groupData.warnings[sender].length;
            const softGroupFilePath = buildGroupFilePath(from);
            fs.writeFileSync(softGroupFilePath, JSON.stringify(groupData, null, 2));
            if (warningCount >= 3) {
              if (isBotAdmin) {
                await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                delete groupData.warnings[sender];
                fs.writeFileSync(softGroupFilePath, JSON.stringify(groupData, null, 2));
                await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar links e foi removido.`, { mentions: [sender] });
              } else {
                await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
              }
            } else {
              await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar link.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
            }
          }

          return;
        } catch (error) {
          console.error("Erro no sistema antilinksoft:", error);
        }
      }
    }
    // AntiLink Hard - Remove qualquer link compartilhado
    if (isGroup && groupData.antilinkhard && !isGroupAdmin && !isOwner && !isParceiro) {
      const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9-]+\.(com|net|org|gov|edu|br|io|gg|dev|xyz|app|co|me)(\/[^\s]*)?)/gi;
      const hasLink = linkRegex.test(budy2);

      if (hasLink && !isUserWhitelisted(sender, 'antilinkhard')) {
        try {
          const hardGroupFilePath = buildGroupFilePath(from);
          let hardGroupData = fs.existsSync(hardGroupFilePath) ? JSON.parse(fs.readFileSync(hardGroupFilePath)) : {};
          hardGroupData.warnings = hardGroupData.warnings || {};

          try {
            await nazu.sendMessage(from, {
              delete: {
                remoteJid: from,
                fromMe: false,
                id: info.key.id,
                participant: sender
              }
            });
          } catch { }

          if (hardGroupData.modoADV) {
            hardGroupData.warnings[sender] = hardGroupData.warnings[sender] || [];
            hardGroupData.warnings[sender].push({
              reason: 'Envio de link',
              timestamp: Date.now(),
              issuer: botNumber
            });
            const warningCount = hardGroupData.warnings[sender].length;
            fs.writeFileSync(hardGroupFilePath, JSON.stringify(hardGroupData, null, 2));
            if (warningCount >= 3) {
              if (isBotAdmin) {
                await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                delete hardGroupData.warnings[sender];
                fs.writeFileSync(hardGroupFilePath, JSON.stringify(hardGroupData, null, 2));
                await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar links e foi removido.`, { mentions: [sender] });
              } else {
                await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
              }
            } else {
              await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar link.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
            }
            return;
          }

          if (isBotAdmin) {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🔗 @${getUserName(sender)}, links não são permitidos. Você foi removido do grupo.`, { mentions: [sender] });
          } else {
            await reply(`🔗 Atenção, @${getUserName(sender)}! Links não são permitidos. Não consigo remover você, mas evite enviar links.`, { mentions: [sender] });
          }
          return;
        } catch (error) {
          console.error("Erro no sistema antilink hard:", error);
        }
      }
    }



    if (isGroup && groupData.antistickerplus && !isGroupAdmin && !isOwner && !isParceiro && info?.message) {
      try {

        const msg = info.message;

        const stickerMsg =
          msg?.stickerMessage ||
          msg?.lottieStickerMessage?.message?.stickerMessage ||
          msg?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage ||
          msg?.extendedTextMessage?.contextInfo?.quotedMessage?.lottieStickerMessage?.message?.stickerMessage;

        if (stickerMsg && stickerMsg?.isLottie === true) {

          if (groupData.antistickerplus_apagar || groupData.antistickerplus_remover) {
            try {
              await nazu.sendMessage(from, {
                delete: {
                  remoteJid: from,
                  fromMe: false,
                  id: info.key.id,
                  participant: sender
                }
              });
            } catch { }
          }

          if (groupData.antistickerplus_remover) {
            const spGroupFilePath = buildGroupFilePath(from);
            let spGroupData = fs.existsSync(spGroupFilePath) ? JSON.parse(fs.readFileSync(spGroupFilePath)) : {};
            spGroupData.warnings = spGroupData.warnings || {};

            if (spGroupData.modoADV) {
              spGroupData.warnings[sender] = spGroupData.warnings[sender] || [];
              spGroupData.warnings[sender].push({
                reason: 'Envio de figurinha plus',
                timestamp: Date.now(),
                issuer: botNumber
              });
              const warningCount = spGroupData.warnings[sender].length;
              fs.writeFileSync(spGroupFilePath, JSON.stringify(spGroupData, null, 2));
              if (warningCount >= 3) {
                if (isBotAdmin) {
                  await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                  delete spGroupData.warnings[sender];
                  fs.writeFileSync(spGroupFilePath, JSON.stringify(spGroupData, null, 2));
                  await reply(`🚫 @${getUserName(sender)} atingiu *3/3 advertências* por enviar figurinhas plus e foi removido.`, { mentions: [sender] });
                } else {
                  await reply(`⚠️ @${getUserName(sender)} atingiu *3/3 advertências*, porém preciso ser administrador para remover.`, { mentions: [sender] });
                }
              } else {
                await reply(`⚠️ @${getUserName(sender)} recebeu uma advertência por enviar figurinha plus.\n\n📊 Advertências: *${warningCount}/3*\n🚫 Ao atingir *3/3* será removido automaticamente.`, { mentions: [sender] });
              }
            } else {
              await reply(
                `🚫 @${getUserName(sender)}, este grupo não permite esse tipo de figurinha do whatsapp plus.`,
                { mentions: [sender] }
              );
              if (isBotAdmin) {
                await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              }
            }
          }

        }

      } catch (err) {
        console.error("[AntiStickerPlus] Erro:", err);
      }
    }

    const botStateFile = pathz.join(DATABASE_DIR, 'botState.json');
    if (botState.status === 'off' && !isOwner) return;
    if (botState.viewMessages) nazu.readMessages([info.key]);
    try {
      if (budy2 && budy2.length > 1) {
        const timestamp = new Date().toLocaleTimeString('pt-BR', {
          hour12: false,
          timeZone: 'America/Sao_Paulo'
        });
        const messageType = isCmd ? 'COMANDO' : 'MENSAGEM';
        const context = isGroup ? 'GRUPO' : 'PRIVADO';
        const messagePreview = isCmd ? `${prefix}${command}${q ? ` ${q.substring(0, 25)}${q.length > 25 ? '...' : ''}` : ''}` : budy2.substring(0, 35) + (budy2.length > 35 ? '...' : '');
        console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
        console.log(`┃ ${messageType} [${context}]${' '.repeat(36 - messageType.length - context.length)}`);
        console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
        console.log(`┃ 📜 Conteúdo: ${messagePreview.padEnd(28)}`);
        if (isGroup) {
          console.log(`┃ 👥 Grupo: ${(groupName || 'Desconhecido').padEnd(28)}`);
          console.log(`┃ 👤 Usuário: ${(pushname || 'Sem Nome').padEnd(28)}`);
        } else {
          console.log(`┃ 👤 Usuário: ${(pushname || 'Sem Nome').padEnd(28)}`);
          console.log(`┃ 📱 Número: ${getUserName(sender).padEnd(28)}`);
        }
        console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
        console.log(`┃ 🕒 Data/Hora: ${timestamp.padEnd(27)}`);
        console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
      }
    } catch (error) {
      console.error('┃ 🚨 Erro ao gerar logs:', error, '');
    }


    if (isGroup) {
      try {
        if (relationshipManager && relationshipManager.hasPendingRequest && relationshipManager.processResponse) {
          try {
            if (relationshipManager.hasPendingRequest(from) && body) {
              const relResponse = relationshipManager.processResponse(from, sender, body);
              if (relResponse) {
                if (relResponse.success && relResponse.message) {
                  await nazu.sendMessage(from, {
                    text: relResponse.message,
                    mentions: relResponse.mentions || []
                  });
                }
              }
            }

            if (relationshipManager.hasPendingBetrayal && relationshipManager.processBetrayalResponse) {
              if (relationshipManager.hasPendingBetrayal(from) && body) {
                const betrayalResponse = relationshipManager.processBetrayalResponse(from, sender, body, groupPrefix);
                if (betrayalResponse) {
                  if (betrayalResponse.success && betrayalResponse.message) {
                    await nazu.sendMessage(from, {
                      text: betrayalResponse.message,
                      mentions: betrayalResponse.mentions || []
                    });
                  }
                }
              }
            }
          } catch (relError) {
            console.warn('[RELATIONSHIP] Error processing relationship response:', relError.message);
          }
        }

        if (tictactoe.hasPendingInvitation(from) && budy2) {
          const normalizedResponse = budy2.toLowerCase().trim();
          const result = tictactoe.processInvitationResponse(from, sender, normalizedResponse);
          if (result.success) {
            await nazu.sendMessage(from, {
              text: result.message,
              mentions: result.mentions || []
            });
          }
        }
        if (tictactoe.hasActiveGame(from) && budy2) {
          if (['tttend', 'rv', 'fimjogo'].includes(budy2)) {
            if (!isGroupAdmin) {
              await reply("⚠️ Apenas administradores podem encerrar um jogo da velha em andamento.");
              return;
            }
            const result = tictactoe.endGame(from);
            await reply(result.message);
            return;
          }
          const position = parseInt(budy2.trim());
          if (!isNaN(position)) {
            const result = tictactoe.makeMove(from, sender, position);
            if (result.success) {
              await nazu.sendMessage(from, {
                text: result.message,
                mentions: result.mentions || [sender]
              });
            } else if (result.message) {
              await reply(result.message);
            }
          }
          return;
        }

        if (connect4 && connect4.hasPendingInvitation && connect4.hasPendingInvitation(from) && budy2) {
          const normalizedResponse = budy2.toLowerCase().trim();
          const result = connect4.processInvitationResponse(from, sender, normalizedResponse);
          if (result.success) {
            await nazu.sendMessage(from, {
              text: result.message,
              mentions: result.mentions || []
            });
          }
        }
        if (connect4 && connect4.hasActiveGame && connect4.hasActiveGame(from) && budy2) {
          if (['c4end', 'fimc4'].includes(budy2.toLowerCase())) {
            if (!isGroupAdmin) {
              await reply("⚠️ Apenas administradores podem encerrar um Connect4 em andamento.");
              return;
            }
            const result = connect4.endGame(from);
            await reply(result.message);
            return;
          }
          const column = parseInt(budy2.trim());
          if (!isNaN(column) && column >= 1 && column <= 7) {
            const result = connect4.makeMove(from, sender, column);
            if (result.success) {
              await nazu.sendMessage(from, {
                text: result.message,
                mentions: result.mentions || [sender]
              });
            } else if (result.message) {
              await reply(result.message);
            }
            return;
          }
        }
        if (antitoxic && antitoxic.isEnabled && antitoxic.isEnabled(from) && body && ia) {
          const aiFunction = (prompt) => {
            return ia.makeCognimaRequest('meta/llama-3.3-70b-instruct', prompt, null)
              .then(response => response?.data?.choices?.[0]?.message?.content || '');
          };

          antitoxic.analyzeMessage(body, aiFunction).then(toxicResult => {
            if (toxicResult.isToxic) {
              const action = antitoxic.getGroupAction ? antitoxic.getGroupAction(from) : 'avisar';
              if (action === 'apagar') {
                nazu.sendMessage(from, { delete: info.key }).then(() => {
                  nazu.sendMessage(from, {
                    text: `⚠️ @${sender.split('@')[0]}, sua mensagem foi removida por conteúdo tóxico.\n\n_Este sistema usa IA e pode cometer erros._`,
                    mentions: [sender]
                  });
                });
              } else if (action === 'avisar') {
                nazu.sendMessage(from, {
                  text: `⚠️ @${sender.split('@')[0]}, evite mensagens tóxicas!\n\n_Este sistema usa IA e pode cometer erros._`,
                  mentions: [sender]
                });
              }
            }
          }).catch(toxicErr => {
            console.warn('[ANTITOXIC] Error:', toxicErr.message);
          });
        }



        if (isGroup && antipalavra && body && !isCmd) {
          try {
            if (!antipalavra.isActive(from)) {
            } else if (!isGroupAdmin) {
              const detectionResult = antipalavra.checkMessage(from, body);

              if (detectionResult && detectionResult.detected) {
                console.log(`[ANTIPALAVRA] Palavra detectada: "${detectionResult.palavra}" de @${sender.split('@')[0]}`);

                if (!isBotAdmin) {
                  await nazu.sendMessage(from, {
                    text: `⚠️ *ANTIPALAVRA - DETECÇÃO*\n\n` +
                      `👤 @${sender.split('@')[0]} usou uma palavra proibida!\n` +
                      `⚠️ Palavra: "${detectionResult.palavra}"\n\n` +
                      `❌ Não posso banir pois não sou administrador!`,
                    mentions: [sender]
                  }).catch(err => console.error('[ANTIPALAVRA] Erro ao enviar notificação:', err.message));
                  return;
                }

                await nazu.sendMessage(from, { delete: info.key }).catch(err =>
                  console.error('[ANTIPALAVRA] Erro ao deletar mensagem:', err.message)
                );

                await nazu.groupParticipantsUpdate(from, [sender], 'remove').catch(err =>
                  console.error('[ANTIPALAVRA] Erro ao remover usuário:', err.message)
                );

                antipalavra.registerBan(from, sender, detectionResult.palavra);

                await nazu.sendMessage(from, {
                  text: `🚫 *ANTIPALAVRA - BANIMENTO AUTOMÁTICO*\n\n` +
                    `👤 Usuário: @${sender.split('@')[0]}\n` +
                    `⚠️ Palavra detectada: "${detectionResult.palavra}"\n` +
                    `🔨 Ação: Banimento automático\n\n` +
                    `_O sistema antipalavra protege este grupo._`,
                  mentions: [sender]
                }).catch(err => console.error('[ANTIPALAVRA] Erro ao enviar notificação:', err.message));

                return;
              }
            }
          } catch (antipalavraErr) {
            console.error('[ANTIPALAVRA] Erro ao processar:', antipalavraErr.message);
          }
        }
      } catch (error) {

      }
    }
    if (isGroup && groupData.blockedUsers && (groupData.blockedUsers[sender] || groupData.blockedUsers[getUserName(sender)]) && isCmd) {
      return reply(`🚫 Você não tem permissão para usar comandos neste grupo.\nMotivo: ${groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[getUserName(sender)].reason}`);
    };

    const globalBlacklist = loadGlobalBlacklist();
    if (isCmd && sender && globalBlacklist.users && (globalBlacklist.users[sender] || globalBlacklist.users[getUserName(sender)])) {
      const blacklistEntry = globalBlacklist.users[sender] || globalBlacklist.users[getUserName(sender)];
      return reply(`🚫 Você está na blacklist global e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nAdicionado por: ${blacklistEntry.addedBy}\nData: ${new Date(blacklistEntry.addedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    };

    if (isGroup && isCmd && groupData.blacklist && (groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)])) {
      const blacklistEntry = groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)];
      return reply(`🚫 Você está na blacklist deste grupo e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nData: ${new Date(blacklistEntry.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    }
    if (sender && sender.includes('@') && globalBlocks.users && (globalBlocks.users[sender] || globalBlocks.users[getUserName(sender)]) && isCmd) {
      return reply(`🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[getUserName(sender)].reason}`);
    }
    if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
      return reply(`🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${globalBlocks.commands[command].reason}`);
    }
    if (isCmd && commandStats && commandStats.trackCommandUsage && command && command.length > 0) {
      commandStats.trackCommandUsage(command, sender);
    }
    if (budy2.match(/^(\d+)d(\d+)$/)) reply(+budy2.match(/^(\d+)d(\d+)$/)[1] > 50 || +budy2.match(/^(\d+)d(\d+)$/)[2] > 100 ? "❌ Limite: max 50 dados e 100 lados" : "🎲 Rolando " + budy2.match(/^(\d+)d(\d+)$/)[1] + "d" + budy2.match(/^(\d+)d(\d+)$/)[2] + "...\n🎯 Resultados: " + (r = [...Array(+budy2.match(/^(\d+)d(\d+)$/)[1])].map(_ => 1 + Math.floor(Math.random() * +budy2.match(/^(\d+)d(\d+)$/)[2]))).join(", ") + "\n📊 Total: " + r.reduce((a, b) => a + b, 0));




    const _botShort = (nazu && nazu.user && (nazu.user.id || nazu.user.lid)) ? String((nazu.user.id || nazu.user.lid).split(':')[0]) : '';
    // Não processar pela assistente se a mensagem veio do PRO (evita loop infinito)
    if (!info.key.fromMe && isAssistente && !isCmd && !info._fromPro && ((_botShort && budy2.includes(_botShort)) || (menc_os2 && menc_os2 == botNumber))) {
      if (budy2.replaceAll('@' + _botShort, '').length > 2) {
        // Detectar tipo de mídia da mensagem atual
        const tipoMidiaAtual = info.message?.imageMessage ? 'imagem' :
          info.message?.videoMessage ? 'video' :
            info.message?.audioMessage ? 'audio' :
              info.message?.stickerMessage ? 'sticker' :
                info.message?.documentMessage ? 'documento' : null;

        // Detectar tipo de mídia marcada
        // Checar também pttMessage (mensagem de voz) que pode vir separado
        const tipoMidiaMarcada = quotedMessageContent?.imageMessage ? 'imagem' :
          quotedMessageContent?.videoMessage ? 'video' :
            quotedMessageContent?.audioMessage ? 'audio' :
              quotedMessageContent?.pttMessage ? 'audio' :
                quotedMessageContent?.stickerMessage ? 'sticker' :
                  quotedMessageContent?.documentMessage ? 'documento' : null;

        // Detectar menções na mensagem
        const mencoesNaMensagem = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Obter todos os possíveis identificadores do bot para filtrar
        const botLid = nazu.user?.lid ? nazu.user.lid.split(':')[0] : null;
        const botJid = nazu.user?.id ? nazu.user.id.split(':')[0] : null;
        const botIdentifiers = [_botShort, botLid, botJid, botNumber].filter(Boolean);


        // Filtrar menção do bot das menções (usando todos os identificadores possíveis)
        const mencoesFiltradas = mencoesNaMensagem.filter(m => {
          const mNumber = m.split('@')[0].split(':')[0]; // Pega só o número
          return !botIdentifiers.some(id => {
            const idNumber = id.split('@')[0].split(':')[0];
            return mNumber === idNumber;
          });
        });

        const primeiraMencao = mencoesFiltradas.length > 0 ? mencoesFiltradas[0] : null;

        const jSoNzIn = {
          texto: budy2.replaceAll('@' + _botShort, '').trim(),
          id_enviou: sender,
          nome_enviou: pushname,
          id_grupo: isGroup ? from : false,
          nome_grupo: isGroup ? groupName : false,
          tem_midia: isMedia,
          tipo_midia: tipoMidiaAtual,
          marcou_mensagem: false,
          marcou_sua_mensagem: false,
          mensagem_marcada: false,
          id_enviou_marcada: false,
          tem_midia_marcada: !!tipoMidiaMarcada,
          tipo_midia_marcada: tipoMidiaMarcada,
          mencoes: mencoesFiltradas,
          primeira_mencao: primeiraMencao,
          tem_mencao: mencoesFiltradas.length > 0,
          id_mensagem: info.key.id,
          data_atual: new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          }),
          data_mensagem: new Date(info.messageTimestamp * 1000).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          })
        };
        let {
          participant,
          quotedMessage
        } = info.message?.extendedTextMessage?.contextInfo || {};
        let jsonO = {
          participant,
          quotedMessage,
          texto: quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text || quotedMessage?.imageMessage?.caption || quotedMessage?.videoMessage?.caption || quotedMessage?.documentMessage?.caption || ""
        };
        if (jsonO && jsonO.participant && jsonO.texto && jsonO.texto.length > 0) {
          jSoNzIn.marcou_mensagem = true;
          jSoNzIn.mensagem_marcada = jsonO.texto;
          jSoNzIn.id_enviou_marcada = jsonO.participant;
          jSoNzIn.marcou_sua_mensagem = jsonO.participant == getBotId(nazu);
        }
        // Se marcou mensagem com mídia mas sem texto, ainda assim é marcou_mensagem
        if (jsonO && jsonO.participant && tipoMidiaMarcada && !jSoNzIn.marcou_mensagem) {
          jSoNzIn.marcou_mensagem = true;
          jSoNzIn.id_enviou_marcada = jsonO.participant;
        }

        // Add null check for ia object
        if (!ia || typeof ia.makeAssistentRequest !== 'function') {
          console.warn('[IA] makeAssistentRequest not available');
          reply('🤖 Sistema de IA temporariamente indisponível. Tente novamente em alguns minutos.');
          return;
        }

        // Obter a personalidade atual do grupo
        const personality = groupData.assistentePersonality || 'nazuna';

        // Verificar se é personalidade customizada
        let customPrompt = null;
        if (!['nazuna', 'humana', 'ia', 'pro'].includes(personality)) {
          try {
            const persFile = pathz.join(DATABASE_DIR, 'customPersonalidades.json');
            if (fs.existsSync(persFile)) {
              const persData = JSON.parse(fs.readFileSync(persFile, 'utf-8'));
              if (persData[personality] && persData[personality].prompt) {
                customPrompt = persData[personality].prompt;
              }
            }
          } catch (_) { }
        }

        ia.makeAssistentRequest({
          mensagens: [jSoNzIn]
        }, nazu, nmrdn, personality, customPrompt).then((respAssist) => {
          if (respAssist.erro === 'Sistema de IA temporariamente desativado') {
            return;
          }

          // Tratamento especial para personalidade 'pro' (interpretador de comandos)
          if (respAssist.isPro) {
            if (respAssist.isCommand && respAssist.command) {
              // Se falta algo para executar o comando, avisa o usuário
              if (respAssist.falta) {
                reply(`⚠️ Para executar *${prefix}${respAssist.command}*, preciso que você informe: ${respAssist.falta}`);
                return;
              }

              console.log(`🤖 [PRO] Comando identificado: ${respAssist.command} ${respAssist.args || ''}`);

              // Simular execução do comando reutilizando o objeto info original
              const simulatedCommand = respAssist.command.toLowerCase();
              let simulatedArgs = respAssist.args || '';

              // Obter menções originais da mensagem e filtrar a menção do bot
              const originalMentions = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

              // Usar os mesmos identificadores do bot para filtrar
              const botLidPro = nazu.user?.lid ? nazu.user.lid.split(':')[0] : null;
              const botJidPro = nazu.user?.id ? nazu.user.id.split(':')[0] : null;
              const botIdentifiersPro = [_botShort, botLidPro, botJidPro, botNumber].filter(Boolean);

              const mentionsWithoutBot = originalMentions.filter(m => {
                const mNumber = m.split('@')[0].split(':')[0];
                return !botIdentifiersPro.some(id => {
                  const idNumber = id.split('@')[0].split(':')[0];
                  return mNumber === idNumber;
                });
              });
              const targetMention = mentionsWithoutBot.length > 0 ? mentionsWithoutBot[0] : null;

              // Se não tem menção no texto, pode ter marcado mensagem de alguém (resposta)
              const quotedParticipant = info.message?.extendedTextMessage?.contextInfo?.participant;
              // Verificar se o quotedParticipant não é o próprio bot
              const isQuotedBot = quotedParticipant ? botIdentifiersPro.some(id => {
                const idNumber = id.split('@')[0].split(':')[0];
                const qNumber = quotedParticipant.split('@')[0].split(':')[0];
                return qNumber === idNumber;
              }) : true;
              const mentionOrQuoted = targetMention || (quotedParticipant && !isQuotedBot ? quotedParticipant : null);

              console.log(`🤖 [PRO] Menções originais: ${JSON.stringify(originalMentions)}`);
              console.log(`🤖 [PRO] Menções sem bot: ${JSON.stringify(mentionsWithoutBot)}`);
              console.log(`🤖 [PRO] Target menção: ${targetMention}`);
              console.log(`🤖 [PRO] Quoted participant: ${quotedParticipant}`);
              console.log(`🤖 [PRO] Menção ou quoted final: ${mentionOrQuoted}`);

              // Lista de comandos que precisam de menção (@user)
              const commandsNeedMention = ['ban', 'ban2', 'kick', 'promover', 'rebaixar', 'mute', 'desmute',
                'mute2', 'desmute2', 'adv', 'rmadv', 'userinfo', 'perfil', 'rep', 'presente', 'denunciar',
                'blockuser', 'unblockuser', 'addblacklist', 'delblacklist', 'addmod', 'delmod'];

              // Se o comando precisa de menção e temos uma menção/quoted, adiciona ao args
              if (commandsNeedMention.includes(simulatedCommand) && mentionOrQuoted && !simulatedArgs.includes('@')) {
                // Adicionar a menção ao início dos argumentos
                const mentionNumber = mentionOrQuoted.split('@')[0];
                simulatedArgs = `@${mentionNumber} ${simulatedArgs}`.trim();
              }

              const simulatedBody = `${prefix}${simulatedCommand} ${simulatedArgs}`.trim();

              // Clonar o objeto info original mantendo estrutura completa
              const fakeMessage = JSON.parse(JSON.stringify(info));

              // Atualizar timestamp para o momento atual
              fakeMessage.messageTimestamp = Math.floor(Date.now() / 1000);

              // Marcar como mensagem processada pelo PRO para evitar loop infinito
              fakeMessage._fromPro = true;

              // Determinar o tipo de mídia original para preservar
              const hasImage = !!info.message?.imageMessage;
              const hasVideo = !!info.message?.videoMessage;
              const hasAudio = !!info.message?.audioMessage;
              const hasDocument = !!info.message?.documentMessage;
              const hasSticker = !!info.message?.stickerMessage;
              const hasQuotedImage = !!quotedMessageContent?.imageMessage;
              const hasQuotedVideo = !!quotedMessageContent?.videoMessage;
              const hasQuotedAudio = !!quotedMessageContent?.audioMessage;
              const hasQuotedSticker = !!quotedMessageContent?.stickerMessage;
              const hasQuotedDocument = !!quotedMessageContent?.documentMessage;

              // Preservar contexto de mídia e menções
              if (fakeMessage.message) {
                // Se tem imagem com legenda, preservar imagem e mudar legenda
                if (hasImage && fakeMessage.message.imageMessage) {
                  fakeMessage.message.imageMessage.caption = simulatedBody;
                  // Limpar outros tipos de mensagem de texto
                  delete fakeMessage.message.conversation;
                  delete fakeMessage.message.extendedTextMessage;
                }
                // Se tem vídeo com legenda, preservar vídeo e mudar legenda
                else if (hasVideo && fakeMessage.message.videoMessage) {
                  fakeMessage.message.videoMessage.caption = simulatedBody;
                  delete fakeMessage.message.conversation;
                  delete fakeMessage.message.extendedTextMessage;
                }
                // Se tem áudio, preservar áudio e adicionar comando como extendedTextMessage
                else if (hasAudio && fakeMessage.message.audioMessage) {
                  // Áudio não tem caption, então criamos extendedTextMessage junto
                  fakeMessage.message.extendedTextMessage = {
                    text: simulatedBody,
                    contextInfo: info.message?.extendedTextMessage?.contextInfo || {}
                  };
                  delete fakeMessage.message.conversation;
                }
                // Se tem documento, preservar e mudar caption
                else if (hasDocument && fakeMessage.message.documentMessage) {
                  fakeMessage.message.documentMessage.caption = simulatedBody;
                  delete fakeMessage.message.conversation;
                  delete fakeMessage.message.extendedTextMessage;
                }
                // Se tem sticker, preservar sticker e adicionar texto
                else if (hasSticker && fakeMessage.message.stickerMessage) {
                  const stickerMentions = (info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])
                    .filter(m => m !== botNumber && !m.includes(_botShort));
                  // Adicionar menção do alvo se não estiver na lista
                  if (mentionOrQuoted && !stickerMentions.includes(mentionOrQuoted)) {
                    stickerMentions.push(mentionOrQuoted);
                  }
                  fakeMessage.message.extendedTextMessage = {
                    text: simulatedBody,
                    contextInfo: {
                      ...info.message?.extendedTextMessage?.contextInfo,
                      mentionedJid: stickerMentions
                    }
                  };
                  delete fakeMessage.message.conversation;
                }
                // Se tem mensagem marcada com mídia, preservar o contextInfo
                else if (info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                  const originalContext = info.message.extendedTextMessage.contextInfo;
                  // Filtrar menção do bot e adicionar menção do alvo
                  const quotedMentions = (originalContext.mentionedJid || [])
                    .filter(m => m !== botNumber && !m.includes(_botShort));
                  // Se temos um alvo e ele não está na lista, adiciona
                  if (mentionOrQuoted && !quotedMentions.includes(mentionOrQuoted)) {
                    quotedMentions.push(mentionOrQuoted);
                  }
                  fakeMessage.message.extendedTextMessage = {
                    text: simulatedBody,
                    contextInfo: {
                      ...originalContext,
                      // Preservar menções filtradas + alvo
                      mentionedJid: quotedMentions,
                      // Preservar mensagem marcada
                      quotedMessage: originalContext.quotedMessage,
                      participant: originalContext.participant,
                      stanzaId: originalContext.stanzaId
                    }
                  };
                  delete fakeMessage.message.conversation;
                  delete fakeMessage.message.imageMessage;
                  delete fakeMessage.message.videoMessage;
                  delete fakeMessage.message.audioMessage;
                  delete fakeMessage.message.documentMessage;
                  delete fakeMessage.message.stickerMessage;
                }
                // Mensagem de texto simples
                else {
                  // Preservar menções se existirem (sem a menção do bot)
                  const mentionedJid = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                  const filteredMentions = mentionedJid.filter(m => m !== botNumber && !m.includes(_botShort));

                  // Se temos menção de um alvo (não bot), adicionar ao mentionedJid
                  const targetMentionsForContext = mentionOrQuoted && !filteredMentions.includes(mentionOrQuoted)
                    ? [...filteredMentions, mentionOrQuoted]
                    : filteredMentions;

                  if (targetMentionsForContext.length > 0) {
                    fakeMessage.message.extendedTextMessage = {
                      text: simulatedBody,
                      contextInfo: {
                        mentionedJid: targetMentionsForContext
                      }
                    };
                    delete fakeMessage.message.conversation;
                  } else {
                    fakeMessage.message.conversation = simulatedBody;
                    delete fakeMessage.message.extendedTextMessage;
                  }

                  delete fakeMessage.message.imageMessage;
                  delete fakeMessage.message.videoMessage;
                  delete fakeMessage.message.audioMessage;
                  delete fakeMessage.message.documentMessage;
                  delete fakeMessage.message.stickerMessage;
                }
              } else {
                fakeMessage.message = { conversation: simulatedBody };
              }

              // Feedback visual antes de executar
              const mediaInfo = hasImage ? '🖼️' : hasVideo ? '🎬' : hasAudio ? '🎵' : hasSticker ? '🎭' :
                hasQuotedImage ? '🖼️ (marcado)' : hasQuotedVideo ? '🎬 (marcado)' :
                  hasQuotedAudio ? '🎵 (marcado)' : hasQuotedSticker ? '🎭 (marcado)' : '';

              nazu.sendMessage(from, {
                text: `🤖 *Executando:* ${prefix}${simulatedCommand}${simulatedArgs ? ' ' + simulatedArgs : ''}${mediaInfo ? '\n📎 Mídia: ' + mediaInfo : ''}`
              }, { quoted: info }).then(() => {
                // Emitir novamente o evento de mensagem com o objeto completo
                nazu.ev.emit('messages.upsert', {
                  messages: [fakeMessage],
                  type: 'notify'
                });
              });
            }
            // Se não é comando, não responde nada (comportamento esperado do pro)
            return;
          }

          if (respAssist.resp && Array.isArray(respAssist.resp) && respAssist.resp.length > 0) {
            const processResponses = (index) => {
              if (index >= respAssist.resp.length) return;
              const msgza = respAssist.resp[index];
              const processNext = () => processResponses(index + 1);

              if (msgza && msgza.react) {
                nazu.react(msgza.react.replaceAll(' ', '').replaceAll('\n', ''), {
                  key: info.key
                }).then(() => {
                  if (msgza.resp && typeof msgza.resp === 'string' && msgza.resp.length > 0) {
                    reply(msgza.resp).then(processNext);
                  } else {
                    processNext();
                  }
                }).catch(err => {
                  console.error('Erro ao reagir:', err);
                  if (msgza.resp && typeof msgza.resp === 'string' && msgza.resp.length > 0) {
                    reply(msgza.resp).then(processNext);
                  } else {
                    processNext();
                  }
                });
              } else if (msgza && msgza.resp && typeof msgza.resp === 'string' && msgza.resp.length > 0) {
                reply(msgza.resp).then(processNext);
              } else {
                console.warn(`⚠️ [${personality}] Resposta inválida no índice ${index}:`, JSON.stringify(msgza));
                processNext();
              }
            };
            processResponses(0);
          } else {
            console.warn(`⚠️ [${personality}] Nenhuma resposta válida retornada pela IA. respAssist.resp:`, respAssist.resp);
          }
        }).catch((assistentError) => {
          console.error('Erro no assistente virtual:', assistentError.message);
          reply('🤖 Erro técnico no assistente virtual. Tente novamente em alguns minutos.');
        });
      }
    }



    //ANTI FLOOD DE MENSAGENS
    if (isGroup && groupData.messageLimit?.enabled && !isGroupAdmin && !isOwnerOrSub && !info.key.fromMe) {
      try {
        groupData.messageLimit.warnings = groupData.messageLimit.warnings || {};
        groupData.messageLimit.users = groupData.messageLimit.users || {};
        const now = Date.now();
        const userData = groupData.messageLimit.users[sender] || {
          count: 0,
          lastReset: now
        };
        if (now - userData.lastReset >= groupData.messageLimit.interval * 1000) {
          userData.count = 0;
          userData.lastReset = now;
        }
        userData.count++;
        groupData.messageLimit.users[sender] = userData;
        if (userData.count > groupData.messageLimit.limit) {
          if (groupData.messageLimit.action === 'ban' && isBotAdmin) {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s!`, {
              mentions: [sender]
            });
            delete groupData.messageLimit.users[sender];
          } else if (groupData.messageLimit.action === 'adv') {
            groupData.messageLimit.warnings[sender] = (groupData.messageLimit.warnings[sender] || 0) + 1;
            const warnings = groupData.messageLimit.warnings[sender];
            if (warnings >= 3 && isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de mensagens (${groupData.messageLimit.limit} em ${groupData.messageLimit.interval}s) 3 vezes!`, {
                mentions: [sender]
              });
              delete groupData.messageLimit.warnings[sender];
              delete groupData.messageLimit.users[sender];
            } else {
              await reply(`⚠️ @${getUserName(sender)}, você excedeu o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s! Advertência ${warnings}/3.`, {
                mentions: [sender]
              });
            }
          }
        }
        writeJsonFile(groupFile, groupData);
        // Otimização: Invalida cache quando groupData é salvo
        if (isGroup) {
          optimizer.invalidateGroup(from);
        }
      } catch (e) {
        console.error("Erro no sistema de limite de mensagens:", e);
      }
    }
    //SISTEMA DE PARCERIA
    if (isGroup && parceriasData.active && !isGroupAdmin && body.includes('chat.whatsapp.com') && !info.key.fromMe) {
      if (parceriasData.partners[sender]) {
        const partnerData = parceriasData.partners[sender];
        if (partnerData.count < partnerData.limit) {
          partnerData.count++;
          saveParceriasData(from, parceriasData);
        } else {
          await nazu.sendMessage(from, {
            delete: info.key
          });
          await reply(`@${getUserName(sender)}, você atingiu o limite de ${partnerData.limit} links de grupos.`, {
            mentions: [sender]
          });
        }
      } else {
        await nazu.sendMessage(from, {
          delete: info.key
        });
        await reply(`@${getUserName(sender)}, você não é um parceiro e não pode enviar links de grupos.`, {
          mentions: [sender]
        });
      }
    }
    //ANTI FIGURINHAS
    if (isGroup && groupData.antifig && groupData.antifig.enabled && type === "stickerMessage" && !isGroupAdmin && !info.key.fromMe) {
      if (!isUserWhitelisted(sender, 'antifig')) {
        try {
          await nazu.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: info.key.id,
              participant: sender
            }
          });
          groupData.warnings = groupData.warnings || {};
          groupData.warnings[sender] = groupData.warnings[sender] || {
            count: 0,
            lastWarned: null
          };
          groupData.warnings[sender].count += 1;
          groupData.warnings[sender].lastWarned = new Date().toISOString();
          const warnCount = groupData.warnings[sender].count;
          const warnLimit = groupData.antifig.warnLimit || 3;
          let warnMessage = `🚫 @${getUserName(sender)}, figurinhas não são permitidas neste grupo! Advertência ${warnCount}/${warnLimit}.`;
          if (warnCount >= warnLimit && isBotAdmin) {
            warnMessage += `\n⚠️ Você atingiu o limite de advertências e será removido.`;
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            delete groupData.warnings[sender];
          }
          await nazu.sendMessage(from, {
            text: warnMessage,
            mentions: [sender]
          });
          writeJsonFile(groupFile, groupData);
          // Otimização: Invalida cache quando groupData é salvo
          if (isGroup) {
            optimizer.invalidateGroup(from);
          }
        } catch (error) {
          console.error("Erro no sistema antifig:", error);
          await reply(`⚠️ Erro ao processar antifig para @${getUserName(sender)}. Administradores, verifiquem!`, {
            mentions: [sender]
          });
        }
      }
    }
    if (!isCmd) {
      // Se modo soadm ativo e não é admin, ignorar comandos sem prefixo silenciosamente
      if (isGroup && isOnlyAdmin && !isGroupAdmin && !isOwner) {
        // Não processar comandos sem prefixo para não-admins quando soadm está ativo
      } else {
        // Otimização: Cache de comandos sem prefixo
        const noPrefixCommands = await optimizer.memoize(
          `noprefix:${from}`,
          () => Promise.resolve(loadNoPrefixCommands()),
          10000 // 10 segundos
        );
        // Otimização: Usar regex pré-compilada para split
        const splitRegex = optimizer.getRegex('commandSplit') || /\s+/;
        const firstWord = budy2.split(splitRegex)[0]?.trim();
        const matchedCommand = noPrefixCommands.find(item => firstWord === item.trigger);
        if (matchedCommand) {
          var command = matchedCommand.command;
          var isCmd = true;
          const bodyParts = body.trim().split(/ +/);
          const dynamicArgs = bodyParts.slice(1);
          const fixedParams = matchedCommand.fixedParams || '';
          const allParams = fixedParams ? (fixedParams + (dynamicArgs.length > 0 ? ' ' + dynamicArgs.join(' ') : '')) : dynamicArgs.join(' ');
          args.length = 0;
          if (allParams) {
            args.push(...allParams.split(/ +/));
          }
          q = allParams;
        }
      }
    }

    // Verificar comandos personalizados do dono
    if (isCmd && command) {
      // Otimização: Normalização otimizada
      const normalizedTrigger = optimizer.normalizeCommand(command) || normalizar(command);
      // Otimização: Cache de comandos personalizados
      const customCmd = await optimizer.memoize(
        `customcmd:${from}:${normalizedTrigger}`,
        () => Promise.resolve(findCustomCommand(normalizedTrigger)),
        5000 // 5 segundos
      );
      if (customCmd) {
        try {
          const responseData = customCmd.response;
          const settings = customCmd.settings || {};

          // Verificações de permissão/contexto
          if (settings.ownerOnly && !isOwner) {
            return reply('🚫 Este comando só pode ser usado pelo dono do bot.');
          }
          if (settings.adminOnly && !isGroup) {
            return reply('🚫 Este comando só pode ser usado por admins do grupo (em grupos apenas).');
          }
          if (settings.adminOnly && isGroup && !isGroupAdmin) {
            return reply('🚫 Este comando só pode ser usado por admins do grupo.');
          }
          if (settings.context === 'group' && !isGroup) {
            return reply('⚠️ Este comando está restrito a grupos.');
          }
          if (settings.context === 'private' && isGroup) {
            return reply('⚠️ Este comando está restrito ao privado.');
          }

          // Verificar parâmetros obrigatórios e tipos (baseado na ordem)
          const allArgsCheck = q || '';
          let argsListCheck = parseArgsFromString(allArgsCheck);
          if (Array.isArray(settings.params) && settings.params.length) {
            // Handle rest params: if last param has rest: true, capture remainder
            const restIndex = settings.params.findIndex(p => p.rest);
            if (restIndex !== -1 && restIndex < settings.params.length) {
              if (argsListCheck.length > restIndex) {
                const restVal = argsListCheck.slice(restIndex).join(' ');
                argsListCheck = argsListCheck.slice(0, restIndex);
                argsListCheck[restIndex] = restVal;
              }
            }
            const missing = [];
            for (let i = 0; i < settings.params.length; i++) {
              const p = settings.params[i];
              let val = typeof argsListCheck[i] !== 'undefined' ? argsListCheck[i] : '';
              if ((val === '' || typeof val === 'undefined') && typeof p.default !== 'undefined') {
                val = p.default;
                argsListCheck[i] = val;
              }
              if (p.required && (typeof val === 'undefined' || val === '')) missing.push(p.name);
              if (typeof val !== 'undefined' && val !== '') {
                const check = validateParamValue(val, p);
                if (!check.ok) {
                  return reply(`❌ Parâmetro inválido: ${check.message}`);
                }
              }
            }
            if (missing.length) {
              const usage = customCmd.usage || buildUsageFromParams(customCmd.trigger, settings.params);
              return reply(`❌ Parâmetros obrigatórios ausentes: ${missing.join(', ')}\nUso: ${usage}`);
            }
          }

          // Substituir parâmetros (posicionais e por nome)
          let processedResponse = responseData;
          const allArgs = q || '';
          let argsList = typeof argsListCheck !== 'undefined' ? argsListCheck : parseArgsFromString(allArgs);
          // Support named args like key=value
          if (Array.isArray(argsList) && argsList.some(t => t.includes('='))) {
            const namedMap = {};
            const remainingPositional = [];
            for (const t of argsList) {
              const idxEq = t.indexOf('=');
              if (idxEq > 0) {
                const k = normalizar(t.slice(0, idxEq)).replace(/\s+/g, '_');
                const v = t.slice(idxEq + 1);
                namedMap[k] = v;
              } else {
                remainingPositional.push(t);
              }
            }
            const remArgs = [];
            if (Array.isArray(settings.params) && settings.params.length) {
              for (let i = 0; i < settings.params.length; i++) {
                const p = settings.params[i];
                const nm = p.name;
                if (Object.prototype.hasOwnProperty.call(namedMap, nm)) {
                  remArgs[i] = namedMap[nm];
                } else {
                  remArgs[i] = remainingPositional.length ? remainingPositional.shift() : '';
                }
              }
            } else {
              // no param meta, just keep positional
              remArgs.push(...remainingPositional);
            }
            // handle rest param capturing: if rest param found as last
            const restIndexLocal = (settings.params || []).findIndex(p => p.rest);
            if (restIndexLocal !== -1 && restIndexLocal < remArgs.length) {
              const restVal = remArgs.slice(restIndexLocal).join(' ');
              remArgs.splice(restIndexLocal, remArgs.length - restIndexLocal, restVal);
            }
            argsList = remArgs;
          }
          if (typeof processedResponse === 'string') {
            processedResponse = processedResponse
              .replace(/{prefixo}/gi, groupPrefix)
              .replace(/{prefix}/gi, groupPrefix)
              .replace(/{nomedono}/gi, nomedono)
              .replace(/{numerodono}/gi, numerodono)
              .replace(/{nomebot}/gi, nomebot)
              .replace(/{user}/gi, pushname || 'Usuário')
              .replace(/{grupo}/gi, isGroup ? groupName : 'Privado');

            // Parâmetros avançados: args, posição, named params e menções
            const allArgs = q || '';
            // re-use processed argsList from validation phase if available (argsListCheck), otherwise parse
            let argsList = typeof argsListCheck !== 'undefined' ? argsListCheck : parseArgsFromString(allArgs);
            // Map named params for replacement
            const paramsMap = {};
            if (Array.isArray(settings.params)) {
              for (let i = 0; i < settings.params.length; i++) {
                const p = settings.params[i];
                paramsMap[p.name] = argsList[i] || '';
              }
            }
            // {args} | {all}
            processedResponse = processedResponse.replace(/\{(?:args|all)\}/gi, allArgs);
            // {1}, {2}, ... (1-based index)
            processedResponse = processedResponse.replace(/\{(\d+)\}/g, (m, idx) => {
              const i = parseInt(idx, 10) - 1;
              return argsList[i] || '';
            });
            // Named parameters replacement: {name}
            for (const nm in paramsMap) {
              if (!Object.prototype.hasOwnProperty.call(paramsMap, nm)) continue;
              const val = paramsMap[nm];
              if (typeof val === 'undefined' || val === '') continue;
              try {
                const re = new RegExp('\\{' + escapeRegExp(nm) + '\\}', 'gi');
                processedResponse = processedResponse.replace(re, val);
              } catch (err) {
                console.warn('Warn: Invalid param name during regex replace:', nm, err.message);
              }
            }
            // mentions: {mention} -> first mentioned, {mentions} -> all mentioned
            const mentionedJids = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let mentionsToInclude = Array.isArray(mentionedJids) ? mentionedJids : [];
            // fallback to menc_os2 (participant/quoted participant) when no explicit mentions
            if (!mentionsToInclude.length && typeof menc_os2 !== 'undefined' && menc_os2) {
              mentionsToInclude = [menc_os2];
            }
            const mentionText = mentionsToInclude.length > 0 ? mentionsToInclude.map(m => '@' + getUserName(m)).join(' ') : '';
            processedResponse = processedResponse.replace(/\{mention\}/gi, mentionText);
            processedResponse = processedResponse.replace(/\{mentions\}/gi, mentionText);
            // quoted
            const quotedText = (quotedMessageContent && (quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text)) || '';
            processedResponse = processedResponse.replace(/\{quoted\}/gi, quotedText);
            // placeholders adicionais
            const groupDescValue = (groupMetadata && groupMetadata.desc) ? groupMetadata.desc : '';
            const latency = info?.messageTimestamp ? ((Date.now() - info.messageTimestamp * 1000) / 1000).toFixed(3) : null;
            if (groupDescValue) {
              processedResponse = processedResponse.replace(/\{(?:groupdesc|descricao|desc)\}/gi, groupDescValue);
            }
            if (latency !== null) {
              processedResponse = processedResponse.replace(/\{(?:velocidade|speed|latency)\}/gi, `${latency}s`);
            }
          } else if (processedResponse && typeof processedResponse === 'object') {
            if (processedResponse.caption) {
              processedResponse.caption = processedResponse.caption
                .replace(/{prefixo}/gi, groupPrefix)
                .replace(/{prefix}/gi, groupPrefix)
                .replace(/{nomedono}/gi, nomedono)
                .replace(/{numerodono}/gi, numerodono)
                .replace(/{nomebot}/gi, nomebot)
                .replace(/{user}/gi, pushname || 'Usuário')
                .replace(/{grupo}/gi, isGroup ? groupName : 'Privado');
              // placeholders extras para legenda
              const argsListC = argsList;
              const paramsMapC = {};
              if (Array.isArray(settings.params)) {
                for (let i = 0; i < settings.params.length; i++) {
                  const p = settings.params[i];
                  paramsMapC[p.name] = argsListC[i] || '';
                }
              }
              processedResponse.caption = processedResponse.caption.replace(/\{(?:args|all)\}/gi, allArgsC);
              processedResponse.caption = processedResponse.caption.replace(/\{(\d+)\}/g, (m, idx) => {
                const i = parseInt(idx, 10) - 1;
                return argsListC[i] || '';
              });
              for (const nm in paramsMapC) {
                if (!Object.prototype.hasOwnProperty.call(paramsMapC, nm)) continue;
                const val = paramsMapC[nm];
                if (typeof val === 'undefined' || val === '') continue;
                try {
                  const re = new RegExp('\\{' + escapeRegExp(nm) + '\\}', 'gi');
                  processedResponse.caption = processedResponse.caption.replace(re, val);
                } catch (err) {
                  console.warn('Warn: Invalid param name during caption regex replace:', nm, err.message);
                }
              }
              const mentionedJidsC = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
              let mentionsToIncludeC = Array.isArray(mentionedJidsC) ? mentionedJidsC : [];
              if (!mentionsToIncludeC.length && typeof menc_os2 !== 'undefined' && menc_os2) {
                mentionsToIncludeC = [menc_os2];
              }
              const mentionTextC = mentionsToIncludeC.length > 0 ? mentionsToIncludeC.map(m => '@' + getUserName(m)).join(' ') : '';
              processedResponse.caption = processedResponse.caption.replace(/\{mention\}/gi, mentionTextC);
              processedResponse.caption = processedResponse.caption.replace(/\{mentions\}/gi, mentionTextC);
              const quotedTextC = (quotedMessageContent && (quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text)) || '';
              processedResponse.caption = processedResponse.caption.replace(/\{quoted\}/gi, quotedTextC);
              const groupDescValueC = (groupMetadata && groupMetadata.desc) ? groupMetadata.desc : '';
              const latencyC = info?.messageTimestamp ? ((Date.now() - info.messageTimestamp * 1000) / 1000).toFixed(3) : null;
              if (groupDescValueC) processedResponse.caption = processedResponse.caption.replace(/\{(?:groupdesc|descricao|desc)\}/gi, groupDescValueC);
              if (latencyC !== null) processedResponse.caption = processedResponse.caption.replace(/\{(?:velocidade|speed|latency)\}/gi, `${latencyC}s`);
            }
          }

          // Enviar resposta
          if (typeof processedResponse === 'string') {
            // Incluir mentions quando houver
            const mentionedJidsExec = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let mentionsToIncludeExec = Array.isArray(mentionedJidsExec) ? mentionedJidsExec : [];
            if (!mentionsToIncludeExec.length && typeof menc_os2 !== 'undefined' && menc_os2) {
              mentionsToIncludeExec = [menc_os2];
            }
            if (mentionsToIncludeExec.length > 0) {
              await reply(processedResponse, { mentions: mentionsToIncludeExec });
            } else {
              await reply(processedResponse);
            }
          } else if (processedResponse.type === 'text') {
            // substituir placeholders em conteúdo de texto
            let content = processedResponse.content || 'Resposta personalizada';
            const argsListExec = argsList;
            const paramsMapExec = {};
            if (Array.isArray(settings.params)) {
              for (let i = 0; i < settings.params.length; i++) {
                const p = settings.params[i];
                paramsMapExec[p.name] = argsListExec[i] || '';
              }
            }
            content = content.replace(/\{(?:args|all)\}/gi, allArgsExec);
            content = content.replace(/\{(\d+)\}/g, (m, idx) => {
              const i = parseInt(idx, 10) - 1;
              return argsListExec[i] || '';
            });
            // Named parameter replacement for {name}
            for (const nm in paramsMapExec) {
              if (!Object.prototype.hasOwnProperty.call(paramsMapExec, nm)) continue;
              const val = paramsMapExec[nm];
              if (typeof val === 'undefined' || val === '') continue;
              const re = new RegExp('\\{' + escapeRegExp(nm) + '\\}', 'gi');
              content = content.replace(re, val);
            }
            // mentions
            const mentionedJidsExec = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let mentionsToIncludeExec = Array.isArray(mentionedJidsExec) ? mentionedJidsExec : [];
            if (!mentionsToIncludeExec.length && typeof menc_os2 !== 'undefined' && menc_os2) {
              mentionsToIncludeExec = [menc_os2];
            }
            const mentionTextExec = mentionsToIncludeExec.length > 0 ? mentionsToIncludeExec.map(m => '@' + getUserName(m)).join(' ') : '';
            content = content.replace(/\{mention\}/gi, mentionTextExec);
            content = content.replace(/\{mentions\}/gi, mentionTextExec);
            const quotedEx = (quotedMessageContent && (quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text)) || '';
            content = content.replace(/\{quoted\}/gi, quotedEx);
            const groupDescValueT = (groupMetadata && groupMetadata.desc) ? groupMetadata.desc : '';
            const latencyT = info?.messageTimestamp ? ((Date.now() - info.messageTimestamp * 1000) / 1000).toFixed(3) : null;
            if (groupDescValueT) content = content.replace(/\{(?:groupdesc|descricao|desc)\}/gi, groupDescValueT);
            if (latencyT !== null) content = content.replace(/\{(?:velocidade|speed|latency)\}/gi, `${latencyT}s`);

            if (mentionsToIncludeExec.length > 0) {
              await reply(content, { mentions: mentionsToIncludeExec });
            } else {
              await reply(content);
            }
          } else if (processedResponse.type === 'image') {
            const imageBuffer = processedResponse.buffer ? Buffer.from(processedResponse.buffer, 'base64') : null;
            if (imageBuffer) {
              const mentionedJidsExec = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
              let mentionsToIncludeExec = Array.isArray(mentionedJidsExec) ? mentionedJidsExec : [];
              if (!mentionsToIncludeExec.length && typeof menc_os2 !== 'undefined' && menc_os2) {
                mentionsToIncludeExec = [menc_os2];
              }
              await nazu.sendMessage(from, {
                image: imageBuffer,
                caption: processedResponse.caption || '',
                mentions: mentionsToIncludeExec
              }, { quoted: info });
            }
          } else if (processedResponse.type === 'video') {
            const videoBuffer = processedResponse.buffer ? Buffer.from(processedResponse.buffer, 'base64') : null;
            if (videoBuffer) {
              const mentionedJidsExec = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
              let mentionsToIncludeExec = Array.isArray(mentionedJidsExec) ? mentionedJidsExec : [];
              if (!mentionsToIncludeExec.length && typeof menc_os2 !== 'undefined' && menc_os2) {
                mentionsToIncludeExec = [menc_os2];
              }
              await nazu.sendMessage(from, {
                video: videoBuffer,
                caption: processedResponse.caption || '',
                mentions: mentionsToIncludeExec
              }, { quoted: info });
            }
          } else if (processedResponse.type === 'audio') {
            const audioBuffer = processedResponse.buffer ? Buffer.from(processedResponse.buffer, 'base64') : null;
            if (audioBuffer) {
              await nazu.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mp4',
                ptt: processedResponse.ptt || false
              }, { quoted: info });
            }
          } else if (processedResponse.type === 'sticker') {
            const stickerBuffer = processedResponse.buffer ? Buffer.from(processedResponse.buffer, 'base64') : null;
            if (stickerBuffer) {
              await nazu.sendMessage(from, {
                sticker: stickerBuffer
              }, { quoted: info });
            }
          }

          return; // Comando personalizado executado, não continuar
        } catch (error) {
          console.error('Erro ao executar comando personalizado:', error);
          await reply('❌ Erro ao executar comando personalizado.');
        }
      }
    }

    if (isCmd && !['cmdlimitar', 'cmdlimit', 'limitarcmd', 'cmddeslimitar', 'cmdremovelimit', 'rmcmdlimit', 'cmdlimites', 'cmdlimits', 'listcmdlimites'].includes(command)) {
      const globalLimitCheck = checkCommandLimit(command, sender);
      if (globalLimitCheck.limited) {
        return reply(globalLimitCheck.message);
      }
    }

    // Verificação de comandos VIP
    if (isCmd && vipCommandsManager.isVipCommand(command)) {
      if (!isPremium) {
        await reply(`🔒 *Comando VIP Exclusivo*

Este comando está disponível apenas para usuários VIP/Premium!

💎 *Benefícios VIP:*
• Acesso a comandos exclusivos
• Sem limites de uso
• Prioridade no atendimento
• Recursos premium

📞 *Como ser VIP?*
Entre em contato com o dono do bot:
• Use: ${prefix}dono

✨ Use ${prefix}menuvip para ver todos os comandos VIP disponíveis!`);
        return;
      }
    }


    // ==================== VERIFICAÇÃO DE COMANDOS PARA SUBDONOS ====================
    if (isCmd && command && !isOwner) {
      try {
        const subOwnerFile = pathz.join(DATABASE_DIR, 'subOwnerCommands.json');
        let subOwnerCommands = [];
        if (fs.existsSync(subOwnerFile)) {
          subOwnerCommands = JSON.parse(fs.readFileSync(subOwnerFile, 'utf-8'));
        }
        if (subOwnerCommands.includes(command)) {
          if (!isSubOwner) {
            return reply('🚫 Apenas donos e subdonos podem usar este comando!');
          }
        }
      } catch (e) {
        console.error('Erro ao verificar lista de comandos de subdonos:', e);
      }
    }


    switch (command) {

      case 'roles':
      case 'role.lista':
      case 'listaroles': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }

          const roleEntries = Object.entries(groupData.roles || {});
          if (!roleEntries.length) {
            await reply('🪩 Nenhum rolê ativo no momento.');
            break;
          }

          const wantsPv = normalizar(args[0] || '') === 'pv';
          const sendInPv = !isGroupAdmin || wantsPv;
          const sendTarget = sendInPv ? sender : from;
          const listLines = roleEntries.map(([roleCode, roleData], index) => formatRoleSummary(roleCode, roleData, roleEntries.length > 1 ? index : null));
          const listText = `🪩 *Rolês ativos*\n\n${listLines.join('\n\n')}\n\n🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou CODIGO\n🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou CODIGO`;

          try {
            await nazu.sendMessage(sendTarget, { text: listText });
            if (sendInPv && sendTarget !== from) {
              await reply('📬 Enviei a lista de rolês no seu privado!', { mentions: [sender] });
            }
          } catch (listError) {
            console.error('Erro ao enviar lista de rolês:', listError);
            await reply('❌ Não consegui enviar a lista de rolês agora. Tente novamente mais tarde.');
          }
        } catch (e) {
          console.error('Erro em listaroles:', e);
          await reply('❌ Ocorreu um erro ao listar os rolês.');
        }
        break;
      }

      case 'role.criar': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }
          if (!isGroupAdmin) {
            await reply('🚫 Apenas administradores podem criar rolês.');
            break;
          }

          const parts = parsePipeArgs(q);
          if (parts.length < 1) {
            await reply(`📋 Formato esperado:\n${groupPrefix}role.criar CODIGO | Título/Descrição\n\n*Opcional:* CODIGO | Título | Data/Horário | Local | Observações`);
            break;
          }

          const code = sanitizeRoleCode(parts.shift());
          if (!code) {
            await reply('❌ Informe um código alfanumérico para o rolê.');
            break;
          }
          if (groupData.roles[code]) {
            await reply('❌ Já existe um rolê cadastrado com esse código.');
            break;
          }

          const title = parts[0] || '';
          const when = parts[1] || '';
          const where = parts[2] || '';
          const description = parts.slice(3).join(' | ') || '';

          const roleData = {
            code,
            title,
            when,
            where,
            description,
            createdAt: new Date().toISOString(),
            createdBy: sender,
            participants: {
              going: [],
              notGoing: []
            }
          };
          ensureRoleParticipants(roleData);

          const lines = [
            '🪩 *Novo rolê confirmado!*',
            `🎫 Código: *${code}*`
          ];
          if (title) lines.push(`📛 Título: ${title}`);
          if (when) lines.push(`🗓️ Quando: ${when}`);
          if (where) lines.push(`📍 Onde: ${where}`);
          if (description) lines.push(`📝 Descrição: ${description}`);
          lines.push('');
          lines.push(`🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou ${code}`);
          lines.push(`🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou ${code}`);
          const announcementText = lines.join('\n');

          let sentMessage = null;
          let mediaData = null;
          try {
            const mediaInfo = getMediaInfo(info.message);
            if (mediaInfo && (mediaInfo.type === 'image' || mediaInfo.type === 'video')) {
              const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
              const payload = {
                caption: announcementText
              };

              // Salva informações da mídia para uso posterior
              mediaData = {
                type: mediaInfo.type,
                buffer: buffer.toString('base64'),
                mimetype: mediaInfo.media.mimetype || (mediaInfo.type === 'image' ? 'image/jpeg' : 'video/mp4'),
                gifPlayback: mediaInfo.type === 'video' && mediaInfo.media.gifPlayback
              };

              if (mediaInfo.type === 'image') {
                payload.image = buffer;
                payload.mimetype = mediaData.mimetype;
              } else {
                payload.video = buffer;
                payload.mimetype = mediaData.mimetype;
                if (mediaData.gifPlayback) {
                  payload.gifPlayback = true;
                }
              }
              sentMessage = await nazu.sendMessage(from, payload);
            } else {
              sentMessage = await nazu.sendMessage(from, { text: announcementText });
            }
          } catch (sendError) {
            console.error('Erro ao divulgar rolê:', sendError);
          }

          if (sentMessage?.key?.id) {
            roleData.announcementKey = {
              id: sentMessage.key.id,
              fromMe: sentMessage.key.fromMe ?? true,
              participant: sentMessage.key.participant || null
            };
            groupData.roleMessages[sentMessage.key.id] = code;
          } else {
            roleData.announcementKey = null;
          }

          // Salva a mídia no roleData
          if (mediaData) {
            roleData.media = mediaData;
          }

          groupData.roles[code] = roleData;
          persistGroupData();

          await reply(sentMessage ? `✅ Rolê *${code}* cadastrado e divulgado!` : `⚠️ Rolê *${code}* salvo, mas não consegui enviar a divulgação automaticamente. Use ${groupPrefix}roles para compartilhar.`);
        } catch (e) {
          console.error('Erro em role.criar:', e);
          await reply('❌ Ocorreu um erro ao criar o rolê.');
        }
        break;
      }

      case 'role.alterar': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }
          if (!isGroupAdmin) {
            await reply('🚫 Apenas administradores podem alterar rolês.');
            break;
          }

          const parts = parsePipeArgs(q);
          if (!parts.length) {
            await reply(`📋 Formato esperado:\n${groupPrefix}role.alterar CODIGO | Novo título | Novo horário | Novo local | Nova descrição`);
            break;
          }

          const code = sanitizeRoleCode(parts.shift());
          if (!code) {
            await reply('❌ Informe um código válido para o rolê.');
            break;
          }

          const roleData = groupData.roles[code];
          if (!roleData) {
            await reply('❌ Não encontrei nenhum rolê com esse código.');
            break;
          }

          const mediaInfo = getMediaInfo(info.message);
          if (!parts.length && !mediaInfo) {
            await reply('ℹ️ Informe pelo menos um campo para atualização ou envie uma nova mídia.');
            break;
          }

          if (parts[0]) roleData.title = parts[0];
          if (parts[1]) roleData.when = parts[1];
          if (parts[2]) roleData.where = parts[2];
          if (parts.length > 3) {
            roleData.description = parts.slice(3).join(' | ');
          }

          roleData.updatedAt = new Date().toISOString();
          roleData.updatedBy = sender;
          ensureRoleParticipants(roleData);

          if (roleData.announcementKey?.id) {
            delete groupData.roleMessages[roleData.announcementKey.id];
            try {
              await nazu.sendMessage(from, {
                delete: {
                  remoteJid: from,
                  fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
                  id: roleData.announcementKey.id,
                  participant: roleData.announcementKey.participant || undefined
                }
              });
            } catch (deleteErr) {
              console.warn('Não consegui remover a divulgação antiga do rolê:', deleteErr.message || deleteErr);
            }
          }

          const lines = [
            '🛠️ *Rolê atualizado!*',
            `🎫 Código: *${code}*`
          ];
          if (roleData.title) lines.push(`📛 Título: ${roleData.title}`);
          if (roleData.when) lines.push(`🗓️ Quando: ${roleData.when}`);
          if (roleData.where) lines.push(`📍 Onde: ${roleData.where}`);
          if (roleData.description) lines.push(`📝 Descrição: ${roleData.description}`);
          lines.push('');
          lines.push(`🙋 Reaja com ${ROLE_GOING_BASE} ou use ${groupPrefix}role.vou ${code}`);
          lines.push(`🤷 Reaja com ${ROLE_NOT_GOING_BASE} ou use ${groupPrefix}role.nvou ${code}`);
          const announcementText = lines.join('\n');

          let sentMessage = null;
          try {
            if (mediaInfo && (mediaInfo.type === 'image' || mediaInfo.type === 'video')) {
              const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
              const payload = {
                caption: announcementText
              };
              if (mediaInfo.type === 'image') {
                payload.image = buffer;
                payload.mimetype = mediaInfo.media.mimetype || 'image/jpeg';
              } else {
                payload.video = buffer;
                payload.mimetype = mediaInfo.media.mimetype || 'video/mp4';
                if (mediaInfo.media.gifPlayback) {
                  payload.gifPlayback = true;
                }
              }
              sentMessage = await nazu.sendMessage(from, payload);
            } else {
              sentMessage = await nazu.sendMessage(from, { text: announcementText });
            }
          } catch (updateErr) {
            console.error('Erro ao reenviar divulgação do rolê:', updateErr);
          }

          if (sentMessage?.key?.id) {
            roleData.announcementKey = {
              id: sentMessage.key.id,
              fromMe: sentMessage.key.fromMe ?? true,
              participant: sentMessage.key.participant || null
            };
            groupData.roleMessages[sentMessage.key.id] = code;
          } else {
            roleData.announcementKey = null;
          }

          groupData.roles[code] = roleData;
          persistGroupData();
          await reply(`✅ Rolê *${code}* atualizado.`);
        } catch (e) {
          console.error('Erro em role.alterar:', e);
          await reply('❌ Ocorreu um erro ao alterar o rolê.');
        }
        break;
      }

      case 'role.excluir': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }
          if (!isGroupAdmin) {
            await reply('🚫 Apenas administradores podem excluir rolês.');
            break;
          }

          const code = sanitizeRoleCode(q || args[0] || '');
          if (!code) {
            await reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.excluir CODIGO`);
            break;
          }

          const roleData = groupData.roles[code];
          if (!roleData) {
            await reply('❌ Não encontrei nenhum rolê com esse código.');
            break;
          }

          if (roleData.announcementKey?.id) {
            delete groupData.roleMessages[roleData.announcementKey.id];
            try {
              await nazu.sendMessage(from, {
                delete: {
                  remoteJid: from,
                  fromMe: roleData.announcementKey.fromMe !== undefined ? roleData.announcementKey.fromMe : true,
                  id: roleData.announcementKey.id,
                  participant: roleData.announcementKey.participant || undefined
                }
              });
            } catch (deleteErr) {
              console.warn('Não consegui remover a divulgação do rolê:', deleteErr.message || deleteErr);
            }
          }

          delete groupData.roles[code];
          persistGroupData();
          await reply(`🗑️ Rolê *${code}* removido.`);
        } catch (e) {
          console.error('Erro em role.excluir:', e);
          await reply('❌ Ocorreu um erro ao excluir o rolê.');
        }
        break;
      }

      case 'role.vou': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }

          const code = sanitizeRoleCode(args[0] || '');
          if (!code) {
            await reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.vou CODIGO`);
            break;
          }

          const roleData = groupData.roles[code];
          if (!roleData) {
            await reply('❌ Não encontrei nenhum rolê com esse código.');
            break;
          }

          const participants = ensureRoleParticipants(roleData);
          if (participants.going.includes(sender)) {
            await reply(`🙋 Você já confirmou presença no rolê *${roleData.title || code}*.`);
            break;
          }

          participants.going.push(sender);
          participants.notGoing = participants.notGoing.filter(id => id !== sender);
          participants.updatedAt = new Date().toISOString();

          groupData.roles[code] = roleData;
          persistGroupData();

          await reply(`✅ Presença confirmada no rolê *${roleData.title || code}*.`);
          // Atualiza anúncio principal
          await refreshRoleAnnouncement(code, roleData);
        } catch (e) {
          console.error('Erro em role.vou:', e);
          await reply('❌ Ocorreu um erro ao confirmar sua presença.');
        }
        break;
      }

      case 'role.nvou': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }

          const code = sanitizeRoleCode(args[0] || '');
          if (!code) {
            await reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.nvou CODIGO`);
            break;
          }

          const roleData = groupData.roles[code];
          if (!roleData) {
            await reply('❌ Não encontrei nenhum rolê com esse código.');
            break;
          }

          const participants = ensureRoleParticipants(roleData);
          const wasGoing = participants.going.includes(sender);

          participants.going = participants.going.filter(id => id !== sender);
          if (!participants.notGoing.includes(sender)) {
            participants.notGoing.push(sender);
          }
          participants.updatedAt = new Date().toISOString();

          groupData.roles[code] = roleData;
          persistGroupData();

          await reply(wasGoing ? `🤷 Presença removida do rolê *${roleData.title || code}*.` : `🤷 Você já estava marcado como ausente para o rolê *${roleData.title || code}*.`);
          // Atualiza anúncio principal
          await refreshRoleAnnouncement(code, roleData);
        } catch (e) {
          console.error('Erro em role.nvou:', e);
          await reply('❌ Ocorreu um erro ao atualizar sua presença.');
        }
        break;
      }

      case 'role':
      case 'role.confirmados':
      case 'role.participantes':
      case 'role.info': {
        try {
          if (!isGroup) {
            await reply('⚠️ Este comando só pode ser usado em grupos.');
            break;
          }
          const code = sanitizeRoleCode(args[0] || '');
          if (!code) {
            await reply(`📋 Informe o código do rolê. Exemplo: ${groupPrefix}role CODIGO`);
            break;
          }
          const roleData = groupData.roles[code];
          if (!roleData) {
            await reply('❌ Não encontrei nenhum rolê com esse código.');
            break;
          }
          const parts = ensureRoleParticipants(roleData);
          const going = parts.going || [];
          const notGoing = parts.notGoing || [];
          const lines = [];
          lines.push(`🪩 *${roleData.title || code}*`);
          lines.push(`🎫 Código: ${code}`);
          if (roleData.when) lines.push(`🗓️ Quando: ${roleData.when}`);
          if (roleData.where) lines.push(`📍 Onde: ${roleData.where}`);
          if (roleData.description) lines.push(`📝 Descrição: ${roleData.description}`);
          lines.push('');
          lines.push(`🙋 Confirmados (${going.length}):`);
          lines.push(going.length ? going.map(id => `• @${getUserName(id)}`).join('\n') : '• —');
          lines.push('');
          lines.push(`🤷 Desistiram (${notGoing.length}):`);
          lines.push(notGoing.length ? notGoing.map(id => `• @${getUserName(id)}`).join('\n') : '• —');

          // Envia com a mídia salva se disponível
          if (roleData.media) {
            try {
              const buffer = Buffer.from(roleData.media.buffer, 'base64');
              const payload = {
                caption: lines.join('\n'),
                mentions: [...going, ...notGoing]
              };

              if (roleData.media.type === 'image') {
                payload.image = buffer;
                payload.mimetype = roleData.media.mimetype;
              } else if (roleData.media.type === 'video') {
                payload.video = buffer;
                payload.mimetype = roleData.media.mimetype;
                if (roleData.media.gifPlayback) {
                  payload.gifPlayback = true;
                }
              }

              await nazu.sendMessage(from, payload, { quoted: info });
            } catch (mediaError) {
              console.log('Erro ao enviar mídia do rolê:', mediaError.message);
              // Se falhar, envia apenas texto
              await nazu.sendMessage(from, { text: lines.join('\n'), mentions: [...going, ...notGoing] }, { quoted: info });
            }
          } else {
            // Se não tiver mídia, envia apenas texto
            await nazu.sendMessage(from, { text: lines.join('\n'), mentions: [...going, ...notGoing] }, { quoted: info });
          }
        } catch (e) {
          console.error('Erro em role.info:', e);
          await reply('❌ Ocorreu um erro ao buscar informações do rolê.');
        }
        break;
      }

      case 'menurpg':
      case 'rpg': {
        await sendMenuWithMedia('menurpg', menuRPG);
        break;
      }

      case 'lembrete':
      case 'lembrar': {
        try {
          if (!q) return reply(`📅 *Como usar o comando lembrete:*\n\n💡 *Exemplos:*\n• ${prefix}lembrete em 30m beber água\n• ${prefix}lembrete 15/09 18:30 reunião\n• ${prefix}lembrete amanhã 08:00 acordar`);
          const parsed = parseReminderInput(q);
          if (!parsed) return reply('❌ Não consegui entender a data/hora. Exemplos:\n- em 10m tomar remédio\n- 25/12 09:00 ligar para a família\n- hoje 21:15 estudar');
          const { at, message } = parsed;
          const minDelay = 10 * 1000;
          if (at - Date.now() < minDelay) return reply('⏳ Escolha um horário pelo menos 10 segundos à frente.');
          const newReminder = {
            id: (() => {
              try {
                return crypto.randomBytes(6).toString('hex');
              } catch (error) {
                return Math.random().toString(16).substring(2, 14);
              }
            })(),
            userId: sender,
            chatId: from,
            createdByName: pushname || '',
            createdAt: new Date().toISOString(),
            at,
            message: message,
            status: 'pending'
          };
          // Otimização: Cache de reminders
          const list = await optimizer.memoize(
            'reminders:all',
            () => Promise.resolve(loadReminders()),
            5000 // 5 segundos
          );
          list.push(newReminder);
          saveReminders(list);
          // Invalida cache após salvar
          optimizer.clearStatic('reminders:all');
          // Invalida cache após salvar
          optimizer.clearStatic('reminders:all');
          await reply(`✅ Lembrete agendado para ${tzFormat(at)}.\n📝 Mensagem: ${message}`);
        } catch (e) {
          console.error('Erro ao agendar lembrete:', e);
          await reply('❌ Ocorreu um erro ao agendar seu lembrete.');
        }
        break;
      }
      case 'meuslembretes':
      case 'listalembretes': {
        try {
          // Otimização: Cache de reminders
          const allReminders = await optimizer.memoize(
            'reminders:all',
            () => Promise.resolve(loadReminders()),
            5000 // 5 segundos
          );
          const list = allReminders.filter(r => r.userId === sender && r.status !== 'sent');
          if (!list.length) return reply('📭 Você não tem lembretes pendentes.');
          const lines = list
            .sort((a, b) => a.at - b.at)
            .map((r, i) => `${i + 1}. [${r.id.slice(0, 6)}] ${tzFormat(r.at)} — ${r.message}`);
          await reply(`🗓️ Seus lembretes pendentes:\n\n${lines.join('\n')}`);
        } catch (e) {
          console.error('Erro ao listar lembretes:', e);
          await reply('❌ Ocorreu um erro ao listar seus lembretes.');
        }
        break;
      }
      case 'apagalembrete':
      case 'removerlembrete': {
        try {
          const idArg = (q || '').trim();
          if (!idArg) return reply(`🗑️ *Uso do comando apagalembrete:*\n\n📝 *Formato:* ${prefix}apagalembrete <id|tudo>\n\n💡 *Exemplos:*\n• ${prefix}apagalembrete 123456\n• ${prefix}apagalembrete tudo`);
          // Otimização: Cache de reminders
          let list = await optimizer.memoize(
            'reminders:all',
            () => Promise.resolve(loadReminders()),
            5000 // 5 segundos
          );
          if (['tudo', 'todos', 'all'].includes(idArg.toLowerCase())) {
            const before = list.length;
            list = list.filter(r => !(r.userId === sender && r.status !== 'sent'));
            const removed = before - list.length;
            saveReminders(list);
            // Invalida cache após salvar
            optimizer.clearStatic('reminders:all');
            return reply(`🗑️ Removidos ${removed} lembrete(s) pendente(s).`);
          }
          const idx = list.findIndex(r => r.id.startsWith(idArg) && r.userId === sender && r.status !== 'sent');
          if (idx === -1) return reply('❌ Lembrete não encontrado ou já enviado. Dica: use o ID mostrado em "meuslembretes".');
          const removed = list.splice(idx, 1)[0];
          saveReminders(list);
          // Invalida cache após salvar
          optimizer.clearStatic('reminders:all');
          await reply(`🗑️ Lembrete removido: ${removed.message}`);
        } catch (e) {
          console.error('Erro ao apagar lembrete:', e);
          await reply('❌ Ocorreu um erro ao remover seu lembrete.');
        }
        break;
      }

      case 'modorpg':
      case 'rpgmode': {
        if (!isGroup) return reply('Este comando só funciona em grupos.');
        if (!isGroupAdmin) return reply('Apenas administradores podem usar este comando.');
        groupData.modorpg = !groupData.modorpg;
        writeJsonFile(groupFile, groupData);
        // Otimização: Invalida cache quando groupData é salvo
        if (isGroup) {
          optimizer.invalidateGroup(from);
        }
        await reply(`⚔️ Modo RPG ${groupData.modorpg ? 'ATIVADO' : 'DESATIVADO'} neste grupo.\n\n${groupData.modorpg ? '🎮 Agora os membros podem usar todos os comandos RPG!' : '🔒 Comandos RPG desativados.'}`);
        break;
      }

      case 'perfilrpg':
      case 'carteira':
      case 'banco':
      case 'depositar':
      case 'dep':
      case 'sacar':
      case 'saque':
      case 'transferir':
      case 'pix':
      case 'loja':
      case 'lojarps':
      case 'comprar':
      case 'buy':
      case 'inventario':
      case 'inv':
      case 'apostar':
      case 'bet':
      case 'slots':
      case 'minerar':
      case 'mine':
      case 'trabalhar':
      case 'work':
      case 'emprego':
      case 'vagas':
      case 'demitir':
      case 'pescar':
      case 'fish':
      case 'explorar':
      case 'explore':
      case 'cacar':
      case 'caçar':
      case 'hunt':
      case 'mercado':
      case 'listar':
      case 'comprarmercado':
      case 'cmerc':
      case 'meusanuncios':
      case 'meusan':
      case 'cancelar':
      case 'propriedades':
      case 'comprarpropriedade':
      case 'cprop':
      case 'coletarpropriedades':
      case 'cprops':
      case 'habilidades':
      case 'desafiosemanal':
      case 'desafiomensal':
      case 'materiais':
      case 'precos':
      case 'preços':
      case 'vender':
      case 'reparar':
      case 'desafio':
      case 'forjar':
      case 'forge':
      case 'crime':
      case 'assaltar':
      case 'roubar':
      case 'cozinhar':
      case 'cook':
      case 'receitas':
      case 'plantar':
      case 'cultivar':
      case 'plant':
      case 'farm':
      case 'colher':
      case 'coletar':
      case 'harvest':
      case 'plantacao':
      case 'plantação':
      case 'horta':
      case 'comer':
      case 'eat':
      case 'vendercomida':
      case 'ingredientes':
      case 'sementes':
      case 'toprpg':
      case 'ranklevel':
      case 'ranklvl':
      case 'rankinglevel':
      case 'levels':
      case 'toplevels':
      case 'diario':
      case 'daily':
      case 'resetrpg':
        {
          if (!isGroup) return reply('⚔️ Os comandos RPG funcionam apenas em grupos.');
          if (!groupData.modorpg) return reply(`⚔️ *Modo RPG desativado!*\n\n🔒 Este recurso está disponível apenas quando o Modo RPG está ativado.\n🔐 *Administradores* podem ativar com: ${prefix}modorpg\n\n💡 Use ${prefix}menurpg para ver todos os comandos!`);
          const econ = loadEconomy();
          const changedEconomy = ensureEconomyDefaults(econ);
          const me = getEcoUser(econ, sender);
          ensureUserChallenge(me);
          const { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus, forgeBonus } = applyShopBonuses(me, econ);
          if (changedEconomy) saveEconomy(econ);

          const sub = command;
          const args = q ? q.trim().toLowerCase().split(/\s+/) : [];
          // Tratamento especial para ranklevel/ranklvl/levels etc.
          if (['ranklevel', 'ranklvl', 'rankinglevel', 'levels', 'toplevels'].includes(sub)) {
            // Se estiver em grupo, usamos o ranking do grupo (RPG)
            if (isGroup) {
              if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
              const levelingData = loadLevelingSafe();
              const userEntries = Object.entries(levelingData.users || {});
              const groupUsers = userEntries.filter(([id, data]) => AllgroupMembers.includes(id));
              if (groupUsers.length === 0) return reply('📊 Nenhum usuário do grupo encontrado no sistema de levels.');

              const sortedUsers = groupUsers
                .map(([id, userData]) => ({ id, level: userData?.level || 1, xp: userData?.xp || 0, messages: userData?.messages || 0, commands: userData?.commands || 0, patent: userData?.patent || 'Iniciante' }))
                .sort((a, b) => (b.level !== a.level ? b.level - a.level : b.xp - a.xp))
                .slice(0, 15);

              let text = '🏆 *RANKING DE LEVELS DO GRUPO* 🏆\n\n';
              const mentions = [];
              sortedUsers.forEach((user, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const userName = user.id.split('@')[0];
                const xpNeeded = (user.level * 100) - (user.level - 1) * 100;
                const progress = user.xp > 0 ? ` (${user.xp}/${xpNeeded} XP)` : '';
                text += `${medal} @${userName} — *Level ${user.level}*${progress}\n`;
                text += `   🏅 ${user.patent} | 💬 ${user.messages} msgs | ⚡ ${user.commands} cmds\n`;
                mentions.push(user.id);
              });
              text += '\n✨ Continue jogando e interagindo para subir no ranking!';
              return reply(text, { mentions });
            }

            // Se não for grupo, serve como ranking global
            const levelingDataRank = loadLevelingSafe();
            const sortedUsers = Object.entries(levelingDataRank.users || {}).sort((a, b) => (b[1]?.level || 1) - (a[1]?.level || 1) || (b[1]?.xp || 0) - (a[1]?.xp || 0)).slice(0, 15);
            let rankMessage = '🏆 *Ranking Global de Níveis*\n\n';
            const mentionsG = [];
            sortedUsers.forEach(([userId, data], index) => { rankMessage += `${index + 1}. @${getUserName(userId)} - Nível ${data?.level || 1} (XP: ${data?.xp || 0})\n`; mentionsG.push(userId); });
            return reply(rankMessage, { mentions: mentionsG });
          }
          const mentioned = (menc_jid2 && menc_jid2[0]) || (q.includes('@') ? q.split(' ')[0].replace('@', '') : null);

          if (sub === 'resetrpg') {
            if (!(isOwner && !isSubOwner && (sender === nmrdn || isBotSender))) return reply('Apenas o Dono principal pode resetar usuários.');
            const target = (menc_jid2 && menc_jid2[0]) || null;
            const scope = (q || '').toLowerCase();
            if (scope.includes('all') || scope.includes('todos')) {
              let count = 0;
              for (const p of (AllgroupMembers || [])) {
                if (econ.users[p]) { delete econ.users[p]; count++; }
              }
              saveEconomy(econ);
              return reply(`✅ Resetado os dados RPG de ${count} membros do grupo.`);
            }
            if (!target) return reply('Marque um usuário para resetar ou use "all".');
            delete econ.users[target];
            saveEconomy(econ);
            return reply(`✅ Dados RPG resetados para @${getUserName(target)}.`, { mentions: [target] });
          }

          if (sub === 'perfilrpg') {
            // Perfil completo do RPG
            const total = (me.wallet || 0) + (me.bank || 0);
            const level = me.level || 1;
            const exp = me.exp || 0;
            const nextLevelXp = 100 * Math.pow(1.5, level - 1);
            const expProgress = `${exp}/${Math.floor(nextLevelXp)}`;
            const expPercent = Math.min(100, Math.floor((exp / nextLevelXp) * 100));

            // Skills
            ensureUserSkills(me);
            const topSkills = SKILL_LIST.map(sk => ({ name: sk, level: me.skills[sk]?.level || 1 }))
              .sort((a, b) => b.level - a.level).slice(0, 3);

            // Estatísticas gerais
            const battlesWon = me.battlesWon || 0;
            const battlesLost = me.battlesLost || 0;
            const totalBattles = battlesWon + battlesLost;
            const winRate = totalBattles > 0 ? Math.floor((battlesWon / totalBattles) * 100) : 0;

            const achievements = Object.keys(me.achievements || {}).length;
            const pets = (me.pets || []).length;
            const premiumItems = Object.keys(me.premiumItems || {}).length;

            // Progresso de prestige
            const prestigeLevel = me.prestige?.level || 0;
            const prestigeMultiplier = me.prestige?.bonusMultiplier || 1;

            // Reputação
            const reputation = me.reputation?.points || 0;
            const karma = me.reputation?.karma || 0;

            // Streak diário
            const streak = me.streak?.count || 0;

            // Classe
            const classes = {
              'guerreiro': { emoji: '⚔️', name: 'Guerreiro' },
              'mago': { emoji: '🧙', name: 'Mago' },
              'arqueiro': { emoji: '🏹', name: 'Arqueiro' },
              'curandeiro': { emoji: '💚', name: 'Curandeiro' },
              'ladino': { emoji: '🗡️', name: 'Ladino' },
              'paladino': { emoji: '🛡️', name: 'Paladino' }
            };
            const classeInfo = me.classe ? `${classes[me.classe]?.emoji} ${classes[me.classe]?.name}` : 'Nenhuma';

            // Clã
            let clanInfo = 'Nenhum';
            if (me.clan && econ.clans[me.clan]) {
              const myClan = econ.clans[me.clan];
              clanInfo = myClan.name || 'Sem nome';
            }

            // Casa
            const casas = {
              'barraca': { emoji: '⛺', name: 'Barraca' },
              'cabana': { emoji: '🏚️', name: 'Cabana' },
              'casa': { emoji: '🏠', name: 'Casa' },
              'mansao': { emoji: '🏰', name: 'Mansão' },
              'castelo': { emoji: '🏯', name: 'Castelo' }
            };
            const houseInfo = me.house?.type ? `${casas[me.house.type]?.emoji || ''} ${casas[me.house.type]?.name || me.house.type}` : 'Nenhuma';

            // Família e Relacionamento
            if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
            const familyChildren = (me.family.children || []).length;

            // Buscar relacionamento ativo do sistema de relacionamentos
            let familySpouse = 'Solteiro(a)';
            let relationshipType = '';
            let relationshipEmoji = '';
            const mentions = [];

            const activePair = relationshipManager.getActivePairForUser(sender);
            if (activePair && activePair.partnerId) {
              familySpouse = `@${activePair.partnerId.split('@')[0]}`;
              mentions.push(activePair.partnerId);

              // Determinar tipo de relacionamento
              if (activePair.pair?.status === 'casamento') {
                relationshipType = 'Casado(a)';
                relationshipEmoji = '💍';
              } else if (activePair.pair?.status === 'namoro') {
                relationshipType = 'Namorando';
                relationshipEmoji = '💞';
              } else if (activePair.pair?.status === 'brincadeira') {
                relationshipType = 'Brincadeira';
                relationshipEmoji = '🎈';
              }
            }

            let text = `╭━━━⊱ ⚔️ *PERFIL RPG* ⚔️ ⊱━━━╮\n`;
            text += `│ ${pushname}\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

            text += `📊 *NÍVEL & EXPERIÊNCIA*\n`;
            text += `├ Level: ${level}\n`;
            text += `├ XP: ${expProgress} (${expPercent}%)\n`;
            text += `├ Prestige: ${prestigeLevel}x (${prestigeMultiplier.toFixed(2)}x)\n`;
            text += `└ Streak: ${streak} dia${streak !== 1 ? 's' : ''}\n\n`;

            text += `💰 *FINANÇAS*\n`;
            text += `├ Carteira: ${fmt(me.wallet)}\n`;
            text += `├ Banco: ${fmt(me.bank)}\n`;
            text += `├ Total: ${fmt(total)}\n`;
            text += `└ Emprego: ${me.job ? econ.jobCatalog[me.job]?.name || me.job : 'Desempregado(a)'}\n\n`;

            text += `🎭 *PERSONALIZAÇÃO*\n`;
            text += `├ Classe: ${classeInfo}\n`;
            text += `├ Clã: ${clanInfo}\n`;
            text += `└ Casa: ${houseInfo}\n\n`;

            text += `⚔️ *COMBATE*\n`;
            text += `├ Vitórias: ${battlesWon}\n`;
            text += `├ Derrotas: ${battlesLost}\n`;
            text += `├ Win Rate: ${winRate}%\n`;
            text += `└ Poder: ${me.power || 100}\n\n`;

            text += `🛠️ *HABILIDADES (TOP 3)*\n`;
            topSkills.forEach((sk, i) => {
              const prefixChar = i === topSkills.length - 1 ? '└' : '├';
              const skillName = sk.name.charAt(0).toUpperCase() + sk.name.slice(1);
              text += `${prefixChar} ${skillName}: Lv.${sk.level}\n`;
            });
            text += `\n`;

            text += `👨‍👩‍👧‍👦 *FAMÍLIA & RELACIONAMENTO*\n`;
            if (relationshipEmoji) {
              text += `├ ${relationshipEmoji} Status: ${relationshipType}\n`;
              text += `├ Parceiro(a): ${familySpouse}\n`;
            } else {
              text += `├ 💔 Status: Solteiro(a)\n`;
            }
            text += `└ Filhos: ${familyChildren}\n\n`;

            text += `🏆 *COLECIONÁVEIS*\n`;
            text += `├ Conquistas: ${achievements}\n`;
            text += `├ Pets: ${pets}\n`;
            text += `└ Itens Premium: ${premiumItems}\n\n`;

            text += `⭐ *REPUTAÇÃO*\n`;
            text += `├ Pontos: ${reputation}\n`;
            text += `└ Karma: ${karma}\n\n`;

            text += `💎 Use ${prefix}meustats para ver estatísticas detalhadas`;

            return reply(text, mentions.length > 0 ? { mentions } : undefined);
          }

          if (sub === 'carteira') {
            const total = (me.wallet || 0) + (me.bank || 0);
            return reply(`╭━━━⊱ 👤 *PERFIL FINANCEIRO* 👤 ⊱━━━╮
│
│   *Carteira:* ${fmt(me.wallet)}
│ 🏦 *Banco:* ${fmt(me.bank)}
│   *Total:* ${fmt(total)}
│
│ 💼 *Emprego:* ${me.job ? econ.jobCatalog[me.job]?.name || me.job : 'Desempregado(a)'}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
          }
          if (sub === 'banco') {
            const cap = isFinite(bankCapacity) ? bankCapacity : '∞';
            return reply(`╭━━━⊱ 🏦 *BANCO* 🏦 ⊱━━━╮
│
│ 💰 *Saldo:* ${fmt(me.bank)}
│ 📦 *Capacidade:* ${cap === '∞' ? 'Ilimitada' : fmt(cap)}
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);
          }

          if (sub === 'depositar' || sub === 'dep') {
            const amount = parseAmount(q.split(' ')[0], me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply('❌ Informe um valor válido (ou "all").');
            if (amount > me.wallet) return reply('❌ Você não tem tudo isso na carteira.');
            const cap = isFinite(bankCapacity) ? bankCapacity : Infinity;
            const space = cap - me.bank;
            if (space <= 0) return reply('⚠️ Seu banco está cheio. Compre um Cofre na loja para aumentar a capacidade.');
            const toDep = Math.min(amount, space);
            me.wallet -= toDep; me.bank += toDep;
            saveEconomy(econ);
            return reply(`╭━━━⊱ 💰 *DEPÓSITO* 💰 ⊱━━━╮
│
│ ✅ Depositado: ${fmt(toDep)}
│
│ 🏦 Banco: ${fmt(me.bank)}
│ 💼 Carteira: ${fmt(me.wallet)}
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);
          }
          if (sub === 'sacar' || sub === 'saque') {
            const amount = parseAmount(q.split(' ')[0], me.bank);
            if (!isFinite(amount) || amount <= 0) return reply('❌ Informe um valor válido (ou "all").');
            if (amount > me.bank) return reply('❌ Saldo insuficiente no banco.');
            // TAXA DE SAQUE: 5%
            const taxa = Math.floor(amount * 0.05);
            const received = amount - taxa;
            me.bank -= amount;
            me.wallet += received;
            saveEconomy(econ);
            return reply(`╭━━━⊱ 💳 *SAQUE* 💳 ⊱━━━╮
│
│ 💰 Valor sacado: ${fmt(amount)}
│ 💸 Taxa (5%): ${fmt(taxa)}
│ ✅ Recebido: ${fmt(received)}
│
│ 🏦 Banco: ${fmt(me.bank)}
│ 💼 Carteira: ${fmt(me.wallet)}
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);
          }

          if (sub === 'transferir' || sub === 'pix') {
            if (!mentioned) return reply(`╭━━━⊱ 💸 *TRANSFERÊNCIA* 💸 ⊱━━━╮
│
│ 👥 Marque um usuário e informe
│    o valor a transferir
│
│ ⚠️ *Taxa de transferência: 15%*
│
│ 📝 *Exemplo:*
│ ${prefix}${sub} @user 100
│
╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
            const amount = parseAmount(args.slice(-1)[0], me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply('❌ Informe um valor válido.');
            // TAXA DE TRANSFERÊNCIA: 15%
            const taxa = Math.floor(amount * 0.15);
            const totalNeeded = amount + taxa;
            if (totalNeeded > me.wallet) return reply(`❌ Você não tem saldo suficiente.\n💰 Valor: ${fmt(amount)}\n💸 Taxa (15%): ${fmt(taxa)}\n📊 Total necessário: ${fmt(totalNeeded)}\n💼 Seu saldo: ${fmt(me.wallet)}`);
            const other = getEcoUser(econ, mentioned);
            if (mentioned === sender) return reply('❌ Você não pode transferir para si mesmo.');
            me.wallet -= totalNeeded; // Desconta valor + taxa
            other.wallet += amount; // Destinatário recebe valor sem taxa
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *TRANSFERÊNCIA* ✅ ⊱━━━╮
│
│ 💸 Transferido: ${fmt(amount)}
│ 💰 Taxa (15%): ${fmt(taxa)}
│ 📊 Total debitado: ${fmt(totalNeeded)}
│ 👤 Para: @${getUserName(mentioned)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [mentioned] });
          }

          if (sub === 'loja' || sub === 'lojarps') {
            const items = Object.entries(econ.shop || {});
            if (items.length === 0) return reply('❌ A loja está vazia no momento.');
            let text = '╭━━━⊱ 🛍️ *LOJA DE ITENS* 🛍️ ⊱━━━╮\n│\n';
            for (const [k, it] of items) {
              text += `│ 🔹 *${k}*\n│   ${it.name} — ${fmt(it.price)}\n│\n`;
            }
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Compre com: ${prefix}comprar <item>`;
            return reply(text);
          }
          if (sub === 'comprar' || sub === 'buy') {
            const rawKey = (args[0] || '');
            if (!rawKey) return reply(`╭━━━⊱ 🛒 *COMPRAR* 🛒 ⊱━━━╮
│
│ ❌ Informe o item desejado
│
│ 📝 *Exemplo:*
│ ${prefix}comprar pickaxe_bronze
│
│ 🛍️ Ver loja: ${prefix}loja
│
╰━━━━━━━━━━━━━━━━━━━━╯`);
            // Normaliza a busca do item ignorando acentos e underscores
            const key = findKeyIgnoringAccents(econ.shop || {}, rawKey) || normalizeParam(rawKey).replace(/\s+/g, '_');
            const it = (econ.shop || {})[key];
            if (!it) return reply(`❌ Item não encontrado.\n\n🛍️ Veja a loja com ${prefix}loja`);
            if (me.wallet < it.price) return reply('❌ Saldo insuficiente na carteira.');
            me.wallet -= it.price;
            // Se for ferramenta (picareta), equipa automaticamente
            if (it.type === 'tool' && it.toolType === 'pickaxe') {
              me.tools = me.tools || {};
              me.tools.pickaxe = { tier: it.tier, dur: it.durability, max: it.durability, key };
              saveEconomy(econ);
              return reply(`╭━━━⊱ ✅ *COMPRA* ✅ ⊱━━━╮
│
│ 🛠️ Você comprou e equipou:
│ ${it.name}
│
│ ⚙️ Durabilidade: ${it.durability}
│
╰━━━━━━━━━━━━━━━━━━━━╯`);
            }
            // Caso contrário, vai para o inventário
            me.inventory[key] = (me.inventory[key] || 0) + 1;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *COMPRA* ✅ ⊱━━━╮
│
│ 🎒 Você comprou:
│ ${it.name}
│
│ 💰 Preço: ${fmt(it.price)}
│
╰━━━━━━━━━━━━━━━━━━━━╯`);
          }

          if (sub === 'inventario' || sub === 'inv') {
            const entries = Object.entries(me.inventory || {}).filter(([, q]) => q > 0);
            let text = '╭━━━⊱ 🎒 *INVENTÁRIO* 🎒 ⊱━━━╮\n│\n';
            if (entries.length > 0) {
              for (const [k, q] of entries) {
                const it = (econ.shop || {})[k];
                text += `│ 📦 ${it?.name || k} x${q}\n`;
              }
            } else {
              text += '│ 📭 (vazio)\n';
            }
            text += '│\n';
            // Ferramentas
            const pk = me.tools?.pickaxe;
            text += '╠━━━⊱ 🛠️ *FERRAMENTAS* 🛠️ ⊱━━━╣\n│\n';
            if (pk) {
              const tierName = pk.tier || 'desconhecida';
              const dur = pk.dur ?? 0; const max = pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : 0);
              text += `│ ⛏️ Picareta ${tierName}\n│    Durabilidade: ${dur}/${max}\n`;
            } else {
              text += '│ ⛏️ Picareta — nenhuma\n';
            }
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯';
            return reply(text);
          }

          // Materiais e preços
          if (sub === 'materiais') {
            const mats = me.materials || {};
            const keys = Object.keys(mats).filter(k => mats[k] > 0);
            if (keys.length === 0) return reply('╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n│ 📭 Você não possui materiais\n│\n│ ⛏️ Mine para coletar!\n│ Use: ' + prefix + 'minerar\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯');
            let text = '╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n';
            for (const k of keys) text += `│ 💎 ${k}: ${mats[k]}\n`;
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━╯';
            return reply(text);
          }
          if (sub === 'precos' || sub === 'preços') {
            const mp = econ.materialsPrices || {};
            let text = '╭━━━⊱ 💱 *PREÇOS* 💱 ⊱━━━╮\n│\n│ 💎 *MATERIAIS (unidade)*\n│\n';
            for (const [k, v] of Object.entries(mp)) text += `│ 🔸 ${k}: ${fmt(v)}\n`;
            // Receitas básicas
            const r = econ.recipes || {};
            if (Object.keys(r).length > 0) {
              text += '│\n│ 📜 *RECEITAS*\n│\n';
              for (const [key, rec] of Object.entries(r)) {
                const shopItem = econ.shop?.[key];
                const name = shopItem?.name || key;
                const req = Object.entries(rec.requires || {}).map(([mk, mq]) => `${mk} x${mq}`).join(', ');
                text += `│ 🔨 ${name}\n│    ${req} + ${fmt(rec.gold || 0)}\n`;
              }
            }
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯';
            return reply(text);
          }
          if (sub === 'vender') {
            const matKey = (args[0] || '').toLowerCase();
            if (!matKey) return reply(`╭━━━⊱ 💰 *VENDER MATERIAIS* 💰 ⊱━━━╮
│
│ 📝 *Uso:*
│ ${prefix}vender <material> <qtd|all>
│
│ 💡 *Exemplo:*
│ ${prefix}vender ferro 10
│ ${prefix}vender ouro all
│
│ 💱 Ver preços: ${prefix}precos
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
            const price = (econ.materialsPrices || {})[matKey];
            if (!price) return reply(`❌ Material inválido.\n\n💱 Veja preços com ${prefix}precos`);
            const have = me.materials?.[matKey] || 0;
            if (have <= 0) return reply('❌ Você não possui esse material.');
            const qtyArg = args[1] || 'all';
            const qty = ['all', 'tudo', 'max'].includes((qtyArg || '').toLowerCase()) ? have : parseAmount(qtyArg, have);
            if (!isFinite(qty) || qty <= 0) return reply('❌ Quantidade inválida.');
            const gain = qty * price;
            me.materials[matKey] = have - qty;
            me.wallet += gain;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *VENDA* ✅ ⊱━━━╮
│
│   Vendeu: ${qty}x ${matKey}
│ 💰 Ganhou: ${fmt(gain)}
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);
          }
          if (sub === 'reparar') {
            const pk = getActivePickaxe(me) || me.tools?.pickaxe;
            if (!pk) return reply(`╭━━━⊱ 🛠️ *REPARAR* 🛠️ ⊱━━━╮
│
│ ❌ Você não tem picareta equipada
│
│ 🛍️ Compre uma: ${prefix}loja
│
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
            const kits = me.inventory?.repairkit || 0;
            if (kits <= 0) return reply(`╭━━━⊱ 🔧 *KIT DE REPAROS* 🔧 ⊱━━━╮
│
│ ❌ Você não tem Kit de Reparos
│
│ 🛒 Compre com:
│ ${prefix}comprar repairkit
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`);
            const repair = econ.shop?.repairkit?.effect?.repair || 40;
            const max = pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : pk.dur);
            const before = pk.dur;
            pk.dur = Math.min(max, pk.dur + repair);
            me.inventory.repairkit = kits - 1;
            me.tools.pickaxe = { ...pk, max };
            saveEconomy(econ);
            return reply(`╭━━━⊱ 🛠️ *REPARADO!* 🛠️ ⊱━━━╮
│
│ ⛏️ Picareta reparada
│ 📊 ${before} ➜ ${pk.dur}/${max}
│
│ 🔧 Kits restantes: ${kits - 1}
│
╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
          }
          if (sub === 'desafio') {
            ensureUserChallenge(me);
            const ch = me.challenge;
            if ((args[0] || '').toLowerCase() === 'coletar') {
              if (ch.claimed) return reply('❌ Você já coletou a recompensa de hoje.');
              if (!isChallengeCompleted(me)) return reply('❌ Complete todas as tarefas diárias para coletar.');
              me.wallet += ch.reward;
              ch.claimed = true;
              saveEconomy(econ);
              return reply(`╭━━━⊱ 🎉 *RECOMPENSA!* 🎉 ⊱━━━╮
│
│ ✅ Desafio diário concluído!
│ 💰 Recompensa: ${fmt(ch.reward)}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`);
            }
            const labels = {
              mine: 'Minerações', work: 'Trabalhos', fish: 'Pescarias', explore: 'Explorações', hunt: 'Caçadas', crimeSuccess: 'Crimes bem-sucedidos'
            };
            let text = '╭━━━⊱ 🏅 *DESAFIO DIÁRIO* 🏅 ⊱━━━╮\n│\n';
            for (const t of ch.tasks || []) {
              text += `│ 📋 ${labels[t.type] || t.type}\n│    ${t.progress || 0}/${t.target}\n`;
            }
            text += `│\n│ 🎁 Prêmio: ${fmt(ch.reward)}\n`;
            if (ch.claimed) text += `│ ✅ (coletado)\n`;
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯';
            if (isChallengeCompleted(me) && !ch.claimed) text += `\n\n💡 Use: ${prefix}desafio coletar`;
            return reply(text);
          }

          if (sub === 'apostar' || sub === 'bet') {
            const cdBet = me.cooldowns?.bet || 0;
            if (Date.now() < cdBet) return reply(`⏳ Aguarde ${timeLeft(cdBet)} para apostar novamente.`);
            const amount = parseAmount(args[0], me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply('Valor inválido.');
            if (amount > me.wallet) return reply('Saldo insuficiente.');
            // CASSINO NERFADO: 3% de chance de ganhar (era 47%)
            const win = Math.random() < 0.03;
            if (win) {
              me.wallet += Math.floor(amount * 0.8); // ganha apenas 80% do apostado
              me.cooldowns.bet = Date.now() + 10 * 60 * 1000; // 10 minutos (era 3)
              saveEconomy(econ);
              return reply(`╭───⊃⊱ 🍀 *VITÓRIA RARA!* 🍀 ⊃⊱───╮\n│\n│ 💰 Ganhou: *+${fmt(Math.floor(amount * 0.8))}*\n│ 🎰 Sorte incrível!\n│\n╰─────────────────────╯`);
            }
            me.wallet -= amount;
            me.cooldowns.bet = Date.now() + 10 * 60 * 1000; // 10 minutos (era 3)
            saveEconomy(econ);
            return reply(`╭───⊃⊱ 💥 *PERDEU!* 💥 ⊃⊱───╮\n│\n│ 💸 Perdeu: *-${fmt(amount)}*\n│ 🎰 A casa sempre ganha...\n│\n╰─────────────────────╯`);
          }
          if (sub === 'slots') {
            const cdSlots = me.cooldowns?.slots || 0;
            if (Date.now() < cdSlots) return reply(`⏳ Aguarde ${timeLeft(cdSlots)} para jogar slots novamente.`);
            const amount = parseAmount(args[0] || '100', me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply('Valor inválido.');
            if (amount > me.wallet) return reply('Saldo insuficiente.');
            // SLOTS NERFADO: símbolos com pesos para quase nunca combinar
            const symbols = ['🍒', '🍋', '🍉', '⭐', '🔔', '🍇', '🍊', '🍓']; // mais símbolos = menos chance
            // Cada slot é independente e viciado para não combinar
            const getSlot = (idx) => {
              // Cada posição tem preferência por símbolos diferentes
              const weights = [30, 20, 15, 12, 10, 6, 4, 3];
              const shifted = [...weights.slice(idx * 2), ...weights.slice(0, idx * 2)];
              const total = shifted.reduce((a, b) => a + b, 0);
              let rand = Math.random() * total;
              for (let i = 0; i < symbols.length; i++) {
                rand -= shifted[i];
                if (rand <= 0) return symbols[i];
              }
              return symbols[0];
            };
            const r = [getSlot(0), getSlot(1), getSlot(2)];
            let mult = 0;
            // Jackpot quase impossível (~0.5% real)
            if (r[0] === r[1] && r[1] === r[2]) mult = 2; // multiplicador reduzido (era 3)
            else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1.2; // par paga menos (era 1.5)
            const delta = Math.floor(amount * (mult - 1));
            me.wallet += delta; // delta pode ser negativo
            saveEconomy(econ);
            me.cooldowns.slots = Date.now() + 8 * 60 * 1000; // 8 minutos (era 2)

            let slotText = `╭━━━⊱ 🎰 *SLOTS* 🎰 ⊱━━━╮\n`;
            slotText += `│\n`;
            slotText += `│ ${r.join(' | ')}\n`;
            slotText += `│\n`;
            slotText += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

            if (mult > 1) {
              slotText += `╭━━━⊱ 🎉 *GANHOU!* 🎉 ⊱━━━╮\n`;
              slotText += `│\n`;
              slotText += `│ 💰 Ganhou: *+${fmt(Math.floor(amount * (mult - 1)))}*\n`;
              slotText += `│\n`;
              slotText += `╰━━━━━━━━━━━━━━━━━━━━╯`;
            } else {
              slotText += `╭━━━⊱ 💸 *PERDEU!* 💸 ⊱━━━╮\n`;
              slotText += `│\n`;
              slotText += `│ 💔 Perdeu: *-${fmt(amount)}*\n`;
              slotText += `│\n`;
              slotText += `╰━━━━━━━━━━━━━━━━━━━━╯`;
            }

            return reply(slotText);
          }

          if (sub === 'vagas') {
            let jobs = econ.jobCatalog || {};
            // Se não houver vagas no arquivo de economia, usar catálogo padrão embutido
            if (!jobs || Object.keys(jobs).length === 0) {
              jobs = {
                "estagiario": { name: "Estagiário", min: 80, max: 140 },
                "designer": { name: "Designer", min: 150, max: 250 },
                "programador": { name: "Programador", min: 200, max: 350 },
                "gerente": { name: "Gerente", min: 260, max: 420 }
              };
            }

            let txt = '╭━━━⊱ 💼 *VAGAS DE EMPREGO* 💼 ⊱━━━╮\n│\n';
            Object.entries(jobs).forEach(([k, j]) => {
              txt += `│ 🔹 *${k}*\n│   ${j.name}\n│   💰 ${fmt(j.min)}-${fmt(j.max)}\n│\n`;
            });
            txt += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use: ${prefix}emprego <vaga>`;
            return reply(txt);
          }
          if (sub === 'emprego') {
            const rawKey = (args[0] || '');
            if (!rawKey) return reply(`╭━━━⊱ 💼 *EMPREGO* 💼 ⊱━━━╮
│
│ ❌ Informe a vaga desejada
│
│ 📋 Ver vagas: ${prefix}vagas
│
│ 💡 Exemplo:
│ ${prefix}emprego vendedor
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);

            const defaultJobs = {
              "estagiario": { name: "Estagiário", min: 80, max: 140 },
              "designer": { name: "Designer", min: 150, max: 250 },
              "programador": { name: "Programador", min: 200, max: 350 },
              "gerente": { name: "Gerente", min: 260, max: 420 }
            };

            const jobCatalog = (econ.jobCatalog && Object.keys(econ.jobCatalog).length) ? econ.jobCatalog : defaultJobs;
            // Normaliza a busca da vaga ignorando acentos
            const key = findKeyIgnoringAccents(jobCatalog, rawKey) || normalizeParam(rawKey);
            const job = jobCatalog[key];
            if (!job) return reply('❌ Vaga inexistente. Use ' + prefix + 'vagas para ver disponíveis.');

            // If economy file had no jobCatalog, persist defaults so future queries find them
            if (!econ.jobCatalog || Object.keys(econ.jobCatalog).length === 0) {
              econ.jobCatalog = jobCatalog;
            }

            me.job = key;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *CONTRATADO!* ✅ ⊱━━━╮
│
│ 💼 Emprego: ${job.name}
│ 💰 Ganhos: ${fmt(job.min)}-${fmt(job.max)}
│
│ 🏢 Use ${prefix}trabalhar
│    para receber seu salário!
│
╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
          }
          if (sub === 'demitir') {
            me.job = null;
            saveEconomy(econ);
            return reply(`╭━━━⊱ 👋 *DEMISSÃO* 👋 ⊱━━━╮
│
│ ✅ Você pediu demissão
│
│ 💼 Veja novas vagas: ${prefix}vagas
│
╰━━━━━━━━━━━━━━━━━━━━━━╯`);
          }

          if (sub === 'pescar' || sub === 'fish') {
            const cd = me.cooldowns?.fish || 0; if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para pescar novamente.`);
            const base = 80 + Math.floor(Math.random() * 121); // 80-200 (BALANCEADO)
            const skillB = getSkillBonus(me, 'fishing');
            const bonus = Math.floor(base * ((fishBonus || 0) + skillB)); const total = base + bonus;
            me.wallet += total; me.cooldowns.fish = Date.now() + 12 * 60 * 1000; // 12 min
            addSkillXP(me, 'fishing', 1); updateChallenge(me, 'fish', 1, true); updatePeriodChallenge(me, 'fish', 1, true);

            // Adiciona peixe como ingrediente
            me.ingredients = me.ingredients || {};
            const fishQty = 2 + Math.floor(Math.random() * 3); // 2-4 peixes
            me.ingredients.peixe = (me.ingredients.peixe || 0) + fishQty;

            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalFish = (me.stats.totalFish || 0) + 1;
            me.stats.fishCount = (me.stats.fishCount || 0) + 1;

            saveEconomy(econ);

            let fishText = `╭━━━⊱ 🎣 *PESCOU!* 🎣 ⊱━━━╮\n`;
            fishText += `│\n`;
            fishText += `│ 💰 Ganhou: *${fmt(total)}*\n`;
            if (bonus > 0) {
              fishText += `│ ✨ Bônus: *+${fmt(bonus)}*\n`;
            }
            fishText += `│ 🐟 Peixe: *+${fishQty}*\n`;
            fishText += `│\n`;
            fishText += `╰━━━━━━━━━━━━━━━━━━━━━╯`;

            return reply(fishText);
          }

          if (sub === 'explorar' || sub === 'explore') {
            const cd = me.cooldowns?.explore || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para explorar novamente.`);
            const base = 100 + Math.floor(Math.random() * 151); // 100-250 (BALANCEADO)
            const skillB = getSkillBonus(me, 'exploring');
            const bonus = Math.floor(base * ((exploreBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.cooldowns.explore = Date.now() + 15 * 60 * 1000; // 15 min
            addSkillXP(me, 'exploring', 1);
            updateChallenge(me, 'explore', 1, true);
            updatePeriodChallenge(me, 'explore', 1, true);
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalExplore = (me.stats.totalExplore || 0) + 1;
            me.stats.exploreCount = (me.stats.exploreCount || 0) + 1;

            // Adiciona materiais da exploração
            const matsGain = {};
            if (Math.random() < 0.6) matsGain.madeira = 1 + Math.floor(Math.random() * 3); // 60% chance, 1-3 madeira
            if (Math.random() < 0.3) matsGain.corda = 1; // 30% chance, 1 corda
            if (Math.random() < 0.4) matsGain.linha = 1 + Math.floor(Math.random() * 2); // 40% chance, 1-2 linha
            if (Math.random() < 0.2) matsGain.cristal = 1; // 20% chance, 1 cristal (raro)

            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);

            saveEconomy(econ);

            let exploreText = `╭━━━⊱ 🧭 *EXPLOROU!* 🧭 ⊱━━━╮\n`;
            exploreText += `│\n`;
            exploreText += `│ 💰 Ganhou: *${fmt(total)}*\n`;
            if (bonus > 0) {
              exploreText += `│ ✨ Bônus: *+${fmt(bonus)}*\n`;
            }
            if (Object.keys(matsGain).length > 0) {
              exploreText += `│ 📦 Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ') + `\n`;
            }
            exploreText += `│\n`;
            exploreText += `╰━━━━━━━━━━━━━━━━━━━━━╯`;

            return reply(exploreText);
          }

          if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
            const cd = me.cooldowns?.hunt || 0; if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para caçar novamente.`);
            const base = 22 + Math.floor(Math.random() * 34); // 22-55 (era 45-120)
            const skillB = getSkillBonus(me, 'hunting');
            const bonus = Math.floor(base * ((huntBonus || 0) + skillB) * 0.4); const total = base + bonus; // bônus reduzido 60%
            me.wallet += total; me.cooldowns.hunt = Date.now() + 22 * 60 * 1000; // 22 min (era 6 min)
            addSkillXP(me, 'hunting', 1); updateChallenge(me, 'hunt', 1, true); updatePeriodChallenge(me, 'hunt', 1, true);

            // Adiciona carne como ingrediente
            me.ingredients = me.ingredients || {};
            const meatQty = 1 + (Math.random() < 0.25 ? 1 : 0); // 1-2 carnes (25% chance de pegar 2)
            me.ingredients.carne = (me.ingredients.carne || 0) + meatQty;

            // Adiciona materiais da caça
            const huntMats = {};
            if (Math.random() < 0.5) huntMats.couro = 1 + Math.floor(Math.random() * 2); // 50% chance, 1-2 couro

            for (const [mk, mq] of Object.entries(huntMats)) giveMaterial(me, mk, mq);

            saveEconomy(econ);

            let huntText = `╭━━━⊱ 🏹 *CAÇOU!* 🏹 ⊱━━━╮\n`;
            huntText += `│\n`;
            huntText += `│ 💰 Ganhou: *${fmt(total)}*\n`;
            if (bonus > 0) {
              huntText += `│ ✨ Bônus: *+${fmt(bonus)}*\n`;
            }
            huntText += `│ 🥩 Carne: *+${meatQty}*\n`;
            if (Object.keys(huntMats).length > 0) {
              huntText += `│ 📦 Materiais: ` + Object.entries(huntMats).map(([k, q]) => `${k} x${q}`).join(', ') + `\n`;
            }
            huntText += `│\n`;
            huntText += `╰━━━━━━━━━━━━━━━━━━━━━╯`;

            return reply(huntText);
          }

          if (sub === 'forjar' || sub === 'forge') {
            if (!me.materials) me.materials = {};
            if (!me.inventory) me.inventory = {};
            // Mostra receitas disponíveis se não especificar item
            const rawCraftKey = (args[0] || '');
            if (!rawCraftKey) {
              let text = `╭━━━⊱ ⚒️ *RECEITAS DE FORJA* ⊱━━━╮\n`;
              text += `│ 💰 Seu gold: ${fmt(me.wallet)}\n`;
              text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

              const recipes = econ.recipes || {};
              if (Object.keys(recipes).length === 0) {
                text += `❌ Nenhuma receita disponível no momento.`;
              } else {
                text += `📜 *RECEITAS DISPONÍVEIS*\n\n`;
                for (const [key, recipe] of Object.entries(recipes)) {
                  const item = econ.shop[key];
                  if (!item) continue;

                  text += `🔸 *${item.name || key}*\n`;
                  text += `   💰 Custo: ${fmt(recipe.gold || 0)}\n`;

                  if (recipe.requires && Object.keys(recipe.requires).length > 0) {
                    const materials = Object.entries(recipe.requires).map(([mat, qty]) => `${mat} x${qty}`).join(', ');
                    text += `   📦 Materiais: ${materials}\n`;
                  }
                  text += `   💡 Forjar: ${prefix}forjar ${key}\n\n`;
                }
              }

              text += `💡 *Dica:* Use ${prefix}materiais para ver seus materiais disponíveis`;
              return reply(text);
            }

            // Modo 1: craft a partir de receitas
            // Normaliza o nome da receita ignorando acentos
            const craftKey = findKeyIgnoringAccents(econ.recipes || {}, rawCraftKey) || normalizeParam(rawCraftKey);
            if (craftKey && (econ.recipes || {})[craftKey]) {
              const rec = econ.recipes[craftKey];
              const reqs = rec.requires || {};
              // Verifica materiais
              for (const [mk, mq] of Object.entries(reqs)) {
                if ((me.materials?.[mk] || 0) < mq) return reply(`Faltam materiais: ${mk} x${mq}. Veja ${prefix}materiais.`);
              }
              // Verifica gold
              const goldCost = rec.gold || 0;
              if (me.wallet < goldCost) return reply(`Você precisa de ${fmt(goldCost)} para forjar.`);
              // Consome
              for (const [mk, mq] of Object.entries(reqs)) { me.materials[mk] -= mq; }
              me.wallet -= goldCost;
              const item = (econ.shop || {})[craftKey];
              if (item?.type === 'tool' && item.toolType === 'pickaxe') {
                me.tools.pickaxe = { tier: item.tier, dur: item.durability, max: item.durability, key: craftKey };
                saveEconomy(econ);
                return reply(`⚒️ Você forjou e equipou ${item.name}! Durabilidade ${item.durability}.`);
              }
              // Senão, adiciona ao inventário
              me.inventory[craftKey] = (me.inventory[craftKey] || 0) + 1;
              saveEconomy(econ);
              return reply(`⚒️ Você forjou ${item?.name || craftKey}!`);
            }
            // Modo 2: minigame de forja (antigo) - NERFADO
            const cd = me.cooldowns?.forge || 0; if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para forjar novamente.`);
            const cost = 150; if (me.wallet < cost) return reply(`Você precisa de ${fmt(cost)} para materiais.`); // custo aumentado (era 100)
            me.wallet -= cost;
            const success = Math.random() < 0.35; // 35% chance (era 60%)
            if (success) {
              const gain = 80 + Math.floor(Math.random() * 101); // 80-180 (era 180-400)
              const bonus = Math.floor(gain * (forgeBonus || 0) * 0.5); const total = gain + bonus; // bônus reduzido
              me.wallet += total; me.cooldowns.forge = Date.now() + 25 * 60 * 1000; saveEconomy(econ); // 25 min (era 6 min)
              return reply(`⚒️ Forja bem-sucedida! Lucro ${fmt(total)} ${bonus > 0 ? `(bônus ${fmt(bonus)})` : ''}.`);
            } else {
              me.cooldowns.forge = Date.now() + 25 * 60 * 1000; saveEconomy(econ); // 25 min (era 6 min)
              return reply(`🔥 A forja falhou e os materiais foram perdidos.`);
            }
          }

          if (sub === 'crime') {
            const cd = me.cooldowns?.crime || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para tentar de novo.`);
            const success = Math.random() < 0.18; // 18% sucesso (era 35%)
            if (success) {
              const base = 40 + Math.floor(Math.random() * 61); // 40-100 (era 90-230)
              const skillB = getSkillBonus(me, 'crime');
              const gain = Math.floor(base * (1 + skillB * 0.3)); // skill bônus reduzido
              me.wallet += gain;
              me.cooldowns.crime = Date.now() + 30 * 60 * 1000; // 30 min
              addSkillXP(me, 'crime', 1);
              updateChallenge(me, 'crimeSuccess', 1, true);
              updatePeriodChallenge(me, 'crimeSuccess', 1, true);
              // Rastrear stats
              if (!me.stats) me.stats = {};
              me.stats.totalCrimes = (me.stats.totalCrimes || 0) + 1;
              saveEconomy(econ);
              return reply(`╭━━━⊱ 🕵️ *CRIME* 🕵️ ⊱━━━╮
│
│ ✅ Crime bem-sucedido!
│ 💰 Lucrou: ${fmt(gain)}
│
│ ⚠️ Cuidado para não ser pego!
│
╰━━━━━━━━━━━━━━━━━━━━━╯`);
            } else {
              const fine = 200 + Math.floor(Math.random() * 401); // multa maior: 200-600 (era 120-320)
              const pay = Math.min(me.wallet, fine);
              me.wallet -= pay;
              me.cooldowns.crime = Date.now() + 30 * 60 * 1000; // 30 min (era 10 min)
              saveEconomy(econ);
              return reply(`╭━━━⊱ 🚔 *PEGO!* 🚔 ⊱━━━╮
│
│ ❌ Você foi pego pela polícia!
│ 💸 Multa: ${fmt(pay)}
│
╰━━━━━━━━━━━━━━━━━━━━╯`);
            }
          }

          // ===== SISTEMA DE COZINHAR =====
          if (sub === 'receitas') {
            // Inicializa receitas culinárias se não existir
            if (!econ.cookingRecipes) {
              econ.cookingRecipes = {
                pao: { name: '🍞 Pão', requires: { trigo: 3 }, gold: 10, sellPrice: 50, energy: 10 },
                sopa: { name: '🍲 Sopa', requires: { cenoura: 2, batata: 2 }, gold: 15, sellPrice: 80, energy: 20 },
                salada: { name: '🥗 Salada', requires: { alface: 2, tomate: 2 }, gold: 12, sellPrice: 60, energy: 15 },
                bolo: { name: '🍰 Bolo', requires: { trigo: 5, ovo: 3 }, gold: 25, sellPrice: 120, energy: 30 },
                pizza: { name: '🍕 Pizza', requires: { trigo: 4, tomate: 3, queijo: 2 }, gold: 35, sellPrice: 150, energy: 40 },
                hamburguer: { name: '🍔 Hambúrguer', requires: { carne: 2, trigo: 3, alface: 1 }, gold: 40, sellPrice: 180, energy: 50 },
                sushi: { name: '🍣 Sushi', requires: { peixe: 4, arroz: 3 }, gold: 50, sellPrice: 200, energy: 45 },
                macarrao: { name: '🍝 Macarrão', requires: { trigo: 3, tomate: 2 }, gold: 20, sellPrice: 90, energy: 25 }
              };
              saveEconomy(econ);
            }

            let text = '📖 *RECEITAS CULINÁRIAS*\n\n';
            for (const [key, rec] of Object.entries(econ.cookingRecipes)) {
              const ingredients = Object.entries(rec.requires).map(([ing, qty]) => `${ing} x${qty}`).join(', ');
              text += `${rec.name}\n`;
              text += `  📦 Ingredientes: ${ingredients}\n`;
              text += `  💰 Custo: ${fmt(rec.gold)}\n`;
              text += `  💵 Venda: ${fmt(rec.sellPrice)}\n`;
              text += `  ⚡ Energia: +${rec.energy}\n`;
              text += `  🍳 Cozinhar: ${prefix}cozinhar ${key}\n\n`;
            }
            text += `💡 *Dica:* Plante ingredientes com ${prefix}plantar`;
            return reply(text);
          }

          if (sub === 'cozinhar' || sub === 'cook') {
            const recipeKey = (args[0] || '').toLowerCase();

            // Inicializa receitas se não existir
            if (!econ.cookingRecipes) {
              econ.cookingRecipes = {
                pao: { name: '🍞 Pão', requires: { trigo: 3 }, gold: 10, sellPrice: 50, energy: 10 },
                sopa: { name: '🍲 Sopa', requires: { cenoura: 2, batata: 2 }, gold: 15, sellPrice: 80, energy: 20 },
                salada: { name: '🥗 Salada', requires: { alface: 2, tomate: 2 }, gold: 12, sellPrice: 60, energy: 15 },
                bolo: { name: '🍰 Bolo', requires: { trigo: 5, ovo: 3 }, gold: 25, sellPrice: 120, energy: 30 },
                pizza: { name: '🍕 Pizza', requires: { trigo: 4, tomate: 3, queijo: 2 }, gold: 35, sellPrice: 150, energy: 40 },
                hamburguer: { name: '🍔 Hambúrguer', requires: { carne: 2, trigo: 3, alface: 1 }, gold: 40, sellPrice: 180, energy: 50 },
                sushi: { name: '🍣 Sushi', requires: { peixe: 4, arroz: 3 }, gold: 50, sellPrice: 200, energy: 45 },
                macarrao: { name: '🍝 Macarrão', requires: { trigo: 3, tomate: 2 }, gold: 20, sellPrice: 90, energy: 25 }
              };
            }

            if (!recipeKey) {
              return reply(`👨‍🍳 *SISTEMA DE COZINHA*\n\n📖 Veja as receitas disponíveis: ${prefix}receitas\n🍳 Cozinhar: ${prefix}cozinhar <receita>\n\n💡 Exemplo: ${prefix}cozinhar pao`);
            }

            const recipe = econ.cookingRecipes[recipeKey];
            if (!recipe) {
              return reply(`❌ Receita não encontrada! Use ${prefix}receitas para ver todas as receitas disponíveis.`);
            }

            // Verifica cooldown
            const cd = me.cooldowns?.cook || 0;
            if (Date.now() < cd) {
              return reply(`⏳ Você ainda está cozinhando! Aguarde ${timeLeft(cd)}.`);
            }

            // Verifica gold
            if (me.wallet < recipe.gold) {
              return reply(`💰 Você precisa de ${fmt(recipe.gold)} para cozinhar ${recipe.name}. Saldo atual: ${fmt(me.wallet)}`);
            }

            // Verifica ingredientes
            me.ingredients = me.ingredients || {};
            for (const [ing, qty] of Object.entries(recipe.requires)) {
              if ((me.ingredients[ing] || 0) < qty) {
                return reply(`📦 Ingredientes insuficientes! Você precisa de ${ing} x${qty}, mas tem apenas x${me.ingredients[ing] || 0}.\n\n🌱 Plante ingredientes com ${prefix}plantar`);
              }
            }

            // Consome recursos
            me.wallet -= recipe.gold;
            for (const [ing, qty] of Object.entries(recipe.requires)) {
              me.ingredients[ing] -= qty;
            }

            // Adiciona comida ao inventário
            me.cookedFood = me.cookedFood || {};
            me.cookedFood[recipeKey] = (me.cookedFood[recipeKey] || 0) + 1;

            // Skill e desafios
            addSkillXP(me, 'cooking', 2);
            updateChallenge(me, 'cook', 1, true);
            updatePeriodChallenge(me, 'cook', 1, true);

            // Atualiza progresso de missões diárias
            updateQuestProgress(me, 'cook', 1);

            // Cooldown de 3 minutos
            me.cooldowns.cook = Date.now() + 3 * 60 * 1000;

            saveEconomy(econ);

            return reply(`👨‍🍳 *COZINHA CONCLUÍDA!*\n\n${recipe.name} preparado com sucesso!\n⚡ Energia: +${recipe.energy}\n💵 Valor de venda: ${fmt(recipe.sellPrice)}\n\n🍴 Use ${prefix}comer ${recipeKey} para consumir\n💰 Use ${prefix}vendercomida ${recipeKey} para vender`);
          }

          // ===== SISTEMA DE PLANTAÇÃO =====
          if (sub === 'plantacao' || sub === 'plantação' || sub === 'horta') {
            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };

            const now = Date.now();
            let text = '🌾 *MINHA PLANTAÇÃO*\n\n';
            text += `📊 Terrenos: ${me.farm.plots.length}/${me.farm.maxPlots}\n\n`;

            if (me.farm.plots.length === 0) {
              text += '🌱 Sua plantação está vazia!\n\n';
            } else {
              me.farm.plots.forEach((plot, idx) => {
                const timeLeft = plot.readyAt - now;
                const isReady = timeLeft <= 0;
                const seed = econ.seeds?.[plot.seed] || { name: plot.seed, growTime: 600000, yield: { [plot.seed]: 1 } };

                text += `🌱 *Terreno ${idx + 1}*\n`;
                text += `  Semente: ${seed.name}\n`;
                if (isReady) {
                  text += `  ✅ Pronto para colher!\n`;
                } else {
                  const mins = Math.ceil(timeLeft / 60000);
                  text += `  ⏳ Pronto em: ${mins} min\n`;
                }
                text += `\n`;
              });
            }

            text += `\n💡 *Comandos:*\n`;
            text += `🌱 Plantar: ${prefix}plantar <semente>\n`;
            text += `🌾 Colher: ${prefix}colher\n`;
            text += `📦 Sementes: ${prefix}sementes\n`;

            return reply(text);
          }

          if (sub === 'plantar' || sub === 'plant' || sub === 'farm') {
            const seedKey = (args[0] || '').toLowerCase();

            // Inicializa sistema de sementes
            if (!econ.seeds) {
              econ.seeds = {
                trigo: { name: '🌾 Trigo', cost: 20, growTime: 5 * 60 * 1000, yield: { trigo: 3 } },
                cenoura: { name: '🥕 Cenoura', cost: 15, growTime: 4 * 60 * 1000, yield: { cenoura: 2 } },
                batata: { name: '🥔 Batata', cost: 15, growTime: 4 * 60 * 1000, yield: { batata: 2 } },
                tomate: { name: '🍅 Tomate', cost: 18, growTime: 6 * 60 * 1000, yield: { tomate: 3 } },
                alface: { name: '🥬 Alface', cost: 12, growTime: 3 * 60 * 1000, yield: { alface: 2 } },
                milho: { name: '🌽 Milho', cost: 25, growTime: 7 * 60 * 1000, yield: { milho: 4 } },
                arroz: { name: '🌾 Arroz', cost: 22, growTime: 8 * 60 * 1000, yield: { arroz: 4 } },
                cana: { name: '🌿 Cana-de-açúcar', cost: 30, growTime: 10 * 60 * 1000, yield: { acucar: 5 } },
                galinha: { name: '🐔 Galinha', cost: 35, growTime: 15 * 60 * 1000, yield: { ovo: 2 } },
                vaca: { name: '🐄 Vaca', cost: 50, growTime: 20 * 60 * 1000, yield: { queijo: 3 } }
              };
              saveEconomy(econ);
            }

            if (!seedKey) {
              let text = '🌱 *SISTEMA DE PLANTAÇÃO*\n\n';
              text += '📦 *Sementes Disponíveis:*\n\n';
              for (const [key, seed] of Object.entries(econ.seeds)) {
                const mins = Math.floor(seed.growTime / 60000);
                const yieldText = Object.entries(seed.yield).map(([k, v]) => `${k} x${v}`).join(', ');
                text += `${seed.name}\n`;
                text += `  💰 Custo: ${fmt(seed.cost)}\n`;
                text += `  ⏱️ Tempo: ${mins} min\n`;
                text += `  🌾 Colheita: ${yieldText}\n\n`;
              }
              text += `🌱 Plantar: ${prefix}plantar <semente>\n`;
              text += `💡 Exemplo: ${prefix}plantar trigo`;
              return reply(text);
            }

            const seed = econ.seeds[seedKey];
            if (!seed) {
              return reply(`❌ Semente não encontrada! Use ${prefix}plantar para ver as sementes disponíveis.`);
            }

            // Inicializa fazenda do usuário
            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };

            // Verifica se tem espaço
            if (me.farm.plots.length >= me.farm.maxPlots) {
              return reply(`🌾 Todos os seus terrenos estão ocupados! Aguarde a colheita ou expanda sua fazenda.\n\n🌾 Use ${prefix}colher para colher plantas prontas`);
            }

            // Verifica gold
            if (me.wallet < seed.cost) {
              return reply(`💰 Você precisa de ${fmt(seed.cost)} para plantar ${seed.name}. Saldo: ${fmt(me.wallet)}`);
            }

            // Planta
            me.wallet -= seed.cost;
            const now = Date.now();
            me.farm.plots.push({
              seed: seedKey,
              plantedAt: now,
              readyAt: now + seed.growTime
            });

            // Skill
            addSkillXP(me, 'farming', 1);
            updateChallenge(me, 'plant', 1, true);
            updatePeriodChallenge(me, 'plant', 1, true);

            saveEconomy(econ);

            const mins = Math.floor(seed.growTime / 60000);
            return reply(`🌱 ${seed.name} plantado com sucesso!\n\n⏱️ Estará pronto para colher em ${mins} minutos.\n🌾 Terrenos ocupados: ${me.farm.plots.length}/${me.farm.maxPlots}\n\n💡 Use ${prefix}horta para ver suas plantações`);
          }

          if (sub === 'colher' || sub === 'harvest') {
            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };

            if (me.farm.plots.length === 0) {
              return reply(`🌾 Você não tem nada plantado!\n\n🌱 Use ${prefix}plantar <semente> para começar a cultivar.`);
            }

            const now = Date.now();
            const readyPlots = me.farm.plots.filter(plot => plot.readyAt <= now);

            if (readyPlots.length === 0) {
              const nextReady = Math.min(...me.farm.plots.map(p => p.readyAt));
              const timeLeft = Math.ceil((nextReady - now) / 60000);
              return reply(`⏳ Nenhuma planta está pronta para colher ainda.\n\n🕐 Próxima colheita em: ${timeLeft} minuto(s)\n\n💡 Use ${prefix}horta para ver o status de todas as plantações`);
            }

            // Colhe todas as plantas prontas
            me.ingredients = me.ingredients || {};
            let harvestedText = '';
            let totalValue = 0;

            readyPlots.forEach(plot => {
              const seed = econ.seeds?.[plot.seed];
              if (seed && seed.yield) {
                for (const [ingredient, qty] of Object.entries(seed.yield)) {
                  me.ingredients[ingredient] = (me.ingredients[ingredient] || 0) + qty;
                  harvestedText += `${ingredient} x${qty}, `;
                  totalValue += qty * 10; // Valor estimado
                }
              }
            });

            // Remove plantas colhidas
            me.farm.plots = me.farm.plots.filter(plot => plot.readyAt > now);

            // Skill e desafios
            addSkillXP(me, 'farming', readyPlots.length * 2);
            updateChallenge(me, 'harvest', readyPlots.length, true);
            updatePeriodChallenge(me, 'harvest', readyPlots.length, true);

            // Atualiza progresso de missões diárias (coletar recursos)
            updateQuestProgress(me, 'gather', readyPlots.length);

            saveEconomy(econ);

            harvestedText = harvestedText.slice(0, -2); // Remove última vírgula

            return reply(`🌾 *COLHEITA CONCLUÍDA!*\n\n✅ Plantas colhidas: ${readyPlots.length}\n📦 Ingredientes obtidos:\n${harvestedText}\n\n💵 Valor estimado: ${fmt(totalValue)}\n🌱 Terrenos livres: ${me.farm.maxPlots - me.farm.plots.length}/${me.farm.maxPlots}\n\n👨‍🍳 Use ${prefix}receitas para ver o que pode cozinhar!`);
          }

          // ===== COMANDOS COMPLEMENTARES DE COZINHA =====
          if (sub === 'ingredientes') {
            me.ingredients = me.ingredients || {};
            const entries = Object.entries(me.ingredients).filter(([, qty]) => qty > 0);

            if (entries.length === 0) {
              return reply(`📦 *INGREDIENTES*\n\nVocê não possui ingredientes.\n\n🌱 Plante com ${prefix}plantar para conseguir ingredientes!`);
            }

            let text = '📦 *MEUS INGREDIENTES*\n\n';
            for (const [ing, qty] of entries) {
              text += `• ${ing}: x${qty}\n`;
            }
            text += `\n👨‍🍳 Use ${prefix}receitas para ver o que pode cozinhar`;
            return reply(text);
          }

          if (sub === 'comer' || sub === 'eat') {
            const foodKey = (args[0] || '').toLowerCase();

            me.cookedFood = me.cookedFood || {};

            if (!foodKey) {
              const entries = Object.entries(me.cookedFood).filter(([, qty]) => qty > 0);
              if (entries.length === 0) {
                return reply(`🍽️ Você não tem comida preparada.\n\n👨‍🍳 Cozinhe algo com ${prefix}cozinhar`);
              }

              let text = '🍽️ *COMIDAS PREPARADAS*\n\n';
              for (const [key, qty] of entries) {
                const recipe = econ.cookingRecipes?.[key];
                if (recipe) {
                  text += `${recipe.name} x${qty}\n`;
                  text += `  ⚡ Energia: +${recipe.energy}\n`;
                  text += `  💵 Valor: ${fmt(recipe.sellPrice)}\n\n`;
                }
              }
              text += `🍴 Comer: ${prefix}comer <comida>\n`;
              text += `💰 Vender: ${prefix}vendercomida <comida>`;
              return reply(text);
            }

            if (!me.cookedFood[foodKey] || me.cookedFood[foodKey] <= 0) {
              return reply(`❌ Você não tem ${foodKey} preparado.\n\n👨‍🍳 Cozinhe com ${prefix}cozinhar ${foodKey}`);
            }

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) {
              return reply('❌ Receita não encontrada.');
            }

            // Consome a comida
            me.cookedFood[foodKey] -= 1;

            // Adiciona energia (pode ser usado para reduzir cooldowns ou dar bônus)
            me.energy = (me.energy || 0) + recipe.energy;

            // Skill
            addSkillXP(me, 'cooking', 1);

            saveEconomy(econ);

            return reply(`😋 *DELICIOSO!*\n\nVocê comeu ${recipe.name}!\n⚡ Energia: +${recipe.energy}\n💪 Energia total: ${me.energy}\n\n💡 Quanto mais energia, mais bônus você recebe!`);
          }

          if (sub === 'vendercomida') {
            const foodKey = (args[0] || '').toLowerCase();

            me.cookedFood = me.cookedFood || {};

            if (!foodKey) {
              return reply(`💰 *VENDER COMIDA*\n\nUse: ${prefix}vendercomida <comida>\n\n💡 Veja suas comidas com ${prefix}comer`);
            }

            const qty = parseInt(args[1]) || 1;

            if (!me.cookedFood[foodKey] || me.cookedFood[foodKey] < qty) {
              return reply(`❌ Você não tem ${qty}x ${foodKey}.\n\n🍽️ Você tem: ${me.cookedFood[foodKey] || 0}`);
            }

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) {
              return reply('❌ Receita não encontrada.');
            }

            const totalValue = recipe.sellPrice * qty;
            me.cookedFood[foodKey] -= qty;
            me.wallet += totalValue;

            saveEconomy(econ);

            return reply(`💰 *VENDA CONCLUÍDA!*\n\nVocê vendeu ${qty}x ${recipe.name}\n💵 Ganhou: ${fmt(totalValue)}\n💼 Carteira: ${fmt(me.wallet)}`);
          }

          if (sub === 'sementes') {
            // Inicializa sementes se não existir
            if (!econ.seeds) {
              econ.seeds = {
                trigo: { name: '🌾 Trigo', cost: 20, growTime: 5 * 60 * 1000, yield: { trigo: 3 } },
                cenoura: { name: '🥕 Cenoura', cost: 15, growTime: 4 * 60 * 1000, yield: { cenoura: 2 } },
                batata: { name: '🥔 Batata', cost: 15, growTime: 4 * 60 * 1000, yield: { batata: 2 } },
                tomate: { name: '🍅 Tomate', cost: 18, growTime: 6 * 60 * 1000, yield: { tomate: 3 } },
                alface: { name: '🥬 Alface', cost: 12, growTime: 3 * 60 * 1000, yield: { alface: 2 } },
                milho: { name: '🌽 Milho', cost: 25, growTime: 7 * 60 * 1000, yield: { milho: 4 } },
                arroz: { name: '🌾 Arroz', cost: 22, growTime: 8 * 60 * 1000, yield: { arroz: 4 } },
                cana: { name: '🌿 Cana-de-açúcar', cost: 30, growTime: 10 * 60 * 1000, yield: { acucar: 5 } }
              };
              saveEconomy(econ);
            }

            let text = '🌱 *CATÁLOGO DE SEMENTES*\n\n';
            for (const [key, seed] of Object.entries(econ.seeds)) {
              const mins = Math.floor(seed.growTime / 60000);
              const yieldText = Object.entries(seed.yield).map(([k, v]) => `${k} x${v}`).join(', ');
              text += `${seed.name}\n`;
              text += `  💰 Custo: ${fmt(seed.cost)}\n`;
              text += `  ⏱️ Crescimento: ${mins} min\n`;
              text += `  🌾 Colheita: ${yieldText}\n`;
              text += `  🌱 Plantar: ${prefix}plantar ${key}\n\n`;
            }
            text += `💡 *Dica:* Use ${prefix}horta para ver suas plantações`;
            return reply(text);
          }

          if (sub === 'minerar' || sub === 'mine') {
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para minerar novamente.`);
            const pk = getActivePickaxe(me);
            if (!pk) return reply(`⛏️ Você precisa de uma picareta para minerar. Compre na ${prefix}loja (ex: ${prefix}comprar pickaxe_bronze) ou repare com ${prefix}reparar.`);
            // Cálculo de ouro com base na picareta e bônus (BALANCEADO)
            const tierMult = PICKAXE_TIER_MULT[pk.tier] || 1.0;
            const base = 100 + Math.floor(Math.random() * 101); // 100-200 (AUMENTADO)
            const skillB = getSkillBonus(me, 'mining');
            const raw = Math.floor(base * tierMult);
            const bonus = Math.floor(raw * ((mineBonus || 0) + skillB));
            const total = raw + bonus;
            me.wallet += total;
            // Quedas de materiais (chances balanceadas)
            let drops = { pedra: 2 + Math.floor(Math.random() * 3) }; // 2-4
            if (pk.tier === 'ferro' || pk.tier === 'diamante') {
              drops.ferro = (drops.ferro || 0) + 1 + Math.floor(Math.random() * 2); // 1-2
              drops.carvao = (drops.carvao || 0) + (Math.random() < 0.4 ? 1 : 0); // 40% chance
            }
            if (pk.tier === 'diamante') {
              drops.ferro = (drops.ferro || 0) + (Math.random() < 0.7 ? 1 : 0); // 70% chance de +1
              drops.ouro = (drops.ouro || 0) + (Math.random() < 0.3 ? 1 : 0); // 30% chance
              drops.carvao = (drops.carvao || 0) + (Math.random() < 0.6 ? 1 : 0); // 60% chance
              if (Math.random() < 0.1) drops.diamante = (drops.diamante || 0) + 1; // 10% chance
            }
            for (const [mk, mq] of Object.entries(drops)) if (mq > 0) giveMaterial(me, mk, mq);
            // Durabilidade
            const before = pk.dur; pk.dur = Math.max(0, pk.dur - 1);
            me.tools.pickaxe = { ...pk, max: pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : pk.dur) };
            me.cooldowns.mine = Date.now() + 10 * 60 * 1000; // 10 min
            addSkillXP(me, 'mining', 1); updateChallenge(me, 'mine', 1, true); updatePeriodChallenge(me, 'mine', 1, true);
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalMine = (me.stats.totalMine || 0) + 1;
            me.stats.mineCount = (me.stats.mineCount || 0) + 1;
            saveEconomy(econ);
            let dropTxt = Object.entries(drops).filter(([, q]) => q > 0).map(([k, q]) => `${k} x${q}`).join(', ');
            const broke = pk.dur === 0 && before > 0;
            return reply(`⛏️ Você minerou e ganhou ${fmt(total)} ${bonus > 0 ? `(bônus ${fmt(bonus)})` : ''}!\n📦 Drops: ${dropTxt || '—'}\n🛠️ Picareta: ${pk.dur}/${me.tools.pickaxe.max}${broke ? ' — quebrou!' : ''}`);
          }

          if (sub === 'trabalhar' || sub === 'work') {
            const cd = me.cooldowns?.work || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para trabalhar novamente.`);
            const base = 150 + Math.floor(Math.random() * 151); // 150-300 (AUMENTADO para economia balanceada)
            const skillB = getSkillBonus(me, 'working');
            const bonus = Math.floor(base * (workBonus + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.cooldowns.work = Date.now() + 15 * 60 * 1000; // 15 min
            addSkillXP(me, 'working', 1); updateChallenge(me, 'work', 1, true); updatePeriodChallenge(me, 'work', 1, true);
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalWork = (me.stats.totalWork || 0) + 1;
            me.stats.workCount = (me.stats.workCount || 0) + 1;
            saveEconomy(econ);
            return reply(`💼 Você trabalhou e recebeu ${fmt(total)} ${bonus > 0 ? `(bônus ${fmt(bonus)})` : ''}!`);
          }

          // ===== Mercado entre usuários =====
          if (sub === 'mercado') {
            const items = econ.market || [];
            if (items.length === 0) return reply('🛒 O mercado está vazio. Use listar para anunciar algo.');
            let text = '🛒 Mercado (ofertas abertas)\n\n';
            for (const ofr of items) {
              text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)} | Vendedor: @${ofr.seller.split('@')[0]}\n`;
            }
            return reply(text, { mentions: (items.map(i => i.seller)) });
          }
          if (sub === 'listar') {
            // listar item <key> <qtd> <preco> | listar mat <material> <qtd> <preco>
            const kind = (args[0] || '').toLowerCase();
            if (!['item', 'mat', 'material'].includes(kind)) return reply(`Use: ${prefix}listar item <key> <qtd> <preco> | ${prefix}listar mat <material> <qtd> <preco>`);
            const qty = parseInt(args[2]); const price = parseInt(args[3]);
            if (!isFinite(qty) || qty <= 0 || !isFinite(price) || price <= 0) return reply('Quantidade e preço inválidos.');
            if (kind === 'item') {
              const key = (args[1] || '').toLowerCase();
              if ((me.inventory?.[key] || 0) < qty) return reply('Você não possui itens suficientes.');
              me.inventory[key] -= qty;
              const id = econ.marketCounter++;
              econ.market.push({ id, type: 'item', key, qty, price, seller: sender });
              saveEconomy(econ);
              return reply(`📢 Anúncio #${id} criado: ${key} x${qty} por ${fmt(price)}.`);
            } else {
              const mat = (args[1] || '').toLowerCase();
              if ((me.materials?.[mat] || 0) < qty) return reply('Você não possui materiais suficientes.');
              me.materials[mat] -= qty;
              const id = econ.marketCounter++;
              econ.market.push({ id, type: 'mat', mat, qty, price, seller: sender });
              saveEconomy(econ);
              return reply(`📢 Anúncio #${id} criado: ${mat} x${qty} por ${fmt(price)}.`);
            }
          }
          if (sub === 'meusanuncios' || sub === 'meusan') {
            const mine = (econ.market || []).filter(o => o.seller === sender);
            if (mine.length === 0) return reply('Você não tem anúncios.');
            let text = '📋 Seus anúncios\n\n';
            for (const ofr of mine) text += `#${ofr.id} • ${ofr.type === 'item' ? `${ofr.key} x${ofr.qty}` : `${ofr.mat} x${ofr.qty}`} — ${fmt(ofr.price)}\n`;
            return reply(text);
          }
          if (sub === 'cancelar') {
            const id = parseInt(args[0]); if (!isFinite(id)) return reply('Informe o ID do anúncio.');
            const idx = (econ.market || []).findIndex(o => o.id === id);
            if (idx < 0) return reply('Anúncio não encontrado.');
            const ofr = econ.market[idx];
            if (ofr.seller !== sender) return reply('Apenas o vendedor pode cancelar.');
            // devolve ao vendedor
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            econ.market.splice(idx, 1); saveEconomy(econ);
            return reply(`❌ Anúncio #${id} cancelado e itens devolvidos.`);
          }
          if (sub === 'comprarmercado' || sub === 'cmerc') {
            const id = parseInt(args[0]); if (!isFinite(id)) return reply('Informe o ID do anúncio.');
            const ofr = (econ.market || []).find(o => o.id === id);
            if (!ofr) return reply('Anúncio não encontrado.');
            if (ofr.seller === sender) return reply('Você não pode comprar seu próprio anúncio.');
            const tax = Math.floor(ofr.price * 0.05);
            if (me.wallet < ofr.price) return reply('Saldo insuficiente.');
            const seller = getEcoUser(econ, ofr.seller);
            me.wallet -= ofr.price;
            seller.wallet += (ofr.price - tax); // taxa de 5%
            if (ofr.type === 'item') me.inventory[ofr.key] = (me.inventory[ofr.key] || 0) + ofr.qty; else me.materials[ofr.mat] = (me.materials[ofr.mat] || 0) + ofr.qty;
            econ.market = (econ.market || []).filter(o => o.id !== id);
            saveEconomy(econ);
            return reply(`🛒 Compra realizada! Taxa de ${fmt(tax)} aplicada. Vendedor recebeu ${fmt(ofr.price - tax)}.`);
          }

          // ===== Propriedades =====
          if (sub === 'propriedades') {
            const keys = Object.keys(econ.propertiesCatalog || {});
            let text = '🏠 Propriedades disponíveis\n\n';
            for (const k of keys) {
              const p = econ.propertiesCatalog[k];
              const upkeep = p.upkeepPerDay || 0; const incGold = p.incomeGoldPerDay || 0; const incMat = p.incomeMaterialsPerDay || {};
              const mats = Object.entries(incMat).map(([mk, mq]) => `${mk} x${mq}/dia`).join(', ');
              text += `• ${k} — ${p.name} — Preço: ${fmt(p.price)} — Manutenção: ${fmt(upkeep)}/dia — Renda: ${incGold > 0 ? `${fmt(incGold)} gold/dia` : ''}${mats ? `${incGold > 0 ? ' e ' : ''}${mats}` : ''}\n`;
            }
            // minhas propriedades
            const mine = me.properties || {}; const owned = Object.keys(mine).filter(k => mine[k]?.owned);
            if (owned.length > 0) {
              text += '\n📦 Suas propriedades:\n';
              for (const k of owned) {
                const o = mine[k];
                const last = o.lastCollect ? new Date(o.lastCollect).toLocaleDateString('pt-BR') : '—';
                text += `• ${econ.propertiesCatalog[k]?.name || k} — desde ${last}\n`;
              }
            }
            return reply(text);
          }
          if (sub === 'comprarpropriedade' || sub === 'cprop') {
            const key = (args[0] || '').toLowerCase(); if (!key) return reply(`Use: ${prefix}comprarpropriedade <tipo>`);
            const prop = (econ.propertiesCatalog || {})[key]; if (!prop) return reply('Propriedade inexistente.');
            if (me.properties?.[key]?.owned) return reply('Você já possui essa propriedade.');
            if (me.wallet < prop.price) return reply('Saldo insuficiente.');
            me.wallet -= prop.price;
            me.properties[key] = { owned: true, lastCollect: Date.now() };
            saveEconomy(econ);
            return reply(`🏠 Você comprou ${prop.name}!`);
          }
          if (sub === 'coletarpropriedades' || sub === 'cprops') {
            const props = me.properties || {}; const keys = Object.keys(props).filter(k => props[k].owned);
            if (keys.length === 0) return reply('Você não possui propriedades.');
            let totalGold = 0; const matsGain = {};
            for (const k of keys) {
              const meta = (econ.propertiesCatalog || {})[k]; if (!meta) continue;
              const days = Math.max(1, Math.ceil((Date.now() - (props[k].lastCollect || Date.now())) / (24 * 60 * 60 * 1000)));
              const upkeep = (meta.upkeepPerDay || 0) * days; if (me.wallet < upkeep) return reply(`Saldo insuficiente para pagar manutenção de ${meta.name} (${fmt(upkeep)}).`);
              me.wallet -= upkeep;
              if (meta.incomeGoldPerDay) totalGold += meta.incomeGoldPerDay * days;
              if (meta.incomeMaterialsPerDay) {
                for (const [mk, mq] of Object.entries(meta.incomeMaterialsPerDay)) matsGain[mk] = (matsGain[mk] || 0) + (mq * days);
              }
              props[k].lastCollect = Date.now();
            }
            me.wallet += totalGold;
            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
            saveEconomy(econ);
            let msg = `🏡 Coleta concluída! +${fmt(totalGold)} gold`;
            if (Object.keys(matsGain).length > 0) msg += ` | Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ');
            return reply(msg);
          }

          // ===== Habilidades & Desafios Periódicos (visualização) =====
          if (sub === 'habilidades') {
            ensureUserSkills(me);
            let text = '📚 Habilidades\n\n';
            for (const s of SKILL_LIST) {
              const sk = me.skills[s];
              text += `• ${s}: Nível ${sk.level} (${sk.xp}/${skillXpForNext(sk.level)})\n`;
            }
            return reply(text);
          }
          if (sub === 'desafiosemanal' || sub === 'desafiomensal') {
            ensureUserPeriodChallenges(me);
            const show = sub === 'desafiosemanal' ? me.weeklyChallenge : me.monthlyChallenge;
            const labels = { mine: 'Minerações', work: 'Trabalhos', fish: 'Pescarias', explore: 'Explorações', hunt: 'Caçadas', crimeSuccess: 'Crimes OK' };
            let text = `🏅 Desafio ${sub === 'desafiosemanal' ? 'Semanal' : 'Mensal'}\n\n`;
            for (const t of (show.tasks || [])) text += `• ${labels[t.type] || t.type}: ${t.progress || 0}/${t.target}\n`;
            text += `\nPrêmio: ${fmt(show.reward)} ${show.claimed ? '(coletado)' : ''}`;
            if (isPeriodCompleted(show) && !show.claimed) text += `\nUse: ${prefix}${sub} coletar`;
            if ((args[0] || '').toLowerCase() === 'coletar') {
              if (show.claimed) return reply('Você já coletou este prêmio.');
              if (!isPeriodCompleted(show)) return reply('Complete todas as tarefas para coletar.');
              me.wallet += show.reward; show.claimed = true; saveEconomy(econ);
              return reply(`🎉 Você coletou ${fmt(show.reward)} do ${sub === 'desafiosemanal' ? 'desafio semanal' : 'desafio mensal'}!`);
            }
            return reply(text);
          }

          if (sub === 'assaltar' || sub === 'roubar') {
            if (!mentioned) return reply('Marque alguém para assaltar.');
            if (mentioned === sender) return reply('Você não pode assaltar a si mesmo.');
            const cd = me.cooldowns?.rob || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para tentar novamente.`);
            const target = getEcoUser(econ, mentioned);
            const chance = Math.random();
            const maxSteal = Math.min(target.wallet, 300);
            if (maxSteal <= 0) {
              me.cooldowns.rob = Date.now() + 10 * 60 * 1000; // 10 min
              saveEconomy(econ);
              return reply('A vítima está sem dinheiro na carteira. Roubo falhou.');
            }
            if (chance < 0.5) {
              const amt = 50 + Math.floor(Math.random() * Math.max(1, maxSteal - 49));
              target.wallet -= amt; me.wallet += amt;
              me.cooldowns.rob = Date.now() + 10 * 60 * 1000;
              saveEconomy(econ);
              return reply(`🦹 Sucesso! Você roubou ${fmt(amt)} de @${getUserName(mentioned)}.`, { mentions: [mentioned] });
            } else {
              const multa = 80 + Math.floor(Math.random() * 121); // 80-200
              const pay = Math.min(me.wallet, multa);
              me.wallet -= pay; target.wallet += pay;
              me.cooldowns.rob = Date.now() + 10 * 60 * 1000;
              saveEconomy(econ);
              return reply(`🚨 Você foi pego! Pagou ${fmt(pay)} de multa para @${getUserName(mentioned)}.`, { mentions: [mentioned] });
            }
          }

          if (sub === 'diario' || sub === 'daily') {
            const cd = me.cooldowns?.daily || 0;
            const now = Date.now();

            if (now < cd) {
              return reply(`⏳ Você já coletou hoje!\n\n🕐 Volte em: ${timeLeft(cd)}`);
            }

            // Sistema de Streak (sequência diária)
            if (!me.streak) {
              me.streak = { count: 0, lastClaim: 0, record: 0 };
            }

            const oneDayMs = 24 * 60 * 60 * 1000;
            const twoDaysMs = 48 * 60 * 60 * 1000;
            const timeSinceLastClaim = now - me.streak.lastClaim;

            // Verifica se manteve a sequência (coletou no dia seguinte)
            if (timeSinceLastClaim <= twoDaysMs && timeSinceLastClaim >= oneDayMs) {
              me.streak.count += 1;
            } else if (timeSinceLastClaim > twoDaysMs) {
              // Quebrou a sequência
              me.streak.count = 1;
            } else {
              me.streak.count = 1;
            }

            // Atualiza recorde
            if (me.streak.count > me.streak.record) {
              me.streak.record = me.streak.count;
            }

            // Calcula recompensa baseada no streak
            const baseReward = 150;
            const streakBonus = Math.min(me.streak.count * 10, 300); // Máx +300
            const totalReward = baseReward + streakBonus;

            // Bônus especial a cada 7 dias
            let extraBonus = 0;
            let bonusMessage = '';
            if (me.streak.count % 7 === 0) {
              extraBonus = 500;
              bonusMessage = '\n🎉 *BÔNUS DE 7 DIAS:* +500!';
            }

            // Bônus especial a cada 30 dias
            if (me.streak.count % 30 === 0) {
              extraBonus += 2000;
              bonusMessage += '\n🏆 *BÔNUS DE 30 DIAS:* +2000!';
            }

            const finalReward = totalReward + extraBonus;

            me.wallet += finalReward;
            me.streak.lastClaim = now;
            me.cooldowns.daily = now + oneDayMs;

            // Adiciona XP
            const xpGain = 50 + (me.streak.count * 5);
            me.exp = (me.exp || 0) + xpGain;

            // Verifica level up
            const level = me.level || 1;
            const nextLevelXp = 100 * Math.pow(1.5, level - 1);
            let leveledUp = false;
            while (me.exp >= nextLevelXp) {
              me.exp -= nextLevelXp;
              me.level += 1;
              leveledUp = true;
            }

            saveEconomy(econ);

            let text = `╭━━━⊱ 🎁 *RECOMPENSA DIÁRIA* ⊱━━━╮\n`;
            text += `│\n`;
            text += `│ 💰 Base: +${fmt(baseReward)}\n`;
            text += `│ 🔥 Streak (${me.streak.count}x): +${fmt(streakBonus)}\n`;
            if (extraBonus > 0) {
              text += `│ ✨ Bônus: +${fmt(extraBonus)}\n`;
            }
            text += `│ ━━━━━━━━━━━━━━\n`;
            text += `│ 💵 Total: *${fmt(finalReward)}*\n`;
            text += `│ ⚡ XP: +${xpGain}\n`;
            text += `│\n`;
            text += `│ 🔥 Sequência: *${me.streak.count} dia${me.streak.count !== 1 ? 's' : ''}*\n`;
            text += `│ 🏆 Recorde: ${me.streak.record} dia${me.streak.record !== 1 ? 's' : ''}\n`;
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            if (bonusMessage) {
              text += bonusMessage;
            }

            if (leveledUp) {
              text += `\n\n⚡ *LEVEL UP!* Agora você é level ${me.level}!`;
            }

            text += `\n\n💡 Volte amanhã para manter a sequência!`;

            return reply(text);
          }

          if (sub === 'toprpg') {
            const arr = Object.entries(econ.users).map(([id, u]) => [id, (u.wallet || 0) + (u.bank || 0)]).sort((a, b) => b[1] - a[1]).slice(0, 10);
            if (arr.length === 0) return reply('Sem dados suficientes para ranking.');
            let text = '⚔️ 🏆 *RANKING RPG* 🏆 ⚔️\n\n';
            const mentions = [];
            arr.forEach(([id, total], i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
              text += `${medal} @${id.split('@')[0]} — 💰 ${fmt(total)}\n`;
              mentions.push(id);
            });
            text += `\n✨ Continue jogando para subir no rank!`;
            return reply(text, { mentions });
          }



          return reply('Comando RPG inválido. Use ' + prefix + 'menurpg para ver todos os comandos.');
        }

      // ==================== NOVOS COMANDOS RPG ====================

      // Sistema de Equipamentos
      case 'equipamentos':
      case 'gear':
      case 'equip': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.equipment) me.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };

        const eq = me.equipment;
        // Recalcula os bônus a partir dos itens equipados
        recalcEquipmentBonuses(me, econ.shop);

        let text = `╭━━━⊱ ⚔️ *EQUIPAMENTOS* ⊱━━━╮\n`;
        text += `│ 👤 Aventureiro: *${pushname}*\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `🗡️ *Arma:* ${eq.weapon || '❌ Nenhuma'}\n`;
        text += `🛡️ *Armadura:* ${eq.armor || '❌ Nenhuma'}\n`;
        text += `⛑️ *Capacete:* ${eq.helmet || '❌ Nenhum'}\n`;
        text += `👢 *Botas:* ${eq.boots || '❌ Nenhuma'}\n`;
        text += `🛡️ *Escudo:* ${eq.shield || '❌ Nenhum'}\n`;
        text += `💍 *Acessório:* ${eq.accessory || '❌ Nenhum'}\n\n`;
        text += `╭━━━⊱ 📊 *ESTATÍSTICAS* ⊱━━━╮\n`;
        text += `│ ⚔️ Poder de Ataque: +${me.attackBonus || 0}\n`;
        text += `│ 🛡️ Poder de Defesa: +${me.defenseBonus || 0}\n`;
        text += `│ ✨ Poder Total: ${me.power || 100}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `💡 *Dicas:*\n`;
        text += `• Use ${prefix}forjar para criar equipamentos\n`;
        text += `• Use ${prefix}encantar para melhorar\n`;
        text += `• Use ${prefix}inventario para ver itens`;

        return reply(text);
      }

      // Sistema de Conquistas
      case 'conquistas':
      case 'achievements':
      case 'medalhas': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        me.achievements = me.achievements || {};
        me.stats = me.stats || { totalMine: 0, totalWork: 0, totalFish: 0, totalHunt: 0, totalExplore: 0, totalBattles: 0, totalWins: 0, totalCrimes: 0 };

        const achievements = [
          { id: 'minerador', name: '⛏️ Minerador', desc: 'Minere 100 vezes', req: me.stats.totalMine >= 100, progress: `${me.stats.totalMine || 0}/100` },
          { id: 'trabalhador', name: '💼 Trabalhador', desc: 'Trabalhe 50 vezes', req: me.stats.totalWork >= 50, progress: `${me.stats.totalWork || 0}/50` },
          { id: 'pescador', name: '🎣 Pescador', desc: 'Pesque 75 vezes', req: me.stats.totalFish >= 75, progress: `${me.stats.totalFish || 0}/75` },
          { id: 'cacador', name: '🏹 Caçador', desc: 'Cace 50 vezes', req: me.stats.totalHunt >= 50, progress: `${me.stats.totalHunt || 0}/50` },
          { id: 'explorador', name: '🗺️ Explorador', desc: 'Explore 100 vezes', req: me.stats.totalExplore >= 100, progress: `${me.stats.totalExplore || 0}/100` },
          { id: 'gladiador', name: '⚔️ Gladiador', desc: 'Vença 25 batalhas', req: me.stats.totalWins >= 25, progress: `${me.stats.totalWins || 0}/25` },
          { id: 'milionario', name: '💰 Milionário', desc: 'Tenha 500K no banco', req: (me.bank || 0) >= 500000, progress: `${(me.bank || 0).toLocaleString()}/500.000` },
          { id: 'veterano', name: '🏆 Veterano', desc: 'Alcance nível 50', req: (me.level || 1) >= 50, progress: `${me.level || 1}/50` },
          { id: 'colecionador', name: '🐾 Colecionador', desc: 'Tenha 5 pets', req: (me.pets?.length || 0) >= 5, progress: `${me.pets?.length || 0}/5` },
          { id: 'criminoso', name: '🦹 Criminoso', desc: 'Cometa 30 crimes', req: me.stats.totalCrimes >= 30, progress: `${me.stats.totalCrimes || 0}/30` }
        ];

        let unlockedCount = 0;
        let text = `╭━━━⊱ 🏅 *CONQUISTAS* ⊱━━━╮\n`;
        text += `│ Aventureiro: *${pushname}*\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        for (const ach of achievements) {
          const unlocked = ach.req || !!me.achievements[ach.id];
          if (unlocked && !me.achievements[ach.id]) {
            me.achievements[ach.id] = Date.now();
          }
          if (unlocked) unlockedCount++;

          const status = unlocked ? '✅' : '🔒';
          text += `${status} ${ach.name}\n`;
          text += `   ${ach.desc}\n`;
          text += `   📊 Progresso: ${ach.progress}\n\n`;
        }

        text += `╭━━━━━━━━━━━━━━━━━━━━╮\n`;
        text += `│ 🏆 Total: ${unlockedCount}/${achievements.length} conquistas\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(text);
      }

      // Sistema de Pets
      case 'pets':
      case 'meuspets': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets) me.pets = [];

        // Aplica degradação automática
        const degradation = applyPetDegradation(me.pets);
        if (degradation.changed) {
          saveEconomy(econ);
        }

        if (me.pets.length === 0) {
          let text = `╭━━━⊱ 🐾 *SISTEMA DE PETS* ⊱━━━╮\n`;
          text += `│ Você ainda não tem companheiros!\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `🦊 *PETS DISPONÍVEIS:*\n\n`;
          text += `  *Lobo* - Veloz e leal\n`;
          text += `🐉 *Dragão* - Poderoso e raro\n`;
          text += `🔥 *Fênix* - Imortal e místico\n`;
          text += `🐯 *Tigre* - Feroz e forte\n`;
          text += `🦅 *Águia* - Ágil e preciso\n\n`;
          text += `💡 Use ${prefix}adotar <nome> para começar!`;
          return reply(text);
        }

        let text = `╭━━━⊱ 🐾 *MEUS PETS* ⊱━━━╮\n`;
        text += `│ Treinador: *${pushname}*\n`;
        text += `│ Total de Pets: ${me.pets.length}/5\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        let hasWarnings = false;
        me.pets.forEach((pet, i) => {
          const hungerBar = '█'.repeat(Math.floor(pet.hunger / 10)) + '░'.repeat(10 - Math.floor(pet.hunger / 10));
          const moodBar = '█'.repeat(Math.floor(pet.mood / 10)) + '░'.repeat(10 - Math.floor(pet.mood / 10));

          // Status de alerta
          let statusEmoji = '';
          if (pet.hunger < 20) {
            statusEmoji = ' ⚠️ FOME CRÍTICA';
            hasWarnings = true;
          } else if (pet.hunger < 40) {
            statusEmoji = ' 🍖 Com fome';
          }

          if (pet.mood < 20) {
            statusEmoji += ' 😢 TRISTE';
            hasWarnings = true;
          }

          // Mostra evolução atual
          let evolutionText = '';
          if (pet.evolutions && pet.evolutions > 0) {
            evolutionText = ` ${'⭐'.repeat(pet.evolutions)}`;
          }

          text += `${i + 1}. ${pet.emoji} *${pet.name}*${evolutionText}${statusEmoji}\n`;
          text += `┌─────────────────\n`;
          text += `│ 📊 Level ${pet.level} | 💫 ${pet.exp}/${pet.level * 100} EXP\n`;
          text += `│ ❤️ HP: ${pet.hp}/${pet.maxHp}\n`;
          text += `│ ⚔️ ATK: ${pet.attack} | 🛡️ DEF: ${pet.defense}\n`;
          if (pet.speed) text += `│ ⚡ SPD: ${pet.speed}\n`;
          text += `│ 🏆 ${pet.wins || 0}V | 💀 ${pet.losses || 0}D\n`;

          // Mostra equipamentos
          if (pet.equipment && Object.keys(pet.equipment).length > 0) {
            text += `│ 📦 Equipado:\n`;
            Object.entries(pet.equipment).forEach(([slot, itemId]) => {
              const item = SHOP_ITEMS[itemId];
              if (item) {
                const slotIcon = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : slot === 'shield' ? '🛡️' : slot === 'accessory' ? '💍' : '🧪';
                text += `│   ${slotIcon} ${item.name}\n`;
              }
            });
          }

          text += `│ 🍖 Fome: ${hungerBar} ${pet.hunger}%\n`;
          text += `│ 😊 Humor: ${moodBar} ${pet.mood}%\n`;
          text += `└─────────────────\n\n`;
        });

        if (hasWarnings) {
          text += `⚠️ *ATENÇÃO:* Alguns pets precisam de cuidados!\n\n`;
        }

        text += `🎮 *COMANDOS DISPONÍVEIS:*\n`;
        text += `• ${prefix}alimentar <número>\n`;
        text += `• ${prefix}treinar <número>\n`;
        text += `• ${prefix}evoluir <número>\n`;
        text += `• ${prefix}renomear <número> <nome>\n`;
        text += `• ${prefix}batalha <número> @user\n\n`;
        text += `💡 Seus pets perdem fome e humor com o tempo!`;

        return reply(text);
        break;
      }

      case 'adotar':
      case 'adopt': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets) me.pets = [];
        if (me.pets.length >= 5) return reply('🐾 Você já tem o máximo de 5 pets!');

        const petTypes = {
          lobo: { emoji: '🐺', name: 'Lobo', type: 'lobo', hp: 100, attack: 15, defense: 10, speed: 18, cost: 5000, desc: 'Veloz e leal', element: 'normal' },
          dragao: { emoji: '🐉', name: 'Dragão', type: 'dragao', hp: 150, attack: 25, defense: 15, speed: 12, cost: 15000, desc: 'Poderoso e raro', element: 'fire' },
          fenix: { emoji: '🔥', name: 'Fênix', type: 'fenix', hp: 120, attack: 20, defense: 12, speed: 20, cost: 10000, desc: 'Imortal e místico', element: 'fire' },
          tigre: { emoji: '🐯', name: 'Tigre', type: 'tigre', hp: 110, attack: 18, defense: 11, speed: 16, cost: 7000, desc: 'Feroz e forte', element: 'normal' },
          aguia: { emoji: '🦅', name: 'Águia', type: 'aguia', hp: 90, attack: 22, defense: 8, speed: 25, cost: 6000, desc: 'Ágil e preciso', element: 'wind' }
        };

        // Normaliza o parâmetro ignorando acentos
        const inputType = (q || '').trim();
        const type = matchParam(inputType, petTypes) || findKeyIgnoringAccents(petTypes, inputType);

        if (!type || !petTypes[type]) {
          let text = `╭━━━⊱ 🐾 *LOJA DE PETS* ⊱━━━╮\n`;
          text += `│ Escolha seu companheiro!\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          Object.entries(petTypes).forEach(([key, pet]) => {
            text += `${pet.emoji} *${pet.name}*\n`;
            text += `┌─────────────────\n`;
            text += `│ 📝 ${pet.desc}\n`;
            text += `│   Preço: ${pet.cost.toLocaleString()}\n`;
            text += `│ ❤️ HP: ${pet.hp}\n`;
            text += `│ ⚔️ ATK: ${pet.attack}\n`;
            text += `│ 🛡️ DEF: ${pet.defense}\n`;
            text += `└─────────────────\n\n`;
          });

          text += ` 💡 Use ${prefix}adotar <nome> para adotar`;
          return reply(text);
        }

        const pet = petTypes[type];
        if (me.wallet < pet.cost) {
          return reply(`💰 Você precisa de *${pet.cost.toLocaleString()}* moedas!\n\n💸 Você tem: ${me.wallet.toLocaleString()}\n❌ Faltam: ${(pet.cost - me.wallet).toLocaleString()}`);
        }

        me.wallet -= pet.cost;
        me.pets.push({
          ...pet,
          level: 1,
          maxHp: pet.hp,
          exp: 0,
          hunger: 100,
          mood: 100,
          wins: 0,
          losses: 0,
          equipment: {},
          evolutions: 0,
          lastUpdate: Date.now()
        });

        saveEconomy(econ);

        let text = `╭━━━⊱ 🎉 *ADOÇÃO REALIZADA!* ⊱━━━╮\n`;
        text += `│\n`;
        text += `│ Você adotou ${pet.emoji} *${pet.name}*!\n`;
        text += `│\n`;
        text += `│ ${pet.desc}\n`;
        text += `│\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `💡 Use ${prefix}pets para ver seus companheiros\n`;
        text += `⚠️ Lembre-se: seus pets precisam de cuidados regulares!`;

        return reply(text);
        break;
      }

      case 'alimentar':
      case 'feed': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets para alimentar!');

        // Aplica degradação antes de alimentar
        applyPetDegradation(me.pets);

        const index = parseInt(q) - 1;
        if (isNaN(index) || index < 0 || index >= me.pets.length) {
          return reply(`❌ Pet inválido! Use ${prefix}pets para ver seus pets e escolha um número.`);
        }

        const pet = me.pets[index];
        const foodCost = 100;

        if (me.wallet < foodCost) return reply(`💰 Você precisa de ${foodCost} moedas para comprar comida!`);
        if (pet.hunger >= 100) return reply(`🍖 ${pet.emoji} *${pet.name}* já está satisfeito!`);

        me.wallet -= foodCost;
        const hungerGain = 30 + Math.floor(Math.random() * 20);
        pet.hunger = Math.min(100, pet.hunger + hungerGain);
        pet.mood = Math.min(100, pet.mood + 10);
        pet.lastUpdate = Date.now(); // Atualiza timestamp

        // Recupera HP se estava perdendo
        if (pet.hp < pet.maxHp) {
          const hpRecover = Math.floor(pet.maxHp * 0.1);
          pet.hp = Math.min(pet.maxHp, pet.hp + hpRecover);
        }

        saveEconomy(econ);

        let text = `╭━━━⊱ 🍖 *ALIMENTAÇÃO* ⊱━━━╮\n`;
        text += `│ ${pet.emoji} *${pet.name}* comeu!\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `😊 Humor: ${pet.mood}/100 (+10)\n`;
        text += `🍖 Fome: ${pet.hunger}/100 (+${hungerGain})\n`;
        if (pet.hp < pet.maxHp) {
          text += `❤️ HP: ${pet.hp}/${pet.maxHp} (recuperando)\n`;
        }
        text += `\n💸 Custo: -${foodCost} moedas`;

        return reply(text);
        break;
      }

      case 'treinar':
      case 'train': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets para treinar!');

        // Aplica degradação antes de treinar
        applyPetDegradation(me.pets);

        const index = parseInt(q) - 1;
        if (isNaN(index) || index < 0 || index >= me.pets.length) {
          return reply(`❌ Pet inválido! Use ${prefix}pets para ver seus pets.`);
        }

        const pet = me.pets[index];
        if (pet.hunger < 30) return reply(`🍖 ${pet.emoji} *${pet.name}* está com muita fome! Alimente-o primeiro.`);

        const now = Date.now();
        if (pet.lastTrain && (now - pet.lastTrain) < 3600000) {
          const remaining = Math.ceil((3600000 - (now - pet.lastTrain)) / 60000);
          return reply(`⏰ ${pet.emoji} *${pet.name}* está cansado!\n\n🕐 Aguarde *${remaining} minutos*`);
        }

        const expGain = 50 + Math.floor(Math.random() * 30);
        pet.exp = (pet.exp || 0) + expGain;
        pet.hunger = Math.max(0, pet.hunger - 20);
        pet.lastTrain = now;

        // Atualiza missão de treinar pet
        updateQuestProgress(me, 'train_pet', 1);

        let text = `╭━━━⊱ 💪 *TREINAMENTO* ⊱━━━╮\n`;
        text += `│ ${pet.emoji} *${pet.name}* treinou!\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        if (pet.exp >= pet.level * 100) {
          pet.level++;
          const atkGain = 2 + Math.floor(Math.random() * 3);
          const defGain = 1 + Math.floor(Math.random() * 2);
          const hpGain = 10 + Math.floor(Math.random() * 10);

          pet.attack += atkGain;
          pet.defense += defGain;
          pet.maxHp += hpGain;
          pet.hp = pet.maxHp;
          pet.exp = 0;

          text += `╭━━━⊱   *PET EVOLUIU!*   ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ 🐾 *${pet.name}* ${pet.emoji}\n`;
          text += `│\n`;
          text += `│ 📊 *Nível:* ${pet.level - 1} ➜ *${pet.level}*\n`;
          text += `│\n`;
          text += `│ ⚔️ *ATK:* ${pet.attack - atkGain} ➜ *${pet.attack}* *(+${atkGain})*\n`;
          text += `│ 🛡️ *DEF:* ${pet.defense - defGain} ➜ *${pet.defense}* *(+${defGain})*\n`;
          text += `│ ❤️ *HP:* ${pet.maxHp - hpGain} ➜ *${pet.maxHp}* *(+${hpGain})*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n`;
          text += `\n✨ *Seu pet ficou mais forte!* ✨`;

          saveEconomy(econ);
          return reply(text);
        }

        text += `✨ EXP: +${expGain}\n`;
        text += `📊 Progresso: ${pet.exp}/${pet.level * 100}\n`;
        text += `🍖 Fome: ${pet.hunger}/100\n\n`;
        text += `💡 ${pet.exp} de ${pet.level * 100} para o próximo nível`;

        saveEconomy(econ);
        return reply(text);
        break;
      }

      case 'evoluirpet':
      case 'evolve': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets para evoluir!');
        if (!me.items) me.items = {};

        const index = parseInt(q) - 1;
        if (isNaN(index) || index < 0 || index >= me.pets.length) {
          return reply(`❌ Pet inválido! Use ${prefix}pets para ver seus pets.`);
        }

        const pet = me.pets[index];
        if (!pet.evolutions) pet.evolutions = 0;

        // Sistema de evoluções: cada pet pode evoluir 3 vezes
        const evolutionData = {
          lobo: [
            { name: 'Lobo Alpha', emoji: '🐺⭐', reqLevel: 10, atkBonus: 15, defBonus: 8, hpBonus: 50, spdBonus: 10 },
            { name: 'Lobo Lunar', emoji: '🌙🐺', reqLevel: 25, atkBonus: 30, defBonus: 18, hpBonus: 120, spdBonus: 25 },
            { name: 'Fenrir Despertado', emoji: '🐺💫', reqLevel: 50, atkBonus: 60, defBonus: 40, hpBonus: 250, spdBonus: 50 }
          ],
          dragao: [
            { name: 'Dragão de Fogo', emoji: '🐲🔥', reqLevel: 15, atkBonus: 25, defBonus: 15, hpBonus: 80, spdBonus: 5 },
            { name: 'Dragão Ancião', emoji: '🐉⚡', reqLevel: 30, atkBonus: 50, defBonus: 35, hpBonus: 180, spdBonus: 15 },
            { name: 'Dragão Despertado', emoji: '🐉💥', reqLevel: 60, atkBonus: 100, defBonus: 70, hpBonus: 400, spdBonus: 30 }
          ],
          fenix: [
            { name: 'Fênix Flamejante', emoji: '🔥⭐', reqLevel: 12, atkBonus: 20, defBonus: 10, hpBonus: 60, spdBonus: 15 },
            { name: 'Fênix Imortal', emoji: '🔥💫', reqLevel: 28, atkBonus: 40, defBonus: 25, hpBonus: 150, spdBonus: 35 },
            { name: 'Fênix Celestial', emoji: '🔥👑', reqLevel: 55, atkBonus: 80, defBonus: 50, hpBonus: 320, spdBonus: 70 }
          ],
          tigre: [
            { name: 'Tigre Real', emoji: '🐯👑', reqLevel: 10, atkBonus: 18, defBonus: 10, hpBonus: 55, spdBonus: 12 },
            { name: 'Tigre de Jade', emoji: '🐯💚', reqLevel: 25, atkBonus: 35, defBonus: 22, hpBonus: 130, spdBonus: 28 },
            { name: 'Tigre Divino', emoji: '🐯⚡', reqLevel: 50, atkBonus: 70, defBonus: 45, hpBonus: 280, spdBonus: 55 }
          ],
          aguia: [
            { name: 'Águia Majestosa', emoji: '🦅⭐', reqLevel: 10, atkBonus: 22, defBonus: 7, hpBonus: 45, spdBonus: 20 },
            { name: 'Águia Dourada', emoji: '🦅👑', reqLevel: 25, atkBonus: 45, defBonus: 15, hpBonus: 110, spdBonus: 45 },
            { name: 'Grifo Lendário', emoji: '🦅💫', reqLevel: 50, atkBonus: 90, defBonus: 35, hpBonus: 240, spdBonus: 90 }
          ]
        };

        const petEvolutions = evolutionData[pet.type];
        if (!petEvolutions || pet.evolutions >= petEvolutions.length) {
          return reply(`❌ ${pet.emoji} *${pet.name}* já atingiu sua forma máxima!`);
        }

        const nextEvolution = petEvolutions[pet.evolutions];

        // Verifica requisitos
        if (pet.level < nextEvolution.reqLevel) {
          return reply(`❌ ${pet.emoji} *${pet.name}* precisa estar no nível ${nextEvolution.reqLevel}!\n\n📊 Nível atual: ${pet.level}`);
        }

        // Verifica pedra da evolução (verifica em inventory e items)
        const hasStoneInInventory = me.inventory?.evolution_stone && me.inventory.evolution_stone >= 1;
        const hasStoneInItems = me.items?.evolution_stone && me.items.evolution_stone >= 1;

        if (!hasStoneInInventory && !hasStoneInItems) {
          return reply(`❌ Você precisa de uma *Pedra da Evolução* para evoluir seu pet!\n\n🛒 Compre na ${prefix}loja ou ganhe em batalhas de pets.`);
        }

        // Consome a pedra (verifica onde está)
        if (hasStoneInInventory) {
          me.inventory.evolution_stone--;
        } else {
          me.items.evolution_stone--;
        }

        const oldName = pet.name;
        const oldEmoji = pet.emoji;
        const oldStats = {
          attack: pet.attack,
          defense: pet.defense,
          maxHp: pet.maxHp,
          speed: pet.speed || 0
        };

        pet.name = nextEvolution.name;
        pet.emoji = nextEvolution.emoji;
        pet.attack += nextEvolution.atkBonus;
        pet.defense += nextEvolution.defBonus;
        pet.maxHp += nextEvolution.hpBonus;
        pet.speed = (pet.speed || 0) + nextEvolution.spdBonus;
        pet.hp = pet.maxHp;
        pet.evolutions++;

        saveEconomy(econ);

        let text = `╭━━━⊱ ✨ *EVOLUÇÃO CONCLUÍDA!* ✨ ⊱━━━╮\n`;
        text += `│\n`;
        text += `│ ${oldEmoji} ➜ ${pet.emoji}\n`;
        text += `│\n`;
        text += `│ 🎉 *${oldName}* evoluiu para\n`;
        text += `│ 🌟 *${pet.name}*!\n`;
        text += `│\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `📊 *NOVOS ATRIBUTOS:*\n\n`;
        text += `⚔️ *ATK:* ${oldStats.attack} ➜ ${pet.attack} *(+${nextEvolution.atkBonus})*\n`;
        text += `🛡️ *DEF:* ${oldStats.defense} ➜ ${pet.defense} *(+${nextEvolution.defBonus})*\n`;
        text += `❤️ *HP:* ${oldStats.maxHp} ➜ ${pet.maxHp} *(+${nextEvolution.hpBonus})*\n`;
        text += `⚡ *SPD:* ${oldStats.speed} ➜ ${pet.speed} *(+${nextEvolution.spdBonus})*\n\n`;

        if (pet.evolutions < petEvolutions.length) {
          const next = petEvolutions[pet.evolutions];
          text += `🔮 *Próxima Evolução:* ${next.name} ${next.emoji}\n`;
          text += `📊 *Requisito:* Nível ${next.reqLevel}\n`;
        } else {
          text += `👑 *${pet.name}* atingiu sua FORMA FINAL!`;
        }

        return reply(text);
        break;
      }

      case 'renomearpet':
      case 'renamepet': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');

        const args = q.split(' ');
        const index = parseInt(args[0]) - 1;
        const newName = args.slice(1).join(' ');

        if (isNaN(index) || index < 0 || index >= me.pets.length) {
          return reply(`❌ Pet inválido!`);
        }

        if (!newName || newName.length < 2) {
          return reply(`❌ Nome muito curto! Mínimo 2 caracteres.`);
        }

        if (newName.length > 20) {
          return reply(`❌ Nome muito longo! Máximo 20 caracteres.`);
        }

        const pet = me.pets[index];
        const oldName = pet.name;
        const cost = 500;

        if (me.wallet < cost) {
          return reply(`💰 Renomear custa ${cost} moedas!`);
        }

        me.wallet -= cost;
        pet.name = newName.substring(0, 20);

        saveEconomy(econ);
        return reply(`✏️ ${pet.emoji} *${oldName}* agora se chama *${pet.name}*!\n\n💸 Custo: -${cost} moedas`);
        break;
      }

      case 'batalhapet':
      case 'petbattle': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);
        const target = (menc_jid2 && menc_jid2[0]) || null;
        const now = Date.now();

        const PET_BATTLE_COOLDOWN = 10 * 60 * 1000;
        if (me.lastPetBattle && (now - me.lastPetBattle) < PET_BATTLE_COOLDOWN) {
          const remaining = Math.ceil((PET_BATTLE_COOLDOWN - (now - me.lastPetBattle)) / 60000);
          return reply(`⏰ Você acabou de batalhar. Aguarde *${remaining} minutos*.`);
        }

        if (!target) return reply(`❌ Marque alguém para batalhar!\n\n💡 Uso: ${prefix}batalha <número> @user`);
        if (target === sender) return reply('❌ Você não pode batalhar contra si mesmo!');

        const opponent = getEcoUser(econ, target);

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
        if (!opponent.pets || opponent.pets.length === 0) {
          return reply('❌ Seu oponente não tem pets!');
        }

        const args = q.split(' ');
        const myIndex = parseInt(args[0]) - 1;

        if (isNaN(myIndex) || myIndex < 0 || myIndex >= me.pets.length) {
          return reply(`❌ Pet inválido! Use ${prefix}pets para ver.`);
        }

        const myPet = me.pets[myIndex];
        const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];

        if (!me.items) me.items = {};
        if (!opponent.items) opponent.items = {};
        if (!myPet.equipment) myPet.equipment = {};
        if (!oppPet.equipment) oppPet.equipment = {};

        // Calcula stats com equipamentos
        const calcStats = (pet) => {
          let totalAtk = pet.attack;
          let totalDef = pet.defense;
          let totalSpd = pet.speed || 0;
          let critBonus = 0;
          let advantage = null;

          Object.entries(pet.equipment || {}).forEach(([slot, itemId]) => {
            const item = SHOP_ITEMS[itemId];
            if (item) {
              totalAtk += item.stats?.attack || 0;
              totalDef += item.stats?.defense || 0;
              totalSpd += item.stats?.speed || 0;
              critBonus += item.stats?.critBonus || 0;
              if (item.advantage) advantage = item.advantage;
            }
          });

          return { totalAtk, totalDef, totalSpd, critBonus, advantage };
        };

        const myStats = calcStats(myPet);
        const oppStats = calcStats(oppPet);

        // Sistema de vantagem de tipo
        const hasAdvantage = myStats.advantage === oppPet.type;
        const oppHasAdvantage = oppStats.advantage === myPet.type;

        // Determina quem ataca primeiro (velocidade)
        const myFirst = myStats.totalSpd >= oppStats.totalSpd;

        // Batalha detalhada
        let myHp = myPet.hp;
        let oppHp = oppPet.hp;
        let turn = 0;
        const maxTurns = 15;

        let battleLog = `╭━━━⊱ ⚔️ *BATALHA DE PETS!* ⚔️ ⊱━━━╮\n\n`;
        battleLog += `${myPet.emoji} *${myPet.name}* (Lv.${myPet.level})\n`;
        battleLog += `❤️ ${myHp}/${myPet.maxHp} | ⚔️ ${myStats.totalAtk} | 🛡️ ${myStats.totalDef} | ⚡ ${myStats.totalSpd}\n`;
        if (hasAdvantage) battleLog += `✨ *VANTAGEM DE TIPO!*\n`;
        battleLog += `\n🆚\n\n`;
        battleLog += `${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n`;
        battleLog += `❤️ ${oppHp}/${oppPet.maxHp} | ⚔️ ${oppStats.totalAtk} | 🛡️ ${oppStats.totalDef} | ⚡ ${oppStats.totalSpd}\n`;
        if (oppHasAdvantage) battleLog += `✨ *VANTAGEM DE TIPO!*\n`;
        battleLog += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        battleLog += `⚡ *INÍCIO DA BATALHA!*\n\n`;

        while (myHp > 0 && oppHp > 0 && turn < maxTurns) {
          turn++;
          battleLog += `━━━ *Turno ${turn}* ━━━\n`;

          const attackers = myFirst ?
            [{ pet: myPet, stats: myStats, hp: myHp, isMe: true }, { pet: oppPet, stats: oppStats, hp: oppHp, isMe: false }] :
            [{ pet: oppPet, stats: oppStats, hp: oppHp, isMe: false }, { pet: myPet, stats: myStats, hp: myHp, isMe: true }];

          for (const attacker of attackers) {
            if (myHp <= 0 || oppHp <= 0) break;

            const defender = attacker.isMe ?
              { pet: oppPet, stats: oppStats, hp: oppHp, isMe: false } :
              { pet: myPet, stats: myStats, hp: myHp, isMe: true };

            const advantage = attacker.isMe ? hasAdvantage : oppHasAdvantage;

            // Calcula dano
            let baseDmg = Math.max(1, attacker.stats.totalAtk - Math.floor(defender.stats.totalDef / 2));
            const variance = Math.floor(Math.random() * 11) - 5; // -5 a +5
            baseDmg += variance;

            // Bônus de vantagem: 50% de dano extra
            if (advantage) {
              baseDmg = Math.floor(baseDmg * 1.5);
            }

            // Chance de crítico (10% base + bônus de equipamento)
            const critChance = 10 + (attacker.stats.critBonus || 0);
            const isCrit = Math.random() * 100 < critChance;
            if (isCrit) {
              baseDmg = Math.floor(baseDmg * 1.8);
            }

            // Aplica dano
            if (attacker.isMe) {
              oppHp -= baseDmg;
              battleLog += `⚔️ ${attacker.pet.emoji} ${attacker.pet.name} atacou!\n`;
              if (advantage) battleLog += `   ✨ *SUPER EFETIVO!*\n`;
              if (isCrit) battleLog += `   💥 *CRÍTICO!*\n`;
              battleLog += `   💔 Dano: ${baseDmg}\n`;
              battleLog += `   ❤️ HP Oponente: ${Math.max(0, oppHp)}/${oppPet.maxHp}\n`;
            } else {
              myHp -= baseDmg;
              battleLog += `🛡️ ${attacker.pet.emoji} ${attacker.pet.name} contra-atacou!\n`;
              if (advantage) battleLog += `   ✨ *SUPER EFETIVO!*\n`;
              if (isCrit) battleLog += `   💥 *CRÍTICO!*\n`;
              battleLog += `   💔 Dano: ${baseDmg}\n`;
              battleLog += `   ❤️ Seu HP: ${Math.max(0, myHp)}/${myPet.maxHp}\n`;
            }
          }

          battleLog += `\n`;
        }

        const won = myHp > oppHp;
        let reward = 0;
        let expGain = 0;
        let itemDropped = null;

        if (won) {
          // Recompensas
          reward = 1000 + (oppPet.level * 150);
          expGain = 75 + (oppPet.level * 5);

          me.wallet += reward;
          myPet.wins = (myPet.wins || 0) + 1;
          myPet.exp = (myPet.exp || 0) + expGain;
          oppPet.losses = (oppPet.losses || 0) + 1;

          // Sistema de drop de item (30% de chance)
          if (Math.random() < 0.3) {
            const oppEquipment = Object.entries(oppPet.equipment || {});
            if (oppEquipment.length > 0) {
              const [slot, itemId] = oppEquipment[Math.floor(Math.random() * oppEquipment.length)];
              const item = SHOP_ITEMS[itemId];

              if (item) {
                itemDropped = item.name;
                me.inventory[itemId] = (me.inventory[itemId] || 0) + 1;
              }
            }
          }

          battleLog += `╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n`;
          battleLog += `│ ${myPet.emoji} *${myPet.name}* venceu!\n`;
          battleLog += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          battleLog += `📊 *RECOMPENSAS:*\n`;
          battleLog += `💰 Moedas: +${reward.toLocaleString()}\n`;
          battleLog += `✨ EXP: +${expGain}\n`;
          if (itemDropped) {
            battleLog += `🎁 Item dropado: *${itemDropped}*\n`;
          }

          // Verifica level up
          if (myPet.exp >= myPet.level * 100) {
            myPet.level++;
            const atkGain = 2 + Math.floor(Math.random() * 3);
            const defGain = 1 + Math.floor(Math.random() * 2);
            const hpGain = 10 + Math.floor(Math.random() * 10);

            myPet.attack += atkGain;
            myPet.defense += defGain;
            myPet.maxHp += hpGain;
            myPet.hp = myPet.maxHp;
            myPet.exp = 0;

            battleLog += `\n╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n`;
            battleLog += `│ ${myPet.emoji} ${myPet.name} → Lv.${myPet.level}\n`;
            battleLog += `│ ⚔️ ATK +${atkGain} | 🛡️ DEF +${defGain} | ❤️ HP +${hpGain}\n`;
            battleLog += `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
          }
        } else {
          oppPet.wins = (oppPet.wins || 0) + 1;
          myPet.losses = (myPet.losses || 0) + 1;

          battleLog += `╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n`;
          battleLog += `│ ${oppPet.emoji} *${oppPet.name}* venceu!\n`;
          battleLog += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          battleLog += `💪 Continue treinando para melhorar!`;
        }

        me.lastPetBattle = Date.now();
        saveEconomy(econ);
        return reply(battleLog, { mentions: [target] });
        break;
      }

      // Apostar com Pets
      case 'apostarpet':
      case 'petbet': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);
        const target = (menc_jid2 && menc_jid2[0]) || null;

        if (!target) return reply(`❌ Marque alguém para apostar!\n\n💡 Uso: ${prefix}apostarpet <valor> <nº pet> @user`);
        if (target === sender) return reply('❌ Você não pode apostar contra si mesmo!');

        const argsArr = q.split(' ');
        const betAmount = parseInt(argsArr[0]) || 0;
        const petIndex = parseInt(argsArr[1]) - 1;

        if (betAmount <= 0) return reply('❌ Informe um valor válido para apostar!');
        if (betAmount > me.wallet) return reply('❌ Você não tem dinheiro suficiente na carteira!');

        const opponent = getEcoUser(econ, target);
        if (betAmount > opponent.wallet) return reply('❌ Seu oponente não tem dinheiro suficiente!');

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
        if (!opponent.pets || opponent.pets.length === 0) return reply('❌ Seu oponente não tem pets!');

        if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
          return reply(`❌ Pet inválido! Use ${prefix}pets para ver seus pets.`);
        }

        const myPet = me.pets[petIndex];
        const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];

        // Batalha
        let myHp = myPet.hp;
        let oppHp = oppPet.hp;

        while (myHp > 0 && oppHp > 0) {
          const myDmg = Math.max(1, myPet.attack - Math.floor(oppPet.defense / 2) + Math.floor(Math.random() * 10));
          oppHp -= myDmg;
          if (oppHp <= 0) break;

          const oppDmg = Math.max(1, oppPet.attack - Math.floor(myPet.defense / 2) + Math.floor(Math.random() * 10));
          myHp -= oppDmg;
        }

        const won = myHp > oppHp;

        let resultMsg = `╭━━━⊱ 🎰 *APOSTA DE PETS* ⊱━━━╮\n\n`;
        resultMsg += `${myPet.emoji} *${myPet.name}* (Lv.${myPet.level}) VS ${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n\n`;
        resultMsg += `💰 Aposta: ${betAmount.toLocaleString()}\n\n`;

        if (won) {
          me.wallet += betAmount;
          opponent.wallet -= betAmount;
          resultMsg += `🏆 *VOCÊ VENCEU!*\n💰 Ganhou: +${betAmount.toLocaleString()}`;
        } else {
          me.wallet -= betAmount;
          opponent.wallet += betAmount;
          resultMsg += `💀 *VOCÊ PERDEU!*\n💸 Perdeu: -${betAmount.toLocaleString()}`;
        }

        resultMsg += `\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(resultMsg, { mentions: [target] });
      }

      // Equipar item no Pet
      case 'equippet':
      case 'equiparpet': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.inventory) me.inventory = {};

        const argsArr = q.split(' ');
        const petIndex = parseInt(argsArr[0]) - 1;
        const itemId = argsArr.slice(1).join('_').toLowerCase();

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
        if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
          return reply(`❌ Pet inválido!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`);
        }
        if (!itemId) return reply(`❌ Informe o item!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`);

        const pet = me.pets[petIndex];

        // Busca o item no inventário
        const foundItemId = Object.keys(me.inventory).find(key => {
          return key.toLowerCase().includes(itemId) && me.inventory[key] > 0;
        });

        if (!foundItemId) return reply('❌ Você não tem esse item no inventário!');

        const item = SHOP_ITEMS[foundItemId];
        if (!item) return reply('❌ Item inválido!');

        // Determina o slot do equipamento
        let slot = 'weapon';
        if (item.name.includes('Armadura') || item.name.includes('Armor')) slot = 'armor';
        else if (item.name.includes('Escudo') || item.name.includes('Shield')) slot = 'shield';
        else if (item.name.includes('Anel') || item.name.includes('Ring') || item.name.includes('Colar') || item.name.includes('Collar')) slot = 'accessory';
        else if (item.name.includes('Poção') || item.name.includes('Potion')) slot = 'potion';
        else if (foundItemId.includes('slayer') || foundItemId.includes('bane') || foundItemId.includes('feather') || foundItemId.includes('talisman') || foundItemId.includes('eye')) slot = 'weapon';

        if (!pet.equipment) pet.equipment = {};

        // Se já tem item no slot, devolve ao inventário
        if (pet.equipment[slot]) {
          me.inventory[pet.equipment[slot]] = (me.inventory[pet.equipment[slot]] || 0) + 1;
        }

        // Equipa o novo item
        pet.equipment[slot] = foundItemId;
        me.inventory[foundItemId]--;

        saveEconomy(econ);

        let text = `✅ ${pet.emoji} *${pet.name}* equipou *${item.name}*!\n\n`;
        text += `📦 *Slot:* ${slot === 'weapon' ? '⚔️ Arma' : slot === 'armor' ? '🛡️ Armadura' : slot === 'shield' ? '🛡️ Escudo' : slot === 'accessory' ? '💍 Acessório' : '🧪 Poção'}\n\n`;

        if (item.stats) {
          text += `📊 *Bônus:*\n`;
          if (item.stats.attack) text += `⚔️ ATK +${item.stats.attack}\n`;
          if (item.stats.defense) text += `🛡️ DEF +${item.stats.defense}\n`;
          if (item.stats.speed) text += `⚡ SPD +${item.stats.speed}\n`;
          if (item.stats.critBonus) text += `💥 CRIT +${item.stats.critBonus}%\n`;
        }

        if (item.advantage) {
          text += `\n✨ *Vantagem contra:* ${item.advantage}`;
        }

        return reply(text);
      }

      // Desequipar item do Pet
      case 'unequippet':
      case 'desequiparpet': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const petIndex = parseInt(q) - 1;

        if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
        if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
          return reply(`❌ Pet inválido!\n\n💡 Uso: ${prefix}unequippet <nº pet>`);
        }

        const pet = me.pets[petIndex];
        if (!pet.equipment || !pet.equipment.accessory) {
          return reply(`❌ ${pet.emoji} *${pet.name}* não tem equipamentos!`);
        }

        const item = pet.equipment.accessory;
        me.inventory = me.inventory || {};
        me.inventory[item] = (me.inventory[item] || 0) + 1;
        delete pet.equipment.accessory;

        saveEconomy(econ);
        return reply(`✅ *${item}* foi removido de ${pet.emoji} *${pet.name}* e devolvido ao inventário!`);
      }

      // Equipar item para o Jogador
      case 'equipar':
      case 'equip': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.equipment) me.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };
        if (!me.inventory) me.inventory = {};

        const itemId = q?.toLowerCase().trim();
        if (!itemId) {
          return reply(`❌ Informe o item para equipar!\n\n💡 Uso: ${prefix}equipar <item>\n📦 Veja seus itens: ${prefix}inventario`);
        }

        // Procura o item no inventário
        let foundItemId = null;
        for (const [key, qty] of Object.entries(me.inventory)) {
          if (qty > 0 && (key.toLowerCase().includes(itemId) || key === itemId)) {
            foundItemId = key;
            break;
          }
        }

        if (!foundItemId) {
          return reply(`❌ Item não encontrado no inventário!\n\n💡 Use ${prefix}inventario para ver seus itens`);
        }

        const item = econ.shop[foundItemId];
        if (!item || item.type !== 'equipment') {
          return reply('❌ Este item não pode ser equipado!');
        }

        const slot = item.slot;
        if (!slot) {
          return reply('❌ Item sem slot definido!');
        }

        // Se já tem item no slot, devolve ao inventário
        if (me.equipment[slot]) {
          me.inventory[me.equipment[slot]] = (me.inventory[me.equipment[slot]] || 0) + 1;
        }

        // Equipa o novo item
        me.equipment[slot] = foundItemId;
        me.inventory[foundItemId]--;

        // Recalcula bônus dos equipamentos e salva
        recalcEquipmentBonuses(me, econ.shop);
        saveEconomy(econ);

        let text = `✅ Você equipou *${item.name}*!\n\n`;
        text += `📦 *Slot:* ${slot === 'weapon' ? '⚔️ Arma' : slot === 'armor' ? '🛡️ Armadura' : slot === 'helmet' ? '🎩 Elmo' : slot === 'boots' ? '👢 Botas' : slot === 'shield' ? '🛡️ Escudo' : '💍 Acessório'}\n\n`;

        if (item.attackBonus) text += `⚔️ Ataque: +${item.attackBonus}\n`;
        if (item.defenseBonus) text += `🛡️ Defesa: +${item.defenseBonus}\n`;
        if (item.hpBonus) text += `❤️ Vida: +${item.hpBonus}\n`;

        return reply(text);
      }

      // Desequipar item do Jogador
      case 'desequipar':
      case 'unequip': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.equipment) me.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };
        if (!me.inventory) me.inventory = {};

        const slotName = q?.toLowerCase().trim();
        if (!slotName) {
          let text = `❌ Informe o slot para desequipar!\n\n💡 Uso: ${prefix}desequipar <slot>\n`;
          text += `📦 Slots disponíveis: arma, armadura, elmo, botas, escudo, acessório`;
          return reply(text);
        }

        // Mapeia nomes de slot
        let slot = null;
        if (slotName.includes('arma') || slotName.includes('weapon')) slot = 'weapon';
        else if (slotName.includes('armadura') || slotName.includes('armor')) slot = 'armor';
        else if (slotName.includes('elmo') || slotName.includes('helmet')) slot = 'helmet';
        else if (slotName.includes('botas') || slotName.includes('boots')) slot = 'boots';
        else if (slotName.includes('escudo') || slotName.includes('shield')) slot = 'shield';
        else if (slotName.includes('acessório') || slotName.includes('accessory') || slotName.includes('anel')) slot = 'accessory';

        if (!slot) {
          return reply(`❌ Slot inválido!\n\n💡 Use: arma, armadura, elmo, botas, escudo ou acessório`);
        }

        if (!me.equipment[slot]) {
          return reply(`❌ Você não tem nada equipado no slot ${slotName}!`);
        }

        const itemId = me.equipment[slot];
        const item = econ.shop[itemId];
        if (!item) {
          return reply('❌ Item inválido!');
        }

        // Devolve ao inventário
        me.inventory[itemId] = (me.inventory[itemId] || 0) + 1;
        me.equipment[slot] = null;

        saveEconomy(econ);
        return reply(`✅ *${item.name}* foi removido e devolvido ao inventário!`);
      }

      // Sistema de Dungeons/Masmorras Solo
      case 'masmorrasolo':
      case 'dungeonsolo':
      case 'dg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const now = Date.now();
        if (me.lastDungeon && (now - me.lastDungeon) < 7200000) {
          const remaining = Math.ceil((7200000 - (now - me.lastDungeon)) / 60000);
          return reply(`⏰ Você está cansado da última aventura!\n\n🕐 Aguarde *${remaining} minutos*`);
        }

        const dungeons = [
          { name: '🕷️ Caverna das Aranhas', diff: 1, reward: [1000, 2000], exp: 100, emoji: '🕷️' },
          { name: '🧟 Cripta dos Mortos', diff: 2, reward: [2000, 4000], exp: 200, emoji: '🧟' },
          { name: '🐉 Covil do Dragão', diff: 3, reward: [5000, 10000], exp: 500, emoji: '🐉' },
          { name: '👹 Fortaleza Demoníaca', diff: 4, reward: [10000, 20000], exp: 1000, emoji: '👹' }
        ];

        const userLevel = me.level || 1;
        const availableDungeons = dungeons.filter(d => d.diff <= Math.ceil(userLevel / 5) + 1);

        if (!q) {
          let text = `╭━━━⊱ 🗺️ *MASMORRAS* ⊱━━━╮\n`;
          text += `│ Aventureiro: *${pushname}*\n`;
          text += `│ Nível: ${userLevel}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          availableDungeons.forEach((d, i) => {
            text += `${i + 1}. ${d.emoji} *${d.name}*\n`;
            text += `┌─────────────────\n`;
            text += `│ 🎯 Dificuldade: ${'⭐'.repeat(d.diff)}\n`;
            text += `│ 💰 Recompensa: ${d.reward[0].toLocaleString()}-${d.reward[1].toLocaleString()}\n`;
            text += `│ ✨ EXP: ${d.exp}\n`;
            text += `└─────────────────\n\n`;
          });

          text += `💡 Use ${prefix}masmorra <número>`;
          return reply(text);
        }

        const index = parseInt(q) - 1;
        if (isNaN(index) || index < 0 || index >= availableDungeons.length) {
          return reply('❌ Masmorra inválida!');
        }

        const dungeon = availableDungeons[index];
        const userPower = (me.power || 100) + (me.attackBonus || 0);
        const success = Math.random() < (0.7 - (dungeon.diff * 0.1) + (userPower / 1000));

        me.lastDungeon = now;

        if (success) {
          const reward = Math.floor(Math.random() * (dungeon.reward[1] - dungeon.reward[0])) + dungeon.reward[0];
          me.wallet += reward;
          me.exp = (me.exp || 0) + dungeon.exp;

          // Verifica level up
          if (!me.level) me.level = 1;
          const nextLevelXp = 100 * Math.pow(1.5, me.level - 1);
          let leveledUp = false;
          let levelsGained = 0;

          while (me.exp >= nextLevelXp) {
            me.exp -= nextLevelXp;
            me.level++;
            levelsGained++;
            leveledUp = true;
            if (me.level > 100) break; // Safety cap
          }

          // Atualiza missão de dungeon
          updateQuestProgress(me, 'dungeon', 1);

          let text = `╭━━━⊱ ⚔️ *VITÓRIA!* ⚔️ ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ ${dungeon.emoji} *${dungeon.name}*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `🎉 *Você derrotou todos os monstros!*\n\n`;
          text += `┌─⊱ 💰 *RECOMPENSAS* ⊰─┐\n`;
          text += `│\n`;
          text += `│ 💵 Moedas: *+${reward.toLocaleString()}*\n`;
          text += `│ ✨ EXP: *+${dungeon.exp}*\n`;

          if (leveledUp) {
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            text += `╭━━━⊱   *LEVEL UP!*   ⊱━━━╮\n`;
            text += `│\n`;
            text += `│ 📊 Você subiu *${levelsGained}*`;
            text += levelsGained > 1 ? ` *níveis!*\n` : ` *nível!*\n`;
            text += `│   Nível atual: *${me.level}*\n`;
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━╯`;
          } else {
            text += `│\n`;
            text += `└━━━━━━━━━━━━━━━━━━━━┘`;
          }

          text += `\n\n🏆 *Continue assim, aventureiro!*`;

          saveEconomy(econ);
          return reply(text);
        } else {
          const loss = Math.floor(me.wallet * 0.1);
          me.wallet = Math.max(0, me.wallet - loss);

          let text = `╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ ${dungeon.emoji} *${dungeon.name}*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `😵 *Você foi derrotado pelos monstros...*\n\n`;
          text += `┌─⊱ 💸 *PERDAS* ⊰─┐\n`;
          text += `│\n`;
          text += `│ 💵 Moedas: *-${loss.toLocaleString()}*\n`;
          text += `│\n`;
          text += `└━━━━━━━━━━━━━━━━━━━━┘\n\n`;
          text += `💪 *Fortaleça-se e tente novamente!*`;

          saveEconomy(econ);
          return reply(text);
        }
        break;
      }

      // Sistema de Chefe/Boss RPG
      case 'cheferpg':
      case 'bossrpg':
      case 'bossfight': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const now = Date.now();
        const BOSS_COOLDOWN = 4 * 60 * 60 * 1000; // 4 horas

        if (me.lastBoss && (now - me.lastBoss) < BOSS_COOLDOWN) {
          const remaining = Math.ceil((BOSS_COOLDOWN - (now - me.lastBoss)) / 60000);
          const hours = Math.floor(remaining / 60);
          const mins = remaining % 60;
          return reply(`⏰ Você está exausto da última batalha!\n\n🕐 Aguarde *${hours}h ${mins}min*`);
        }

        const bosses = [
          { name: 'Dragão Ancião', emoji: '🐉', hp: 1000, attack: 80, defense: 50, reward: 15000, xp: 500 },
          { name: 'Golem de Pedra', emoji: '🗿', hp: 1500, attack: 60, defense: 80, reward: 12000, xp: 400 },
          { name: 'Hidra Venenosa', emoji: '🐍', hp: 800, attack: 100, defense: 30, reward: 18000, xp: 600 },
          { name: 'Fênix Sombria', emoji: '🔥', hp: 700, attack: 90, defense: 40, reward: 20000, xp: 700 },
          { name: 'Kraken Abissal', emoji: '🦑', hp: 1200, attack: 70, defense: 60, reward: 16000, xp: 550 }
        ];

        const boss = bosses[Math.floor(Math.random() * bosses.length)];
        const playerPower = (me.power || 100) + (me.level || 1) * 10;

        let bossHp = boss.hp;
        let playerHp = 100 + (me.level || 1) * 5;
        let turns = 0;
        const maxTurns = 15;

        let battleLog = `╭━━━⊱ 👹 *BOSS FIGHT!* ⊱━━━╮\n\n`;
        battleLog += `${boss.emoji} *${boss.name}*\n`;
        battleLog += `❤️ HP: ${boss.hp} | ⚔️ ATK: ${boss.attack} | 🛡️ DEF: ${boss.defense}\n\n`;
        battleLog += `VS\n\n`;
        battleLog += `⚔️ *${pushname}* (Poder: ${playerPower})\n\n`;
        battleLog += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        while (bossHp > 0 && playerHp > 0 && turns < maxTurns) {
          // Player ataca
          const playerDmg = Math.max(10, Math.floor(playerPower * 0.3 + Math.random() * 30 - boss.defense * 0.2));
          bossHp -= playerDmg;

          if (bossHp <= 0) {
            battleLog += `⚔️ Você desferiu o golpe final! (-${playerDmg} HP)\n`;
            break;
          }

          // Boss ataca
          const bossDmg = Math.max(5, boss.attack - Math.floor(playerPower * 0.1) + Math.floor(Math.random() * 20));
          playerHp -= bossDmg;

          turns++;
        }

        me.lastBoss = Date.now();
        me.stats = me.stats || {};

        if (bossHp <= 0) {
          me.wallet += boss.reward;
          me.stats.bossesDefeated = (me.stats.bossesDefeated || 0) + 1;

          battleLog += `\n╭━━━⊱ 🏆 *VITÓRIA!* ⊱━━━╮\n`;
          battleLog += `│ Você derrotou ${boss.emoji} *${boss.name}*!\n`;
          battleLog += `│\n`;
          battleLog += `│ 💰 Recompensa: +${boss.reward.toLocaleString()}\n`;
          battleLog += `│ ✨ XP: +${boss.xp}\n`;
          battleLog += `│ 🏅 Bosses derrotados: ${me.stats.bossesDefeated}\n`;
          battleLog += `╰━━━━━━━━━━━━━━━━━━━━╯`;
        } else {
          battleLog += `\n╭━━━⊱ 💀 *DERROTA!* ⊱━━━╮\n`;
          battleLog += `│ ${boss.emoji} *${boss.name}* foi mais forte!\n`;
          battleLog += `│\n`;
          battleLog += `│ 💡 Fique mais forte e tente novamente!\n`;
          battleLog += `│ 📈 Use ${prefix}evoluir para melhorar\n`;
          battleLog += `╰━━━━━━━━━━━━━━━━━━━━╯`;
        }

        saveEconomy(econ);
        return reply(battleLog);
      }

      // Sistema de Eventos
      case 'eventos':
      case 'events':
      case 'eventosrpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();

        const weeklyEvents = [
          { day: 0, name: '🎁 Domingo de Bônus', desc: 'Recompensas dobradas em todas atividades!', active: dayOfWeek === 0 },
          { day: 1, name: '⛏️ Segunda da Mineração', desc: 'Bônus +50% em mineração!', active: dayOfWeek === 1 },
          { day: 2, name: '🎣 Terça da Pescaria', desc: 'Chances de peixes raros aumentadas!', active: dayOfWeek === 2 },
          { day: 3, name: '🏹 Quarta da Caça', desc: 'Encontre presas lendárias!', active: dayOfWeek === 3 },
          { day: 4, name: '💰 Quinta do Trabalho', desc: 'Salários aumentados em +75%!', active: dayOfWeek === 4 },
          { day: 5, name: '⚔️ Sexta de Batalha', desc: 'XP dobrado em duelos e arenas!', active: dayOfWeek === 5 },
          { day: 6, name: '🎰 Sábado do Cassino', desc: 'Chances de ganhar melhoradas!', active: dayOfWeek === 6 }
        ];

        const hourlyEvents = [
          { start: 12, end: 14, name: '🌞 Hora do Almoço', desc: 'Cooldowns reduzidos pela metade!' },
          { start: 18, end: 20, name: '🌙 Happy Hour', desc: 'Ganhos +30% em todas atividades!' },
          { start: 0, end: 3, name: '🌌 Evento Noturno', desc: 'Encontre itens raros e misteriosos!' }
        ];

        let text = `╭━━━⊱ 🎉 *EVENTOS RPG* ⊱━━━╮\n`;
        text += `│ 📅 ${now.toLocaleDateString('pt-BR')}\n`;
        text += `│ 🕐 ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        text += `🗓️ *EVENTO DO DIA:*\n`;
        const todayEvent = weeklyEvents.find(e => e.active);
        if (todayEvent) {
          text += `✨ ${todayEvent.name}\n`;
          text += `   ${todayEvent.desc}\n\n`;
        }

        text += `⏰ *EVENTOS POR HORÁRIO:*\n`;
        for (const ev of hourlyEvents) {
          const isActive = hour >= ev.start && hour < ev.end;
          const status = isActive ? '🟢 ATIVO' : '⚪ Inativo';
          text += `${status} ${ev.name} (${ev.start}h-${ev.end}h)\n`;
          text += `   ${ev.desc}\n\n`;
        }

        text += `╭━━━━━━━━━━━━━━━━━━━━╮\n`;
        text += `│ 📅 *CALENDÁRIO SEMANAL:*\n`;
        for (const ev of weeklyEvents) {
          const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const isToday = ev.active ? ' ← HOJE' : '';
          text += `│ ${days[ev.day]}: ${ev.name}${isToday}\n`;
        }
        text += `╰━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(text);
      }

      // Sistema de Duelos/PvP RPG
      case 'duelarrpg':
      case 'duelorpg':
      case 'duelrpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para duelar!\n\n💡 Exemplo: ${prefix}duelarrpg @user`);
        if (target === sender) return reply('❌ Você não pode duelar consigo mesmo!');

        const opponent = getEcoUser(econ, target);

        const now = Date.now();
        if (me.lastDuel && (now - me.lastDuel) < 600000) {
          const remaining = Math.ceil((600000 - (now - me.lastDuel)) / 60000);
          return reply(`⏰ Você está cansado! Aguarde ${remaining} minutos para outro duelo.`);
        }

        // Calcular stats
        const myPower = (me.power || 100) + (me.attackBonus || 0);
        const myDefense = (me.defenseBonus || 0) + 50;
        const oppPower = (opponent.power || 100) + (opponent.attackBonus || 0);
        const oppDefense = (opponent.defenseBonus || 0) + 50;

        let myHp = 200 + ((me.level || 1) * 10);
        let oppHp = 200 + ((opponent.level || 1) * 10);

        let text = `╭━━━⊱ ⚔️ *DUELO* ⊱━━━╮\n`;
        text += `│ ${pushname} VS @${target.split('@')[0]}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        let turn = 0;
        let battle = '';

        while (myHp > 0 && oppHp > 0 && turn < 10) {
          turn++;

          // Meu ataque
          const myDmg = Math.max(5, myPower - Math.floor(Math.random() * oppDefense));
          oppHp -= myDmg;
          battle += `⚔️ ${pushname}: -${myDmg} HP\n`;

          if (oppHp <= 0) break;

          // Ataque oponente
          const oppDmg = Math.max(5, oppPower - Math.floor(Math.random() * myDefense));
          myHp -= oppDmg;
          battle += `🛡️ Oponente: -${oppDmg} HP\n\n`;
        }

        me.lastDuel = now;

        if (myHp > oppHp) {
          const reward = Math.floor((opponent.wallet || 0) * 0.05);
          me.wallet += reward;
          opponent.wallet = Math.max(0, opponent.wallet - reward);
          me.exp = (me.exp || 0) + 150;

          // Incrementar estatísticas de batalha
          if (!me.battlesWon) me.battlesWon = 0;
          if (!opponent.battlesLost) opponent.battlesLost = 0;
          me.battlesWon++;
          opponent.battlesLost++;

          // Verifica level up
          if (!me.level) me.level = 1;
          const nextLevelXp = 100 * Math.pow(1.5, me.level - 1);
          let leveledUp = false;

          if (me.exp >= nextLevelXp) {
            me.exp -= nextLevelXp;
            me.level++;
            leveledUp = true;
          }

          // Atualiza missão de duelo
          updateQuestProgress(me, 'duel', 1);

          text += battle;
          text += `\n╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ 💰 Recompensa: *+${reward.toLocaleString()}*\n`;
          text += `│ ✨ EXP: *+150*\n`;

          if (leveledUp) {
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            text += `╭━━━⊱   *LEVEL UP!* 🌟 ⊱━━━╮\n`;
            text += `│\n`;
            text += `│ 📊 Nível atual: *${me.level}*\n`;
            text += `│ ❤️ HP restante: *${Math.max(0, myHp)}*\n`;
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━╯`;
          } else {
            text += `│ ❤️ HP restante: *${Math.max(0, myHp)}*\n`;
            text += `│\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━╯`;
          }

          saveEconomy(econ);
          return reply(text, { mentions: [target] });
        } else {
          const loss = Math.floor(me.wallet * 0.05);
          me.wallet = Math.max(0, me.wallet - loss);
          opponent.wallet += loss;
          opponent.exp = (opponent.exp || 0) + 150;

          // Incrementar estatísticas de batalha
          if (!me.battlesLost) me.battlesLost = 0;
          if (!opponent.battlesWon) opponent.battlesWon = 0;
          me.battlesLost++;
          opponent.battlesWon++;

          // Atualiza missão de duelo mesmo em derrota
          updateQuestProgress(me, 'duel', 1);

          text += battle;
          text += `\n╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ 💸 Perdeu: *-${loss.toLocaleString()}*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `💪 *Treine mais e desafie novamente!*`;

          saveEconomy(econ);
          return reply(text, { mentions: [target] });
        }
        break;
      }

      // Sistema de Arena
      case 'arena': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const now = Date.now();
        if (me.lastArena && (now - me.lastArena) < 1800000) {
          const remaining = Math.ceil((1800000 - (now - me.lastArena)) / 60000);
          return reply(`⏰ A arena está fechada para você! Aguarde ${remaining} minutos.`);
        }

        const levels = [
          { name: 'Bronze', minLevel: 1, reward: [1000, 3000], enemies: 3 },
          { name: 'Prata', minLevel: 5, reward: [3000, 7000], enemies: 5 },
          { name: 'Ouro', minLevel: 10, reward: [7000, 15000], enemies: 7 },
          { name: 'Platina', minLevel: 20, reward: [15000, 30000], enemies: 10 }
        ];

        const userLevel = me.level || 1;
        const available = levels.filter(l => l.minLevel <= userLevel);

        if (!q) {
          let text = `╭━━━⊱ 🏛️ *ARENA* ⊱━━━╮\n`;
          text += `│ Gladiador: *${pushname}*\n`;
          text += `│ Nível: ${userLevel}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          available.forEach((l, i) => {
            text += `${i + 1}. 🏆 *${l.name}*\n`;
            text += `┌─────────────────\n`;
            text += `│ 🎯 Nível Mínimo: ${l.minLevel}\n`;
            text += `│ 💰 Prêmio: ${l.reward[0].toLocaleString()}-${l.reward[1].toLocaleString()}\n`;
            text += `│ ⚔️ Inimigos: ${l.enemies}\n`;
            text += `└─────────────────\n\n`;
          });

          text += `💡 Use ${prefix}arena <número>`;
          return reply(text);
        }

        const index = parseInt(q) - 1;
        if (isNaN(index) || index < 0 || index >= available.length) {
          return reply('❌ Arena inválida!');
        }

        const arena = available[index];
        const userPower = (me.power || 100) + (me.attackBonus || 0);
        const wins = Math.floor(Math.random() * (arena.enemies + 1));

        me.lastArena = now;

        if (wins >= arena.enemies * 0.7) {
          const reward = Math.floor(Math.random() * (arena.reward[1] - arena.reward[0])) + arena.reward[0];
          me.wallet += reward;
          me.exp = (me.exp || 0) + (arena.enemies * 50);

          // Incrementar estatísticas de batalha (vitória na arena conta como batalhas ganhas)
          if (!me.battlesWon) me.battlesWon = 0;
          me.battlesWon += Math.floor(arena.enemies * 0.7); // Conta o número de inimigos derrotados

          let text = `╭━━━⊱ 🏆 *VITÓRIA NA ARENA!* 🏆 ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ 🏟️ Arena: *${arena.name}*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `⚔️ *Derrotou:* ${wins}/${arena.enemies} inimigos\n\n`;
          text += `┌─⊱ 🎁 *RECOMPENSAS* ⊰─┐\n`;
          text += `│\n`;
          text += `│ 💰 Prêmio: *+${reward.toLocaleString()}*\n`;
          text += `│ ✨ EXP: *+${arena.enemies * 50}*\n`;
          text += `│\n`;
          text += `└━━━━━━━━━━━━━━━━━━━━━┘\n\n`;
          text += `🎉 *A multidão te aclama!*`;

          saveEconomy(econ);
          return reply(text);
        } else {
          const loss = Math.floor(me.wallet * 0.08);
          me.wallet = Math.max(0, me.wallet - loss);

          // Incrementar estatísticas de batalha (derrota na arena conta como batalha perdida)
          if (!me.battlesLost) me.battlesLost = 0;
          me.battlesLost++;

          let text = `╭━━━⊱ 💀 *DERROTA NA ARENA* 💀 ⊱━━━╮\n`;
          text += `│\n`;
          text += `│ 🏟️ Arena: *${arena.name}*\n`;
          text += `│\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `⚔️ *Derrotou:* ${wins}/${arena.enemies} inimigos\n\n`;
          text += `┌─⊱ 💸 *PERDAS* ⊰─┐\n`;
          text += `│\n`;
          text += `│ 💵 Moedas: *-${loss.toLocaleString()}*\n`;
          text += `│\n`;
          text += `└━━━━━━━━━━━━━━━━━━━━━┘\n\n`;
          text += `💪 *Continue treinando!*`;

          saveEconomy(econ);
          return reply(text);
        }
        break;
      }

      // Sistema de Encantamento
      case 'encantar':
      case 'enchant': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.equipment || !me.equipment.weapon) {
          return reply(`❌ Você não tem uma arma equipada!\n\n💡 Use ${prefix}equipar para equipar uma arma`);
        }

        const weapon = me.equipment.weapon;
        const enchantLevel = weapon.enchant || 0;

        if (enchantLevel >= 10) return reply('✨ Sua arma já está no encantamento máximo (+10)!');

        const cost = (enchantLevel + 1) * 5000;
        const crystals = (enchantLevel + 1) * 3;

        if (!q) {
          let text = `╭━━━⊱ ✨ *ENCANTAR* ⊱━━━╮\n`;
          text += `│ Arma: ${weapon.emoji} *${weapon.name}*\n`;
          text += `│ Encantamento: +${enchantLevel}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `💎 Próximo nível: +${enchantLevel + 1}\n`;
          text += `┌─────────────────\n`;
          text += `│ 💰 Custo: ${cost.toLocaleString()}\n`;
          text += `│ 💎 Cristais: ${crystals}x\n`;
          text += `│ ⚔️ ATK: +${(enchantLevel + 1) * 5}\n`;
          text += `│ 🎲 Chance: ${Math.max(30, 90 - (enchantLevel * 6))}%\n`;
          text += `└─────────────────\n\n`;
          text += `⚠️ Falha pode destruir a arma!\n\n`;
          text += `💡 Use ${prefix}encantar confirmar`;
          return reply(text);
        }

        if (q.toLowerCase() !== 'confirmar') return reply('❌ Use "confirmar" para prosseguir');

        if (me.wallet < cost) return reply(`💰 Você precisa de ${cost.toLocaleString()} moedas!`);
        if (!me.materials || (me.materials.cristal || 0) < crystals) {
          return reply(`💎 Você precisa de ${crystals}x cristais!`);
        }

        me.wallet -= cost;
        me.materials.cristal -= crystals;

        const chance = Math.max(30, 90 - (enchantLevel * 6));
        const success = Math.random() * 100 < chance;

        if (success) {
          weapon.enchant = (weapon.enchant || 0) + 1;
          weapon.attack = (weapon.attack || 0) + 5;

          let text = `╭━━━⊱ ✨ *SUCESSO!* ⊱━━━╮\n`;
          text += `│ ${weapon.emoji} ${weapon.name} +${weapon.enchant}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `🎉 Encantamento realizado!\n\n`;
          text += `⚔️ ATK: ${weapon.attack}\n`;
          text += `✨ Bônus: +${weapon.enchant * 5}\n\n`;
          text += `🌟 Sua arma está mais poderosa!`;

          saveEconomy(econ);
          return reply(text);
        } else {
          if (enchantLevel >= 5 && Math.random() < 0.3) {
            delete me.equipment.weapon;
            saveEconomy(econ);
            return reply(`💥 *FALHA CRÍTICA!*\n\n😱 Sua arma foi destruída no processo...\n\n⚠️ Você perdeu: ${weapon.emoji} ${weapon.name} +${enchantLevel}`);
          } else {
            saveEconomy(econ);
            return reply(`❌ *FALHA!*\n\n😔 O encantamento falhou, mas sua arma permaneceu intacta.\n\n💰 Perdeu: ${cost.toLocaleString()}\n💎 Perdeu: ${crystals}x cristais`);
          }
        }
        break;
      }

      // Sistema de Desmontar
      case 'desmontar':
      case 'dismantle': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.inventory || Object.keys(me.inventory).length === 0) {
          return reply(`❌ Seu inventário está vazio!\n\n💡 Consiga equipamentos em masmorras`);
        }

        if (!q) {
          let text = `╭━━━⊱ 🔨 *DESMONTAR* ⊱━━━╮\n`;
          text += `│ Desmonte itens por materiais\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `📦 *SEU INVENTÁRIO:*\n\n`;

          let index = 1;
          for (const [item, qty] of Object.entries(me.inventory)) {
            if (qty > 0) {
              text += `${index}. ${item} (${qty}x)\n`;
              index++;
            }
          }

          text += `\n💡 Use ${prefix}desmontar <nome do item>`;
          return reply(text);
        }

        const itemName = q.toLowerCase();
        if (!me.inventory[itemName] || me.inventory[itemName] <= 0) {
          return reply('❌ Você não tem este item!');
        }

        me.inventory[itemName]--;

        if (!me.materials) me.materials = {};

        const materials = ['ferro', 'madeira', 'couro', 'cristal'];
        const gained = {};

        materials.forEach(mat => {
          const amount = Math.floor(Math.random() * 5) + 1;
          me.materials[mat] = (me.materials[mat] || 0) + amount;
          gained[mat] = amount;
        });

        let text = `╭━━━⊱ 🔨 *DESMONTADO* ⊱━━━╮\n`;
        text += `│ Item: ${itemName}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `📦 *MATERIAIS OBTIDOS:*\n\n`;

        for (const [mat, amt] of Object.entries(gained)) {
          text += `• ${mat}: +${amt}\n`;
        }

        text += `\n💡 Use materiais para craftar e encantar!`;

        saveEconomy(econ);
        return reply(text);
        break;
      }

      // ═══════════════════════════════════════════════════════════════
      // ⚔️ SISTEMA DE CLASSES/PROFISSÕES
      // ═══════════════════════════════════════════════════════════════
      case 'classe':
      case 'class':
      case 'profissao': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const classes = {
          'guerreiro': { emoji: '⚔️', name: 'Guerreiro', bonus: { attack: 20, defense: 10 }, skill: 'Fúria', skillDesc: '+30% dano em duelos' },
          'mago': { emoji: '🧙', name: 'Mago', bonus: { attack: 15, mana: 30 }, skill: 'Arcano', skillDesc: '+25% ganho em mineração mágica' },
          'arqueiro': { emoji: '🏹', name: 'Arqueiro', bonus: { attack: 18, speed: 15 }, skill: 'Precisão', skillDesc: '+20% chance de crítico' },
          'curandeiro': { emoji: '💚', name: 'Curandeiro', bonus: { defense: 15, healing: 25 }, skill: 'Cura', skillDesc: 'Cura 20% HP após batalhas' },
          'ladino': { emoji: '🗡️', name: 'Ladino', bonus: { attack: 12, luck: 20 }, skill: 'Roubo', skillDesc: '+15% ganho em crimes' },
          'paladino': { emoji: '🛡️', name: 'Paladino', bonus: { defense: 25, attack: 10 }, skill: 'Proteção', skillDesc: '-20% dano recebido' }
        };

        if (!q) {
          let text = `╭━━━⊱ ⚔️ *CLASSES* ⊱━━━╮\n`;
          text += `│ Sua classe: ${me.classe ? `${classes[me.classe]?.emoji} ${classes[me.classe]?.name}` : '❌ Nenhuma'}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `📜 *CLASSES DISPONÍVEIS:*\n\n`;

          for (const [id, data] of Object.entries(classes)) {
            text += `${data.emoji} *${data.name}*\n`;
            text += `   ⚔️ ATK +${data.bonus.attack || 0} | 🛡️ DEF +${data.bonus.defense || 0}\n`;
            text += `   ✨ ${data.skill}: ${data.skillDesc}\n\n`;
          }

          text += `💡 Use: ${prefix}classe <nome>\n`;
          text += `⚠️ Custo: 50.000 (trocar classe)`;

          return reply(text);
        }

        const classeEscolhida = q.toLowerCase().trim();

        if (!classes[classeEscolhida]) {
          return reply(`❌ Classe "${q}" não existe!\n\n📜 Classes: guerreiro, mago, arqueiro, curandeiro, ladino, paladino`);
        }

        // Custo para trocar classe (grátis se não tiver nenhuma)
        const custo = me.classe ? 50000 : 0;
        if (me.wallet < custo) {
          return reply(`💰 Você precisa de ${custo.toLocaleString()} para trocar de classe!`);
        }

        me.wallet -= custo;
        me.classe = classeEscolhida;
        me.classeBonuses = classes[classeEscolhida].bonus;

        const classData = classes[classeEscolhida];

        saveEconomy(econ);
        return reply(`╭━━━⊱ ✨ *CLASSE ESCOLHIDA* ⊱━━━╮\n\n${classData.emoji} Você agora é um *${classData.name}*!\n\n📊 *Bônus:*\n⚔️ ATK +${classData.bonus.attack || 0}\n🛡️ DEF +${classData.bonus.defense || 0}\n\n✨ *Habilidade:* ${classData.skill}\n${classData.skillDesc}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
      }

      // ═══════════════════════════════════════════════════════════════
      // 🏠 SISTEMA DE HOUSING (CASAS)
      // ═══════════════════════════════════════════════════════════════
      case 'casa':
      case 'house':
      case 'lar': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const casas = {
          'barraca': { emoji: '⛺', name: 'Barraca', price: 5000, bonus: { storage: 10, regen: 1 }, renda: 100 },
          'cabana': { emoji: '🏚️', name: 'Cabana de Madeira', price: 25000, bonus: { storage: 25, regen: 2 }, renda: 500 },
          'casa': { emoji: '🏠', name: 'Casa Simples', price: 100000, bonus: { storage: 50, regen: 3 }, renda: 2000 },
          'mansao': { emoji: '🏰', name: 'Mansão', price: 500000, bonus: { storage: 100, regen: 5 }, renda: 10000 },
          'castelo': { emoji: '🏯', name: 'Castelo', price: 2000000, bonus: { storage: 200, regen: 10 }, renda: 50000 }
        };

        const decoracoes = {
          'altar': { emoji: '⛩️', name: 'Altar Místico', price: 10000, bonus: 'xp', value: 10 },
          'bau': { emoji: '📦', name: 'Baú Reforçado', price: 15000, bonus: 'storage', value: 20 },
          'jardim': { emoji: '🌸', name: 'Jardim Encantado', price: 20000, bonus: 'regen', value: 2 },
          'forja': { emoji: '🔥', name: 'Forja Caseira', price: 30000, bonus: 'craft', value: 15 },
          'biblioteca': { emoji: '📚', name: 'Biblioteca', price: 25000, bonus: 'xp', value: 15 }
        };

        if (!me.house) {
          me.house = { type: null, decorations: [], lastCollect: 0 };
        }

        const sub = args[0]?.toLowerCase();

        // Ver informações da casa
        if (!sub || sub === 'ver') {
          let text = `╭━━━⊱ 🏠 *SUA CASA* ⊱━━━╮\n\n`;

          if (me.house.type) {
            const casa = casas[me.house.type];
            text += `${casa.emoji} *${casa.name}*\n\n`;
            text += `📦 Armazenamento: +${casa.bonus.storage}\n`;
            text += `💚 Regeneração: +${casa.bonus.regen}/h\n`;
            text += `💰 Renda passiva: ${casa.renda}/dia\n\n`;

            if (me.house.decorations.length > 0) {
              text += `🎨 *Decorações:*\n`;
              me.house.decorations.forEach(d => {
                const dec = decoracoes[d];
                if (dec) text += `• ${dec.emoji} ${dec.name}\n`;
              });
            }

            text += `\n💡 *Comandos:*\n`;
            text += `• ${prefix}casa coletar - Coletar renda\n`;
            text += `• ${prefix}casa decorar <item>\n`;
            text += `• ${prefix}casa upgrade`;
          } else {
            text += `❌ Você não tem uma casa!\n\n`;
            text += `🏘️ *CASAS DISPONÍVEIS:*\n\n`;
            for (const [id, data] of Object.entries(casas)) {
              text += `${data.emoji} *${data.name}*\n`;
              text += `   💰 ${data.price.toLocaleString()} | 📦 +${data.bonus.storage}\n\n`;
            }
            text += `💡 Use: ${prefix}casa comprar <tipo>`;
          }

          return reply(text);
        }

        // Comprar casa
        if (sub === 'comprar') {
          const tipo = args[1]?.toLowerCase();
          if (!tipo || !casas[tipo]) {
            return reply(`❌ Tipo inválido!\n\n🏘️ Tipos: barraca, cabana, casa, mansao, castelo`);
          }

          const casa = casas[tipo];
          if (me.wallet < casa.price) {
            return reply(`💰 Você precisa de ${casa.price.toLocaleString()} para comprar ${casa.name}!`);
          }

          me.wallet -= casa.price;
          me.house.type = tipo;
          me.house.lastCollect = Date.now();

          saveEconomy(econ);
          return reply(`╭━━━⊱ 🎉 *CASA COMPRADA* ⊱━━━╮\n\n${casa.emoji} Você comprou uma *${casa.name}*!\n\n📦 Armazenamento: +${casa.bonus.storage}\n💰 Renda: ${casa.renda}/dia\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        // Coletar renda
        if (sub === 'coletar') {
          if (!me.house.type) return reply('❌ Você não tem uma casa!');

          const casa = casas[me.house.type];
          const agora = Date.now();
          const tempoPassado = agora - me.house.lastCollect;
          const diasPassados = Math.floor(tempoPassado / 86400000);

          if (diasPassados < 1) {
            const tempoRestante = 86400000 - tempoPassado;
            const horas = Math.floor(tempoRestante / 3600000);
            const minutos = Math.floor((tempoRestante % 3600000) / 60000);
            return reply(`⏰ Próxima coleta em: ${horas}h ${minutos}min`);
          }

          const rendaTotal = Math.min(diasPassados, 7) * casa.renda; // Máximo 7 dias acumulados
          me.wallet += rendaTotal;
          me.house.lastCollect = agora;

          saveEconomy(econ);
          return reply(`💰 *RENDA COLETADA*\n\n${casa.emoji} ${casa.name}\n💵 +${rendaTotal.toLocaleString()} (${Math.min(diasPassados, 7)} dias)`);
        }

        // Decorar
        if (sub === 'decorar') {
          if (!me.house.type) return reply('❌ Você não tem uma casa!');

          const decId = args[1]?.toLowerCase();
          if (!decId) {
            let text = `🎨 *DECORAÇÕES DISPONÍVEIS*\n\n`;
            for (const [id, data] of Object.entries(decoracoes)) {
              const owned = me.house.decorations.includes(id) ? '✅' : '';
              text += `${data.emoji} *${data.name}* ${owned}\n`;
              text += `   💰 ${data.price.toLocaleString()} | +${data.value} ${data.bonus}\n\n`;
            }
            text += `💡 Use: ${prefix}casa decorar <nome>`;
            return reply(text);
          }

          if (!decoracoes[decId]) return reply('❌ Decoração não encontrada!');
          if (me.house.decorations.includes(decId)) return reply('❌ Você já tem essa decoração!');

          const dec = decoracoes[decId];
          if (me.wallet < dec.price) return reply(`💰 Você precisa de ${dec.price.toLocaleString()}!`);

          me.wallet -= dec.price;
          me.house.decorations.push(decId);

          saveEconomy(econ);
          return reply(`🎨 *DECORAÇÃO ADICIONADA*\n\n${dec.emoji} ${dec.name}\n✨ +${dec.value} ${dec.bonus}`);
        }

        return reply(`💡 Use: ${prefix}casa para ver opções`);
      }

      // ═══════════════════════════════════════════════════════════════
      // 🏰 SISTEMA DE DUNGEONS EM GRUPO
      // ═══════════════════════════════════════════════════════════════
      case 'dungeon':
      case 'masmorra':
      case 'raid': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);
        const args = q ? q.trim().toLowerCase().split(/\s+/) : [];

        // Sistema de dungeons em grupo
        if (!econ.dungeonParties) econ.dungeonParties = {};

        const dungeons = {
          'floresta': { emoji: '🌲', name: 'Floresta Sombria', level: 1, players: 2, reward: 5000, xp: 200, boss: '🐺 Lobo Alfa' },
          'caverna': { emoji: '🕳️', name: 'Caverna Cristalina', level: 5, players: 3, reward: 15000, xp: 500, boss: '🦇 Morcego Gigante' },
          'ruinas': { emoji: '🏚️', name: 'Ruínas Antigas', level: 10, players: 3, reward: 35000, xp: 1000, boss: '💀 Esqueleto Rei' },
          'vulcao': { emoji: '🌋', name: 'Vulcão Ardente', level: 20, players: 4, reward: 80000, xp: 2500, boss: '🔥 Dragão de Fogo' },
          'abismo': { emoji: '🕳️', name: 'Abismo Profundo', level: 35, players: 4, reward: 200000, xp: 6000, boss: '👹 Demônio Ancião' }
        };

        const sub = args[0]?.toLowerCase();

        // Listar dungeons
        if (!sub || sub === 'lista') {
          let text = `╭━━━⊱ 🏰 *DUNGEONS* ⊱━━━╮\n`;
          text += `│ Seu Nível: ${me.level || 1}\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          for (const [id, data] of Object.entries(dungeons)) {
            const available = (me.level || 1) >= data.level ? '✅' : '🔒';
            text += `${data.emoji} *${data.name}* ${available}\n`;
            text += `   📊 Nv.${data.level}+ | 👥 ${data.players} jogadores\n`;
            text += `   💰 ${data.reward.toLocaleString()} | ✨ ${data.xp} XP\n`;
            text += `   👹 Boss: ${data.boss}\n\n`;
          }

          text += `💡 *Comandos:*\n`;
          text += `• ${prefix}dungeon criar <tipo>\n`;
          text += `• ${prefix}dungeon entrar <id>\n`;
          text += `• ${prefix}dungeon iniciar`;

          return reply(text);
        }

        // Criar party
        if (sub === 'criar') {
          const tipo = args[1]?.toLowerCase();
          if (!tipo || !dungeons[tipo]) {
            return reply(`❌ Dungeon inválida!\n\n🏰 Tipos: floresta, caverna, ruinas, vulcao, abismo`);
          }

          const dg = dungeons[tipo];
          if ((me.level || 1) < dg.level) {
            return reply(`🔒 Você precisa ser nível ${dg.level}+ para esta dungeon!`);
          }

          // Verificar se já está em uma party
          for (const [id, party] of Object.entries(econ.dungeonParties)) {
            if (party.members.includes(sender)) {
              return reply(`❌ Você já está em uma party!\n\n💡 Use ${prefix}dungeon sair para sair`);
            }
          }

          const partyId = `party_${Date.now()}`;
          econ.dungeonParties[partyId] = {
            id: partyId,
            type: tipo,
            leader: sender,
            members: [sender],
            maxMembers: dg.players,
            created: Date.now(),
            status: 'waiting'
          };

          saveEconomy(econ);
          return reply(`╭━━━⊱ 🎉 *PARTY CRIADA* ⊱━━━╮\n\n${dg.emoji} *${dg.name}*\n\n🆔 ID: \`${partyId.slice(-8)}\`\n👥 Membros: 1/${dg.players}\n👹 Boss: ${dg.boss}\n\n💡 Outros jogadores podem usar:\n${prefix}dungeon entrar ${partyId.slice(-8)}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        // Entrar em party
        if (sub === 'entrar') {
          const partyInput = args[1];
          if (!partyInput) return reply(`💡 Use: ${prefix}dungeon entrar <id da party>`);

          // Encontrar party
          let partyId = null;
          for (const id of Object.keys(econ.dungeonParties)) {
            if (id.endsWith(partyInput)) {
              partyId = id;
              break;
            }
          }

          if (!partyId || !econ.dungeonParties[partyId]) {
            return reply('❌ Party não encontrada!');
          }

          const party = econ.dungeonParties[partyId];
          const dg = dungeons[party.type];

          if (party.members.includes(sender)) {
            return reply('❌ Você já está nesta party!');
          }

          if (party.members.length >= party.maxMembers) {
            return reply('❌ Party está cheia!');
          }

          if ((me.level || 1) < dg.level) {
            return reply(`🔒 Você precisa ser nível ${dg.level}+!`);
          }

          party.members.push(sender);

          saveEconomy(econ);
          return reply(`✅ Você entrou na party!\n\n${dg.emoji} *${dg.name}*\n👥 Membros: ${party.members.length}/${party.maxMembers}\n\n${party.members.length >= party.maxMembers ? `🎮 Party completa! Líder pode usar ${prefix}dungeon iniciar` : '⏳ Aguardando mais membros...'}`);
        }

        // Iniciar dungeon
        if (sub === 'iniciar') {
          let myParty = null;
          for (const [id, party] of Object.entries(econ.dungeonParties)) {
            if (party.leader === sender) {
              myParty = party;
              break;
            }
          }

          if (!myParty) return reply('❌ Você não é líder de nenhuma party!');

          const dg = dungeons[myParty.type];

          if (myParty.members.length < 2) {
            return reply(`❌ Você precisa de pelo menos 2 membros para iniciar!`);
          }

          // Calcular poder total do grupo
          let poderTotal = 0;
          myParty.members.forEach(member => {
            const user = getEcoUser(econ, member);
            poderTotal += (user.power || 100) + ((user.level || 1) * 10);
          });

          // Poder do boss
          const poderBoss = dg.level * 100 + dg.players * 50;

          // Calcular chance de vitória
          const chance = Math.min(95, Math.max(20, (poderTotal / poderBoss) * 50 + 25));
          const vitoria = Math.random() * 100 < chance;

          let text = `╭━━━⊱ ${dg.emoji} *${dg.name}* ⊱━━━╮\n\n`;
          text += `👥 *PARTY:*\n`;
          myParty.members.forEach(m => {
            const u = getEcoUser(econ, m);
            text += `• @${m.split('@')[0]} (Nv.${u.level || 1})\n`;
          });
          text += `\n⚔️ Poder Total: ${poderTotal}\n`;
          text += `👹 Boss: ${dg.boss}\n\n`;

          if (vitoria) {
            text += `🎉 *VITÓRIA!*\n\n`;
            text += `💰 Recompensas (cada):\n`;
            text += `• ${Math.floor(dg.reward / myParty.members.length).toLocaleString()} moedas\n`;
            text += `• ${Math.floor(dg.xp / myParty.members.length)} XP\n`;

            // Distribuir recompensas
            myParty.members.forEach(m => {
              const u = getEcoUser(econ, m);
              u.wallet += Math.floor(dg.reward / myParty.members.length);
              u.xp = (u.xp || 0) + Math.floor(dg.xp / myParty.members.length);
            });
          } else {
            text += `💀 *DERROTA!*\n\n`;
            text += `😔 O boss ${dg.boss} foi muito forte...\n`;
            text += `💡 Tente novamente com mais poder!`;
          }

          text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

          // Deletar party
          delete econ.dungeonParties[myParty.id];

          saveEconomy(econ);
          return reply(text, { mentions: myParty.members });
        }

        // Sair da party
        if (sub === 'sair') {
          for (const [id, party] of Object.entries(econ.dungeonParties)) {
            if (party.members.includes(sender)) {
              if (party.leader === sender) {
                delete econ.dungeonParties[id];
                saveEconomy(econ);
                return reply('✅ Party encerrada!');
              } else {
                party.members = party.members.filter(m => m !== sender);
                saveEconomy(econ);
                return reply('✅ Você saiu da party!');
              }
            }
          }
          return reply('❌ Você não está em nenhuma party!');
        }

        return reply(`💡 Use ${prefix}dungeon para ver comandos`);
      }

      // ═══════════════════════════════════════════════════════════════
      // 🛒 MERCADO DE JOGADORES (AUCTION HOUSE)
      // ═══════════════════════════════════════════════════════════════
      case 'mercadoplayer':
      case 'auction':
      case 'leilaoplayer': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!econ.playerMarket) econ.playerMarket = { listings: [], fee: 0.05 }; // 5% taxa

        const sub = args[0]?.toLowerCase();

        // Listar itens à venda
        if (!sub || sub === 'ver') {
          const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);

          let text = `╭━━━⊱ 🛒 *MERCADO DE JOGADORES* ⊱━━━╮\n`;
          text += `│ Taxa: ${econ.playerMarket.fee * 100}% por venda\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          if (listings.length === 0) {
            text += `📦 Nenhum item à venda no momento!\n\n`;
          } else {
            text += `📦 *ITENS À VENDA:*\n\n`;
            listings.slice(0, 15).forEach((item, i) => {
              text += `${i + 1}. *${item.name}* ${item.enchant ? `+${item.enchant}` : ''}\n`;
              text += `   💰 ${item.price.toLocaleString()} | 👤 @${item.seller.split('@')[0]}\n`;
            });
          }

          text += `\n💡 *Comandos:*\n`;
          text += `• ${prefix}mercadoplayer vender <item> <preço>\n`;
          text += `• ${prefix}mercadoplayer comprar <nº>\n`;
          text += `• ${prefix}mercadoplayer meus`;

          return reply(text);
        }

        // Vender item
        if (sub === 'vender') {
          const itemName = args[1];
          const preco = parseInt(args[2]);

          if (!itemName || !preco || preco < 100) {
            return reply(`💡 Use: ${prefix}mercadoplayer vender <item> <preço>\n\n⚠️ Preço mínimo: 100`);
          }

          if (!me.inventory || !me.inventory[itemName] || me.inventory[itemName] <= 0) {
            return reply('❌ Você não tem este item!');
          }

          // Verificar limite de anúncios
          const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
          if (meusAnuncios.length >= 5) {
            return reply('❌ Você já tem 5 itens à venda! Cancele algum primeiro.');
          }

          me.inventory[itemName]--;

          econ.playerMarket.listings.push({
            id: `listing_${Date.now()}`,
            name: itemName,
            price: preco,
            seller: sender,
            sellerName: pushname,
            created: Date.now()
          });

          saveEconomy(econ);
          return reply(`✅ *ITEM LISTADO*\n\n📦 ${itemName}\n💰 ${preco.toLocaleString()}\n\n⚠️ Taxa de ${econ.playerMarket.fee * 100}% será cobrada na venda`);
        }

        // Comprar item
        if (sub === 'comprar') {
          const index = parseInt(args[1]) - 1;
          const listings = econ.playerMarket.listings.filter(l => l.seller !== sender);

          if (isNaN(index) || index < 0 || index >= listings.length) {
            return reply('❌ Número inválido! Use o número da lista.');
          }

          const listing = listings[index];

          if (me.wallet < listing.price) {
            return reply(`💰 Você precisa de ${listing.price.toLocaleString()}!`);
          }

          // Processar compra
          me.wallet -= listing.price;
          if (!me.inventory) me.inventory = {};
          me.inventory[listing.name] = (me.inventory[listing.name] || 0) + 1;

          // Pagar vendedor (menos taxa)
          const vendedor = getEcoUser(econ, listing.seller);
          const valorLiquido = Math.floor(listing.price * (1 - econ.playerMarket.fee));
          vendedor.wallet += valorLiquido;

          // Remover do mercado
          econ.playerMarket.listings = econ.playerMarket.listings.filter(l => l.id !== listing.id);

          saveEconomy(econ);
          return reply(`✅ *COMPRA REALIZADA*\n\n📦 ${listing.name}\n💰 -${listing.price.toLocaleString()}\n\n📬 Vendedor @${listing.seller.split('@')[0]} recebeu ${valorLiquido.toLocaleString()}`);
        }

        // Meus anúncios
        if (sub === 'meus') {
          const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);

          if (meusAnuncios.length === 0) {
            return reply('📦 Você não tem nenhum item à venda!');
          }

          let text = `🛒 *SEUS ANÚNCIOS*\n\n`;
          meusAnuncios.forEach((item, i) => {
            text += `${i + 1}. *${item.name}*\n`;
            text += `   💰 ${item.price.toLocaleString()}\n\n`;
          });

          text += `💡 Use ${prefix}mercadoplayer cancelar <nº> para cancelar`;

          return reply(text);
        }

        // Cancelar anúncio
        if (sub === 'cancelar') {
          const meusAnuncios = econ.playerMarket.listings.filter(l => l.seller === sender);
          const index = parseInt(args[1]) - 1;

          if (isNaN(index) || index < 0 || index >= meusAnuncios.length) {
            return reply('❌ Número inválido!');
          }

          const listing = meusAnuncios[index];

          // Devolver item
          if (!me.inventory) me.inventory = {};
          me.inventory[listing.name] = (me.inventory[listing.name] || 0) + 1;

          // Remover do mercado
          econ.playerMarket.listings = econ.playerMarket.listings.filter(l => l.id !== listing.id);

          saveEconomy(econ);
          return reply(`✅ Anúncio cancelado! ${listing.name} devolvido ao inventário.`);
        }

        return reply(`💡 Use ${prefix}mercadoplayer para ver comandos`);
      }

      // Sistema de Missões
      case 'missoes':
      case 'quests':
      case 'missao': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.quests) {
          me.quests = {
            daily: [],
            lastReset: Date.now()
          };
        }

        // Reset diário
        const now = Date.now();
        if (now - me.quests.lastReset > 86400000) {
          me.quests.daily = [];
          me.quests.lastReset = now;
        }

        // Gerar missões diárias
        if (me.quests.daily.length === 0) {
          const allQuests = [
            { id: 'duel_3', name: '⚔️ Duelar 3 vezes', reward: 5000, exp: 200, progress: 0, goal: 3, claimed: false },
            { id: 'dungeon_2', name: '🗺️ Completar 2 dungeons', reward: 8000, exp: 300, progress: 0, goal: 2, claimed: false },
            { id: 'gather_10', name: '🌾 Coletar 10 recursos', reward: 3000, exp: 150, progress: 0, goal: 10, claimed: false },
            { id: 'cook_5', name: '👨‍🍳 Cozinhar 5 receitas', reward: 4000, exp: 180, progress: 0, goal: 5, claimed: false },
            { id: 'train_pet', name: '🐾 Treinar pet 5 vezes', reward: 6000, exp: 250, progress: 0, goal: 5, claimed: false }
          ];

          // Escolher 3 missões aleatórias
          const shuffled = allQuests.sort(() => Math.random() - 0.5);
          me.quests.daily = shuffled.slice(0, 3);
        }

        // Garante que todas as missões existentes tenham a propriedade claimed
        me.quests.daily.forEach(quest => {
          if (quest.claimed === undefined) {
            quest.claimed = false;
          }
        });

        let text = `╭━━━⊱ 📜 *MISSÕES DIÁRIAS* ⊱━━━╮\n`;
        text += `│ Aventureiro: *${pushname}*\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        me.quests.daily.forEach((quest, i) => {
          const completed = quest.progress >= quest.goal;
          const claimed = quest.claimed === true;
          text += `${i + 1}. ${quest.name}\n`;
          text += `┌─────────────────\n`;
          text += `│ 📊 Progresso: ${quest.progress}/${quest.goal}\n`;
          text += `│ 💰 Recompensa: ${quest.reward.toLocaleString()}\n`;
          text += `│ ✨ EXP: ${quest.exp}\n`;
          if (claimed) {
            text += `│ ✅ Reivindicado!\n`;
          } else if (completed) {
            text += `│ ✅ Completo! Use ${prefix}reivindicar\n`;
          } else {
            text += `│ ⏳ Em andamento\n`;
          }
          text += `└─────────────────\n\n`;
        });

        const timeUntilReset = 86400000 - (now - me.quests.lastReset);
        const hoursLeft = Math.floor(timeUntilReset / 3600000);
        text += `⏰ Reseta em: ${hoursLeft}h`;

        saveEconomy(econ);
        return reply(text);
        break;
      }

      // Guerra de Clãs
      case 'guerra':
      case 'war':
      case 'guerracla': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.clan) return reply('🏰 Você precisa estar em um clã para declarar guerra!');

        const myClan = econ.clans[me.clan];
        if (myClan.leader !== sender) return reply('👑 Apenas o líder pode declarar guerra!');

        if (!q) {
          let text = `╭━━━⊱ ⚔️ *GUERRA DE CLÃS* ⊱━━━╮\n`;
          text += `│ Seu Clã: *${myClan.name}*\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
          text += `💡 Em breve: Sistema de guerras entre clãs!\n\n`;
          text += `🏆 Recursos:\n`;
          text += `• Batalhas estratégicas\n`;
          text += `• Território conquistável\n`;
          text += `• Recompensas épicas\n`;
          text += `• Rankings de clãs\n\n`;
          text += `⏰ Sistema em desenvolvimento...`;
          return reply(text);
        }

        return reply('⚠️ Sistema de guerras será implementado em breve!');
        break;
      }

      // Criar clã
      case 'criarcla':
      case 'criarclã': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!q) return reply(`❗ Use: ${prefix}criarcla <nome do clã>`);
        if (me.clan) return reply('❌ Você já pertence a um clã!');

        const clanName = q.trim();
        if (clanName.length < 3 || clanName.length > 24) return reply('❌ Nome do clã precisa ter entre 3 e 24 caracteres.');

        // Verificar duplicado
        const baseNormalized = normalizeClanName(clanName);
        const nameTaken = Object.values(econ.clans || {}).some(c => c.name && normalizeClanName(c.name) === baseNormalized);
        if (nameTaken) return reply('❌ Já existe um clã com esse nome!');

        // Custo para criar clã
        const clanCost = 20000;
        if ((me.wallet || 0) < clanCost) return reply(`💰 Você precisa de ${clanCost.toLocaleString()} moedas para criar um clã.`);

        me.wallet -= clanCost;

        const id = `clan_${econ.clanCounter++}`;
        econ.clans = econ.clans || {};
        econ.clans[id] = { id, name: clanName, leader: sender, members: [sender], pendingInvites: [], createdAt: Date.now() };

        me.clan = id;

        saveEconomy(econ);
        return reply(`✅ Clã criado com sucesso!\nNome: *${clanName}*\nLíder: @${sender.split('@')[0]}`, { mentions: [sender] });
        break;
      }

      // Info de Clã
      case 'cla':
      case 'claninfo': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        let clanObj = null;
        if (!q && me.clan) clanObj = econ.clans[me.clan];
        if (q) {
          // procurar por ID ou por nome
          const qTrim = q.trim();
          const qNormalized = normalizeClanName(qTrim);
          clanObj = econ.clans[qTrim] || Object.values(econ.clans || {}).find(c => c.name && normalizeClanName(c.name) === qNormalized);
        }

        if (!clanObj) return reply('❌ Clã não encontrado. Você pode usar: ' + prefix + 'criarcla <nome>');

        let text = `╭━━━⊱ 🏰 *INFORMAÇÕES DO CLÃ* ⊱━━━╮\n`;
        text += `│ Nome: *${clanObj.name}*\n`;
        text += `│ ID: ${clanObj.id}\n`;
        text += `│ Líder: @${clanObj.leader.split('@')[0]}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `👥 Membros (${clanObj.members.length}):\n`;

        const mentions = [];
        clanObj.members.forEach(m => {
          mentions.push(m);
          text += `• @${m.split('@')[0]}\n`;
        });
        // Mostrar convites pendentes
        if (Array.isArray(clanObj.pendingInvites) && clanObj.pendingInvites.length > 0) {
          text += `\n📨 Convites pendentes (${clanObj.pendingInvites.length}):\n`;
          clanObj.pendingInvites.forEach(m => { text += `• @${m.split('@')[0]}\n`; mentions.push(m); });
        }

        return reply(text, { mentions });
        break;
      }

      // Convidar membro para o clã
      case 'convidar':
      case 'invite':
      case 'convite': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.clan) return reply('❌ Você precisa estar em um clã para convidar membros!');

        const clan = econ.clans[me.clan];
        if (!clan) { me.clan = null; saveEconomy(econ); return reply('❌ Seu clã não foi encontrado.'); }

        // Apenas líder pode convidar por enquanto
        if (clan.leader !== sender) return reply('👑 Apenas o líder do clã pode convidar novos membros!');
        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❗ Marque um membro para convidar. Ex: ${prefix}convidar @user`);
        if (target === sender) return reply('❌ Você não pode convidar você mesmo!');

        const targetUser = getEcoUser(econ, target);
        if (targetUser.clan) return reply('❌ Esta pessoa já pertence a outro clã!');

        // Usar convites pendentes em vez de adicionar imediatamente.
        clan.pendingInvites = clan.pendingInvites || [];
        if (clan.pendingInvites.includes(target)) return reply('❗ Este usuário já tem um convite pendente para o clã.');
        clan.pendingInvites.push(target);
        saveEconomy(econ);

        // Notificar no grupo com menção se possível
        await reply(`📨 Convite enviado para @${target.split('@')[0]}!
  Use ${prefix}aceitarconvite ${clan.id} para aceitar.`, { mentions: [target] });
        break;
      }

      // Remover convite pendente (apenas líder)
      case 'rmconvite':
      case 'removerconvite': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
        const econ2 = loadEconomy();
        const me2 = getEcoUser(econ2, sender);
        if (!me2.clan) return reply('❌ Você não faz parte de nenhum clã.');
        const clan2 = econ2.clans[me2.clan];
        if (!clan2) { me2.clan = null; saveEconomy(econ2); return reply('❌ Seu clã não foi encontrado.'); }
        if (clan2.leader !== sender) return reply('👑 Apenas o líder pode remover convites.');
        const target2 = (menc_jid2 && menc_jid2[0]) || null;
        if (!target2) return reply(`❗ Marque um usuário para remover o convite. Ex: ${prefix}rmconvite @user`);
        if (!Array.isArray(clan2.pendingInvites) || !clan2.pendingInvites.includes(target2)) return reply('❌ Este usuário não tem um convite pendente para o seu clã.');
        clan2.pendingInvites = clan2.pendingInvites.filter(id => id !== target2);
        saveEconomy(econ2);
        return reply(`🗑️ Convite removido para @${target2.split('@')[0]}.`, { mentions: [target2] });
      }
        break;


      // Sair do clã
      case 'sair': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.clan) return reply('❌ Você não faz parte de nenhum clã.');

        const clan = econ.clans[me.clan];
        if (!clan) {
          me.clan = null;
          saveEconomy(econ);
          return reply('❌ Seu clã não foi encontrado, seu status foi resetado.');
        }

        // Se for líder
        if (clan.leader === sender) {
          // Se houver outros membros, transferir liderança para o primeiro membro
          const remaining = clan.members.filter(m => m !== sender);
          if (remaining.length === 0) {
            // Remover referência do clã em todos os membros
            (clan.members || []).forEach(m => {
              const u = getEcoUser(econ, m);
              if (u.clan === clan.id) u.clan = null;
            });
            delete econ.clans[clan.id];
            me.clan = null;
            saveEconomy(econ);
            return reply('🗑️ Você saiu e o clã foi dissolvido pois não há mais membros.');
          } else {
            const newLeader = remaining[0];
            clan.leader = newLeader;
            clan.members = remaining;
            me.clan = null;
            saveEconomy(econ);
            return reply(`🔁 Você deixou o clã e a liderança foi transferida para @${newLeader.split('@')[0]}.`, { mentions: [newLeader] });
          }
        }

        // Membro comum
        clan.members = clan.members.filter(m => m !== sender);
        me.clan = null;
        // remover convites pendentes que o membro tinha em outros clãs (limpeza)
        for (const [k, c] of Object.entries(econ.clans || {})) {
          if (Array.isArray(c.pendingInvites) && c.pendingInvites.includes(sender)) {
            c.pendingInvites = c.pendingInvites.filter(x => x !== sender);
          }
        }
        saveEconomy(econ);
        return reply('✅ Você saiu do clã.');
        break;
      }
      // Aceitar convite de clã
      case 'aceitarconvite':
      case 'aceitarrpg': {
        if (!isGroup) return reply('⚔️ Comandos de clã só funcionam em grupos com Modo RPG.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        // Procurar convites pendentes
        const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && c.pendingInvites.includes(sender));
        if (!q && clansWithInvite.length === 0) return reply('❌ Você não possui convites pendentes para clãs.');
        let clanObj = null;
        if (!q) {
          if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
          else return reply('🔎 Você possui múltiplos convites. Use: ' + prefix + 'aceitarconvite <clanId>');
        } else {
          const qLower = q.trim().toLowerCase();
          clanObj = econ.clans[q] || Object.values(econ.clans || {}).find(c => (c.name || '').toLowerCase() === qLower);
        }
        if (!clanObj) return reply('❌ Clã não encontrado ou sem convite pendente.');
        // Join
        clanObj.members = clanObj.members || [];
        if (!clanObj.members.includes(sender)) clanObj.members.push(sender);
        // Remove pending invite
        clanObj.pendingInvites = (clanObj.pendingInvites || []).filter(id => id !== sender);
        me.clan = clanObj.id;
        saveEconomy(econ);
        return reply(`✅ Você entrou para o clã *${clanObj.name}*!`);
      }

      // Recusar convite
      case 'recusarconvite':
      case 'recusar': {
        if (!isGroup) return reply('⚔️ Comandos de clã só funcionam em grupos com Modo RPG.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);
        const clansWithInvite = Object.values(econ.clans || {}).filter(c => Array.isArray(c.pendingInvites) && c.pendingInvites.includes(sender));
        if (!q && clansWithInvite.length === 0) return reply('❌ Você não possui convites pendentes para clãs.');
        let clanObj = null;
        if (!q) {
          if (clansWithInvite.length === 1) clanObj = clansWithInvite[0];
          else return reply('🔎 Você possui múltiplos convites. Use: ' + prefix + 'recusarconvite <clanId>');
        } else {
          const qLower = q.trim().toLowerCase();
          clanObj = econ.clans[q] || Object.values(econ.clans || {}).find(c => (c.name || '').toLowerCase() === qLower);
        }
        if (!clanObj) return reply('❌ Clã não encontrado ou sem convite pendente.');
        clanObj.pendingInvites = (clanObj.pendingInvites || []).filter(id => id !== sender);
        saveEconomy(econ);
        return reply(`❗ Você recusou o convite do clã *${clanObj.name}*.`);
      }

      // Expulsar membro do clã (apenas líder)
      case 'expulsar':
      case 'kickcla': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);
        if (!me.clan) return reply('❌ Você não faz parte de nenhum clã.');
        const clan = econ.clans[me.clan];
        if (!clan) { me.clan = null; saveEconomy(econ); return reply('❌ Seu clã não foi encontrado.'); }
        if (clan.leader !== sender) return reply('👑 Apenas o líder pode expulsar membros.');
        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❗ Marque um membro para expulsar. Ex: ${prefix}expulsar @user`);
        if (target === sender) return reply('❌ Você não pode se expulsar como líder. Use sair para demitir-se e transferir liderança.');
        if (!clan.members || !clan.members.includes(target)) return reply('❌ Este usuário não é membro do seu clã.');
        clan.members = clan.members.filter(m => m !== target);
        const targetUser = getEcoUser(econ, target);
        if (targetUser.clan === clan.id) targetUser.clan = null;
        // cleanup pending invites anywhere
        for (const [k, c] of Object.entries(econ.clans || {})) {
          if (Array.isArray(c.pendingInvites) && c.pendingInvites.includes(target)) c.pendingInvites = c.pendingInvites.filter(x => x !== target);
        }
        saveEconomy(econ);
        return reply(`🗑️ @${target.split('@')[0]} foi expulso do clã *${clan.name}*.`, { mentions: [target] });
      }

      // Sistema de Família
      case 'familia':
      case 'family': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };

        let text = `╭━━━⊱ 👨‍👩‍👧‍👦 *MINHA FAMÍLIA* ⊱━━━╮\n`;
        text += `│ ${pushname}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        // Buscar relacionamento ativo do sistema de relacionamentos
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (activePair && activePair.partnerId) {
          let relationshipEmoji = '💍';
          let relationshipType = 'Cônjuge';

          if (activePair.pair?.status === 'casamento') {
            relationshipEmoji = '💍';
            relationshipType = 'Cônjuge';
          } else if (activePair.pair?.status === 'namoro') {
            relationshipEmoji = '💞';
            relationshipType = 'Namorado(a)';
          } else if (activePair.pair?.status === 'brincadeira') {
            relationshipEmoji = '🎈';
            relationshipType = 'Parceiro(a)';
          }

          const relationshipSince = activePair.pair?.stages?.[activePair.pair.status]?.since;
          const sinceDate = relationshipSince ? new Date(relationshipSince).toLocaleDateString() : 'Data desconhecida';

          text += `${relationshipEmoji} *${relationshipType}:*\n`;
          text += `┌─────────────────\n`;
          text += `│ @${activePair.partnerId.split('@')[0]}\n`;
          text += `│ ❤️ Desde: ${sinceDate}\n`;
          text += `└─────────────────\n\n`;
        } else {
          text += `💔 *Relacionamento:* Solteiro(a)\n\n`;
        }

        // Pais
        if (me.family.parents && me.family.parents.length > 0) {
          text += `👫 *Pais:*\n`;
          me.family.parents.forEach(parent => {
            text += `• @${parent.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        // Filhos
        if (me.family.children && me.family.children.length > 0) {
          text += `👶 *Filhos (${me.family.children.length}):*\n`;
          me.family.children.forEach((child, i) => {
            text += `${i + 1}. @${child.split('@')[0]}\n`;
          });
          text += `\n`;
        } else {
          text += `👶 *Filhos:* Nenhum\n\n`;
        }

        // Irmãos
        if (me.family.siblings && me.family.siblings.length > 0) {
          text += `👫 *Irmãos (${me.family.siblings.length}):*\n`;
          me.family.siblings.forEach(sibling => {
            text += `• @${sibling.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        text += `💡 Use ${prefix}adotaruser @user para adotar\n`;
        text += `💡 Use ${prefix}arvore para ver árvore genealógica`;

        const mentions = [
          ...(me.family.parents || []),
          ...(me.family.children || []),
          ...(me.family.siblings || [])
        ].filter(Boolean);

        // Adiciona o parceiro do sistema de relacionamentos nas menções
        const activePairForMentions = relationshipManager.getActivePairForUser(sender);
        if (activePairForMentions && activePairForMentions.partnerId) {
          mentions.push(activePairForMentions.partnerId);
        }

        saveEconomy(econ);
        return reply(text, { mentions });
        break;
      }

      case 'adotaruser':
      case 'adotarfilho': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para adotar!\n\n💡 Exemplo: ${prefix}adotaruser @user`);
        if (target === sender) return reply('❌ Você não pode se adotar!');

        const targetUser = getEcoUser(econ, target);

        if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
        if (!targetUser.family) targetUser.family = { spouse: null, children: [], parents: [], siblings: [] };

        // Verificar se já é filho
        if (me.family.children && me.family.children.includes(target)) {
          return reply('❌ Esta pessoa já é seu filho(a)!');
        }

        // Verificar se já tem pais
        if (targetUser.family.parents && targetUser.family.parents.length >= 2) {
          return reply('❌ Esta pessoa já tem 2 pais/mães!');
        }

        // Custo da adoção
        const adoptCost = 10000;
        if (me.wallet < adoptCost) {
          return reply(`💰 Você precisa de ${adoptCost.toLocaleString()} moedas para adotar!`);
        }

        me.wallet -= adoptCost;

        // Adicionar aos filhos
        if (!me.family.children) me.family.children = [];
        me.family.children.push(target);

        // Adicionar aos pais
        if (!targetUser.family.parents) targetUser.family.parents = [];
        targetUser.family.parents.push(sender);

        // Se tiver parceiro(a) no sistema de relacionamentos, adicionar como pai/mãe também
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (activePair && activePair.partnerId) {
          const spouseData = getEcoUser(econ, activePair.partnerId);
          if (!spouseData.family) spouseData.family = { spouse: null, children: [], parents: [], siblings: [] };
          if (!spouseData.family.children) spouseData.family.children = [];
          spouseData.family.children.push(target);
          targetUser.family.parents.push(activePair.partnerId);
        }

        let text = `╭━━━⊱ 👶 *ADOÇÃO* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `🎉 Parabéns!\n\n`;
        text += `${pushname} adotou @${target.split('@')[0]}!\n\n`;
        text += `💰 Custo: ${adoptCost.toLocaleString()}\n`;
        text += `👨‍👩‍👧‍👦 Agora você tem ${me.family.children.length} filho(s)!`;

        saveEconomy(econ);
        return reply(text, { mentions: [target] });
        break;
      }

      case 'deserdar':
      case 'desherdar':
      case 'removerfilho': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para deserdar!\n\n💡 Exemplo: ${prefix}deserdar @user`);
        if (target === sender) return reply('❌ Você não pode se deserdar!');

        const targetUser = getEcoUser(econ, target);

        if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
        if (!targetUser.family) targetUser.family = { spouse: null, children: [], parents: [], siblings: [] };

        // Verificar se é filho
        if (!me.family.children || !me.family.children.includes(target)) {
          return reply('❌ Esta pessoa não é seu filho(a)!');
        }

        // Remover dos filhos
        me.family.children = me.family.children.filter(child => child !== target);

        // Remover dos pais
        if (targetUser.family.parents) {
          targetUser.family.parents = targetUser.family.parents.filter(parent => parent !== sender);
        }

        // Se tiver parceiro(a) no sistema de relacionamentos, remover como pai/mãe também
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (activePair && activePair.partnerId) {
          const spouseData = getEcoUser(econ, activePair.partnerId);
          if (spouseData.family && spouseData.family.children) {
            spouseData.family.children = spouseData.family.children.filter(child => child !== target);
          }
          if (targetUser.family.parents) {
            targetUser.family.parents = targetUser.family.parents.filter(parent => parent !== activePair.partnerId);
          }
        }

        let text = `╭━━━⊱ 💔 *DESERDADO* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `😢 ${pushname} deserdou @${target.split('@')[0]}!\n\n`;
        text += `👨‍👩‍👧‍👦 Agora você tem ${me.family.children.length} filho(s)!\n\n`;
        text += `💡 Use ${prefix}familia para ver sua família atualizada.`;

        saveEconomy(econ);
        return reply(text, { mentions: [target] });
        break;
      }

      case 'arvore':
      case 'familytree': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };

        let text = `╭━━━⊱ 🌳 *ÁRVORE GENEALÓGICA* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        // Avós
        const grandparents = [];
        if (me.family.parents) {
          for (const parent of me.family.parents) {
            const parentData = getEcoUser(econ, parent);
            if (parentData.family && parentData.family.parents) {
              grandparents.push(...parentData.family.parents);
            }
          }
        }

        if (grandparents.length > 0) {
          text += `👴👵 *Avós:*\n`;
          [...new Set(grandparents)].forEach(gp => {
            text += `• @${gp.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        // Pais
        if (me.family.parents && me.family.parents.length > 0) {
          text += `👫 *Pais:*\n`;
          me.family.parents.forEach(parent => {
            text += `• @${parent.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        // Você
        text += `👤 *Você:* ${pushname}\n`;

        // Buscar relacionamento ativo do sistema de relacionamentos
        const activePair = relationshipManager.getActivePairForUser(sender);
        if (activePair && activePair.partnerId) {
          const relationshipEmoji = activePair.pair?.status === 'casamento' ? '💍' :
            activePair.pair?.status === 'namoro' ? '💞' : '🎈';
          const relationshipType = activePair.pair?.status === 'casamento' ? 'Cônjuge' :
            activePair.pair?.status === 'namoro' ? 'Namorado(a)' : 'Parceiro(a)';
          text += `${relationshipEmoji} *${relationshipType}:* @${activePair.partnerId.split('@')[0]}\n`;
        }
        text += `\n`;

        // Filhos
        if (me.family.children && me.family.children.length > 0) {
          text += `👶 *Filhos:*\n`;
          me.family.children.forEach(child => {
            text += `• @${child.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        // Netos
        const grandchildren = [];
        if (me.family.children) {
          for (const child of me.family.children) {
            const childData = getEcoUser(econ, child);
            if (childData.family && childData.family.children) {
              grandchildren.push(...childData.family.children);
            }
          }
        }

        if (grandchildren.length > 0) {
          text += `👶👶 *Netos:*\n`;
          grandchildren.forEach(gc => {
            text += `• @${gc.split('@')[0]}\n`;
          });
          text += `\n`;
        }

        text += `🌳 ${grandparents.length + (me.family.parents?.length || 0) + 1 + (me.family.children?.length || 0) + grandchildren.length} membros na família`;

        const allMembers = [
          ...grandparents,
          ...(me.family.parents || []),
          ...(me.family.children || []),
          ...grandchildren
        ].filter(Boolean);

        // Adiciona o parceiro do sistema de relacionamentos nas menções
        const activePairForMentions = relationshipManager.getActivePairForUser(sender);
        if (activePairForMentions && activePairForMentions.partnerId) {
          allMembers.push(activePairForMentions.partnerId);
        }

        return reply(text, { mentions: [...new Set(allMembers)] });
        break;
      }

      // Sistema de Torneio
      case 'torneio':
      case 'tournament': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!econ.tournament) {
          econ.tournament = {
            active: false,
            participants: [],
            startTime: null,
            prize: 0
          };
        }

        const tournament = econ.tournament;

        if (!tournament.active) {
          // Criar torneio
          if (q === 'criar' && isGroupAdmins) {
            tournament.active = true;
            tournament.participants = [];
            tournament.startTime = Date.now();
            tournament.prize = 50000;

            saveEconomy(econ);
            return reply(`╭━━━⊱ 🏆 *TORNEIO ABERTO!* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n⚔️ Um torneio foi iniciado!\n\n💰 Prêmio: ${tournament.prize.toLocaleString()}\n⏰ Inscrições abertas!\n\n💡 Use ${prefix}torneio entrar`);
          }

          return reply(`❌ Não há torneio ativo!\n\n💡 Admins: Use ${prefix}torneio criar`);
        }

        // Entrar no torneio
        if (q === 'entrar') {
          if (tournament.participants.includes(sender)) {
            return reply('❌ Você já está inscrito no torneio!');
          }

          const entryCost = 5000;
          if (me.wallet < entryCost) {
            return reply(`💰 Você precisa de ${entryCost.toLocaleString()} moedas para participar!`);
          }

          me.wallet -= entryCost;
          tournament.participants.push(sender);
          tournament.prize += entryCost;

          saveEconomy(econ);
          return reply(`✅ Você entrou no torneio!\n\n👥 Participantes: ${tournament.participants.length}\n💰 Prêmio acumulado: ${tournament.prize.toLocaleString()}`);
        }

        // Iniciar torneio
        if (q === 'iniciar' && isGroupAdmins) {
          if (tournament.participants.length < 2) {
            return reply('❌ Precisa de pelo menos 2 participantes!');
          }

          // Simular batalhas
          let fighters = [...tournament.participants];
          let round = 1;
          let results = `╭━━━⊱ 🏆 *TORNEIO* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

          while (fighters.length > 1) {
            results += `⚔️ *RODADA ${round}*\n\n`;
            const nextRound = [];

            for (let i = 0; i < fighters.length; i += 2) {
              if (i + 1 < fighters.length) {
                const fighter1 = fighters[i];
                const fighter2 = fighters[i + 1];
                const winner = Math.random() > 0.5 ? fighter1 : fighter2;

                results += `${fighter1 === winner ? '✅' : '❌'} @${fighter1.split('@')[0]} vs @${fighter2.split('@')[0]} ${fighter2 === winner ? '✅' : '❌'}\n`;
                nextRound.push(winner);
              } else {
                nextRound.push(fighters[i]);
              }
            }

            results += `\n`;
            fighters = nextRound;
            round++;
          }

          const winner = fighters[0];
          const winnerData = getEcoUser(econ, winner);
          winnerData.wallet += tournament.prize;

          results += `\n🏆 *CAMPEÃO:* @${winner.split('@')[0]}\n`;
          results += `💰 Prêmio: ${tournament.prize.toLocaleString()}`;

          tournament.active = false;
          tournament.participants = [];

          saveEconomy(econ);
          return reply(results, { mentions: tournament.participants });
        }

        // Ver info do torneio
        let text = `╭━━━⊱ 🏆 *TORNEIO ATIVO* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `👥 Participantes: ${tournament.participants.length}\n`;
        text += `💰 Prêmio: ${tournament.prize.toLocaleString()}\n\n`;
        text += `📋 *INSCRITOS:*\n`;
        tournament.participants.slice(0, 10).forEach((p, i) => {
          text += `${i + 1}. @${p.split('@')[0]}\n`;
        });
        if (tournament.participants.length > 10) {
          text += `... e mais ${tournament.participants.length - 10}\n`;
        }
        text += `\n💡 Use ${prefix}torneio entrar`;

        return reply(text, { mentions: tournament.participants.slice(0, 10) });
        break;
      }

      // Interações Sociais RPG
      case 'abracarrpg':
      case 'hugrpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para abraçar!\n\n💡 Exemplo: ${prefix}abracar @user`);
        if (target === sender) return reply('❌ Você não pode se abraçar!');

        const actions = [
          `${pushname} deu um abraço caloroso em @${target.split('@')[0]}! 🤗`,
          `${pushname} abraçou @${target.split('@')[0]} com muito carinho! 💕`,
          `Um abraço apertado de ${pushname} para @${target.split('@')[0]}! 🫂`,
          `${pushname} envolveu @${target.split('@')[0]} em seus braços! 🤗💖`
        ];

        return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
        break;
      }

      case 'beijarrpg':
      case 'kissrpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para beijar!\n\n💡 Exemplo: ${prefix}beijarrpg @user`);
        if (target === sender) return reply('❌ Você não pode se beijar!');

        const actions = [
          `${pushname} deu um beijo em @${target.split('@')[0]}! 😘`,
          `${pushname} beijou @${target.split('@')[0]} apaixonadamente! 💋`,
          `Um beijo romântico de ${pushname} para @${target.split('@')[0]}! 😍`,
          `${pushname} roubou um beijinho de @${target.split('@')[0]}! 😚`
        ];

        return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
        break;
      }

      case 'baterrpg':
      case 'taparpg':
      case 'slaprpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para dar um tapa!\n\n💡 Exemplo: ${prefix}baterrpg @user`);
        if (target === sender) return reply('❌ Você não pode bater em si mesmo!');

        const actions = [
          `${pushname} deu um tapa em @${target.split('@')[0]}! 👋💥`,
          `PAH! ${pushname} acertou @${target.split('@')[0]} em cheio! 😤`,
          `${pushname} não teve piedade e bateu em @${target.split('@')[0]}! 💢`,
          `SMACK! ${pushname} deu um tapão em @${target.split('@')[0]}! 😠`
        ];

        return reply(actions[Math.floor(Math.random() * actions.length)], { mentions: [target] });
        break;
      }

      case 'proteger':
      case 'protect': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para proteger!\n\n💡 Exemplo: ${prefix}proteger @user`);
        if (target === sender) return reply('❌ Você não pode se proteger assim!');

        const protectCost = 2000;
        if (me.wallet < protectCost) {
          return reply(`💰 Você precisa de ${protectCost.toLocaleString()} moedas para proteger alguém!`);
        }

        me.wallet -= protectCost;

        const targetData = getEcoUser(econ, target);
        if (!targetData.protection) targetData.protection = {};
        targetData.protection.protectedBy = sender;
        targetData.protection.until = Date.now() + 3600000; // 1 hora

        saveEconomy(econ);

        let text = `╭━━━⊱ 🛡️ *PROTEÇÃO ATIVA* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `${pushname} está protegendo @${target.split('@')[0]}!\n\n`;
        text += `⏰ Duração: 1 hora\n`;
        text += `🚫 Ataques e roubos bloqueados!\n`;
        text += `💰 Custo: ${protectCost.toLocaleString()}`;

        return reply(text, { mentions: [target] });
        break;
      }

      // Sistema de Reputação
      case 'reputacao':
      case 'rep':
      case 'reputation': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.reputation) {
          me.reputation = {
            points: 0,
            upvotes: 0,
            downvotes: 0,
            karma: 0,
            fame: 0
          };
        }

        let text = `╭━━━⊱ ⭐ *REPUTAÇÃO* ⊱━━━╮\n`;
        text += `│ ${pushname}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `⭐ Pontos: ${me.reputation.points}\n`;
        text += `👍 Votos Positivos: ${me.reputation.upvotes}\n`;
        text += `👎 Votos Negativos: ${me.reputation.downvotes}\n`;
        text += `☯️ Karma: ${me.reputation.karma}\n`;
        text += `🌟 Fama: ${me.reputation.fame}\n\n`;

        const repLevel = Math.floor(me.reputation.points / 100);
        const ranks = ['Novato', 'Conhecido', 'Respeitado', 'Famoso', 'Lendário'];
        const rank = ranks[Math.min(repLevel, ranks.length - 1)];

        text += `🏅 Classificação: *${rank}*\n\n`;
        text += `💡 Use ${prefix}votar @user para dar reputação`;

        saveEconomy(econ);
        return reply(text);
        break;
      }

      case 'votar':
      case 'vote': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque alguém para votar!\n\n💡 Exemplo: ${prefix}votar @user`);
        if (target === sender) return reply('❌ Você não pode votar em si mesmo!');

        if (!me.lastVote) me.lastVote = {};

        const now = Date.now();
        if (me.lastVote[target] && (now - me.lastVote[target]) < 86400000) {
          const remaining = Math.ceil((86400000 - (now - me.lastVote[target])) / 3600000);
          return reply(`⏰ Você já votou nesta pessoa hoje!\n\nAguarde ${remaining}h para votar novamente.`);
        }

        const targetData = getEcoUser(econ, target);
        if (!targetData.reputation) {
          targetData.reputation = {
            points: 0,
            upvotes: 0,
            downvotes: 0,
            karma: 0,
            fame: 0
          };
        }

        targetData.reputation.points += 10;
        targetData.reputation.upvotes++;
        targetData.reputation.karma += 5;
        targetData.reputation.fame++;

        me.lastVote[target] = now;

        let text = `╭━━━⊱ 👍 *VOTO POSITIVO* ⊱━━━╮\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `${pushname} deu reputação para @${target.split('@')[0]}!\n\n`;
        text += `⭐ +10 pontos de reputação\n`;
        text += `☯️ +5 karma\n`;
        text += `🌟 +1 fama`;

        saveEconomy(econ);
        return reply(text, { mentions: [target] });
      }

      // ═══════════════════════════════════════════
      // COMANDOS ADMINISTRATIVOS DO RPG (DONO)
      // ═══════════════════════════════════════════

      // Ranking Global
      case 'rankglobal':
      case 'globalrank':
      case 'toprpgglobal':
      case 'topglobal': {
        const econ = loadEconomy();
        const allUsers = Object.entries(econ.users || {});

        if (allUsers.length === 0) return reply('📊 Nenhum jogador registrado no sistema RPG ainda.');

        // Calcular poder total de cada jogador
        const rankedUsers = allUsers.map(([id, data]) => {
          const totalWealth = (data.wallet || 0) + (data.bank || 0);
          const level = data.level || 1;
          const power = data.power || 100;
          const reputation = data.reputation?.points || 0;
          const achievements = Object.keys(data.achievements || {}).length;
          const pets = (data.pets || []).length;

          // Score composto
          const score = totalWealth + (level * 1000) + (power * 10) + (reputation * 50) + (achievements * 500) + (pets * 200);

          return { id, totalWealth, level, power, reputation, achievements, pets, score };
        }).sort((a, b) => b.score - a.score).slice(0, 20);

        let text = `╭━━━⊱ 🌍 *RANKING GLOBAL RPG* ⊱━━━╮\n`;
        text += `│ Top 20 jogadores do bot\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        const mentions = [];
        rankedUsers.forEach((user, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          const userName = user.id.split('@')[0];
          text += `${medal} @${userName}\n`;
          text += `   💰 ${user.totalWealth.toLocaleString()} | Lv.${user.level} | ⚔️ ${user.power}\n`;
          text += `   📊 Score: ${user.score.toLocaleString()}\n\n`;
          mentions.push(user.id);
        });

        text += `╭━━━━━━━━━━━━━━━━━━━━━━╮\n`;
        text += `│ 💡 O score é calculado por:\n`;
        text += `│ dinheiro + level + poder +\n`;
        text += `│ reputação + conquistas + pets\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

        return reply(text, { mentions });
      }

      // Adicionar dinheiro a jogador
      case 'rpgadd':
      case 'rpgaddmoney':
      case 'adicionardinheiro': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode adicionar saldo!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgadd @user <valor>`);

        const amount = parseInt(args[args.length - 1]) || 0;
        if (amount <= 0) return reply('❌ Informe um valor válido maior que 0!');

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.wallet = (targetData.wallet || 0) + amount;
        saveEconomy(econ);

        return reply(`╭━━━⊱ ✅ *DINHEIRO ADICIONADO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 💰 +${amount.toLocaleString()} moedas\n│ 💼 Carteira atual: ${targetData.wallet.toLocaleString()}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Remover dinheiro de jogador
      case 'rpgremove':
      case 'rpgremovemoney':
      case 'removerdinheiro': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode remover saldo!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgremove @user <valor>`);

        const amount = parseInt(args[args.length - 1]) || 0;
        if (amount <= 0) return reply('❌ Informe um valor válido maior que 0!');

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.wallet = Math.max(0, (targetData.wallet || 0) - amount);
        targetData.bank = Math.max(0, (targetData.bank || 0));
        saveEconomy(econ);

        return reply(`╭━━━⊱ ✅ *DINHEIRO REMOVIDO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 💸 -${amount.toLocaleString()} moedas\n│ 💼 Carteira atual: ${targetData.wallet.toLocaleString()}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Adicionar conquista a jogador
      case 'addconquista':
      case 'rpgaddconquista': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode adicionar conquistas!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) {
          return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}addconquista @user <conquista>`);
        }

        const conquista = args
          .filter(a => !a.startsWith('@'))
          .join('_')
          .toLowerCase()
          .trim();

        const conquistasValidas = [
          'minerador',
          'trabalhador',
          'pescador',
          'cacador',
          'explorador',
          'gladiador',
          'milionario',
          'veterano',
          'colecionador',
          'criminoso'
        ];

        if (!conquista || !conquistasValidas.includes(conquista)) {
          return reply(`❌ Conquista inválida!\n\n🏆 Conquistas disponíveis:\n${conquistasValidas.map(c => `• ${c}`).join('\n')}`);
        }

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.achievements = targetData.achievements || {};

        if (targetData.achievements[conquista]) {
          return reply(`⚠️ @${target.split('@')[0]} já possui essa conquista!`, { mentions: [target] });
        }

        targetData.achievements[conquista] = Date.now();
        saveEconomy(econ);

        return reply(`╭━━━⊱ 🏆 *CONQUISTA ADICIONADA* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 🎖️ Conquista: *${conquista}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Remover conquista de jogador
      case 'removeconquista':
      case 'rpgremoveconquista': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode remover conquistas!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) {
          return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}removeconquista @user <conquista>`);
        }

        const conquista = args
          .filter(a => !a.startsWith('@'))
          .join('_')
          .toLowerCase()
          .trim();

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.achievements = targetData.achievements || {};

        if (!targetData.achievements[conquista]) {
          return reply(`⚠️ @${target.split('@')[0]} não possui essa conquista!`, { mentions: [target] });
        }

        delete targetData.achievements[conquista];
        saveEconomy(econ);

        return reply(`╭━━━⊱ 🗑️ *CONQUISTA REMOVIDA* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 🎖️ Conquista: *${conquista}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Definir level de jogador
      case 'rpgsetlevel':
      case 'setlevel':
      case 'definirnivelrpg': {

        if (!isOwner) {
          return reply('❌ Apenas a dona da Verdinha pode alterar o nível!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgsetlevel @user <nivel>`);

        const newLevel = parseInt(args[args.length - 1]) || 0;
        if (newLevel < 1 || newLevel > 1000) return reply('❌ Nível deve ser entre 1 e 1000!');

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.level = newLevel;
        targetData.power = 100 + (newLevel * 15);
        saveEconomy(econ);

        const levelingDataSet = loadLevelingSafe();
        const userDataSet = getLevelingUser(levelingDataSet, target);
        userDataSet.level = newLevel;
        userDataSet.xp = calculateNextLevelXp(newLevel > 1 ? newLevel - 1 : 1);
        userDataSet.patent = getPatent(newLevel);
        saveLevelingSafe(levelingDataSet);

        return reply(`╭━━━⊱ ✅ *NÍVEL DEFINIDO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 📊 Nível: ${newLevel}\n│ ⚔️ Poder: ${targetData.power}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Adicionar item ao jogador
      case 'rpgadditem':
      case 'adicionaritem': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode adicionar itens!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgadditem @user <item> <quantidade>`);

        const itemArgs = args.filter(a => !a.startsWith('@')).slice(0, -1).join('_').toLowerCase();
        const qty = parseInt(args[args.length - 1]) || 1;

        if (!itemArgs) return reply('❌ Informe o nome do item!');

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.inventory = targetData.inventory || {};
        targetData.inventory[itemArgs] = (targetData.inventory[itemArgs] || 0) + qty;
        saveEconomy(econ);

        return reply(`╭━━━⊱ ✅ *ITEM ADICIONADO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 📦 Item: ${itemArgs}\n│ 🔢 Quantidade: +${qty}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Remover item do jogador
      case 'rpgremoveitem':
      case 'removeritem': {

        if (sender !== botNumber) {
          return reply('❌ Apenas a Verdinha pode remover itens!');
        }

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgremoveitem @user <item> <quantidade>`);

        const itemArgs = args.slice(0, -1).join('_').toLowerCase();
        const qty = parseInt(args[args.length - 1]) || 1;

        if (!itemArgs) return reply('❌ Informe o nome do item!');

        const econ = loadEconomy();
        const targetData = getEcoUser(econ, target);

        targetData.inventory = targetData.inventory || {};
        targetData.inventory[itemArgs] = Math.max(0, (targetData.inventory[itemArgs] || 0) - qty);
        saveEconomy(econ);

        return reply(`╭━━━⊱ ✅ *ITEM REMOVIDO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 📦 Item: ${itemArgs}\n│ 🔢 Quantidade: -${qty}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Reset total do jogador
      case 'rpgresetplayer':
      case 'resetarjogador': {


        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`❌ Marque um usuário!\n\n💡 Uso: ${prefix}rpgresetplayer @user`);

        const econ = loadEconomy();

        if (econ.users[target]) {
          delete econ.users[target];
          saveEconomy(econ);
          return reply(`╭━━━⊱ ✅ *JOGADOR RESETADO* ⊱━━━╮\n│\n│ 👤 @${target.split('@')[0]}\n│ 🗑️ Todos os dados RPG removidos\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
        } else {
          return reply('❌ Jogador não encontrado no sistema RPG!');
        }
      }

      // Reset global de todo o RPG
      case 'rpgresetglobal':
      case 'resetrpgglobal': {
        if (!(isOwner && !isSubOwner)) return reply('🚫 Apenas o dono principal pode usar este comando!');

        const confirmArg = (args[0] || '').toLowerCase();
        if (confirmArg !== 'confirmar') {
          return reply(`⚠️ *ATENÇÃO: RESET GLOBAL DO RPG*\n\n🗑️ Este comando irá APAGAR TODOS os dados do sistema RPG!\n\n❌ Esta ação é IRREVERSÍVEL!\n\n✅ Para confirmar, use:\n${prefix}rpgresetglobal confirmar`);
        }

        const econ = loadEconomy();
        econ.users = {};
        saveEconomy(econ);

        return reply(`╭━━━⊱ ⚠️ *RESET GLOBAL* ⊱━━━╮\n│\n│ 🗑️ Sistema RPG resetado!\n│ 👥 Todos os jogadores zerados\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      }

      // Estatísticas do sistema RPG
      case 'rpgstats':
      case 'rpgstatistics':
      case 'estatisticasrpg': {


        const econ = loadEconomy();
        const allUsers = Object.entries(econ.users || {});

        let totalMoney = 0;
        let totalBank = 0;
        let totalPets = 0;
        let maxLevel = 0;
        let richestUser = { id: null, wealth: 0 };

        allUsers.forEach(([id, data]) => {
          const wallet = data.wallet || 0;
          const bank = data.bank || 0;
          totalMoney += wallet;
          totalBank += bank;
          totalPets += (data.pets || []).length;
          maxLevel = Math.max(maxLevel, data.level || 1);

          if ((wallet + bank) > richestUser.wealth) {
            richestUser = { id, wealth: wallet + bank };
          }
        });

        let text = `╭━━━⊱ 📊 *ESTATÍSTICAS DO RPG* ⊱━━━╮\n│\n`;
        text += `│ 👥 Total de jogadores: ${allUsers.length}\n`;
        text += `│ 💰 Dinheiro em circulação: ${totalMoney.toLocaleString()}\n`;
        text += `│ 🏦 Dinheiro em bancos: ${totalBank.toLocaleString()}\n`;
        text += `│ 💵 Total geral: ${(totalMoney + totalBank).toLocaleString()}\n`;
        text += `│ 🐾 Total de pets: ${totalPets}\n`;
        text += `│ 📈 Maior nível: ${maxLevel}\n`;
        text += `│\n`;
        if (richestUser.id) {
          text += `│ 🏆 Mais rico: @${richestUser.id.split('@')[0]}\n`;
          text += `│    💎 ${richestUser.wealth.toLocaleString()}\n`;
        }
        text += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        const mentions = richestUser.id ? [richestUser.id] : [];
        return reply(text, { mentions });
      }

      // ═══════════════════════════════════════════
      // SISTEMA DE LOJA PREMIUM / GASTAR DINHEIRO
      // ═══════════════════════════════════════════

      // Loja Premium com itens caros
      case 'lojapremium':
      case 'premiumshop':
      case 'lojadeluxo': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const premiumItems = [
          { id: 'titulo_lendario', name: '🏅 Título Lendário', price: 500000, desc: 'Título exclusivo no perfil' },
          { id: 'mascote_raro', name: '🦄 Mascote Raro', price: 750000, desc: 'Mascote especial que dá bônus' },
          { id: 'mansao', name: '🏰 Mansão', price: 2000000, desc: 'Propriedade de luxo (+5000 renda/dia)' },
          { id: 'yate', name: '🛥️ Iate', price: 1500000, desc: 'Barco de luxo (+bônus pesca)' },
          { id: 'jet_privado', name: '✈️ Jato Privado', price: 5000000, desc: 'Viaje instantaneamente' },
          { id: 'diamante_eterno', name: '💎 Diamante Eterno', price: 10000000, desc: 'Item colecionável raro' },
          { id: 'coroa_rei', name: '👑 Coroa Real', price: 25000000, desc: 'Símbolo máximo de poder' },
          { id: 'boost_permanente', name: '⚡ Boost Permanente', price: 3000000, desc: '+50% em todas atividades' },
          { id: 'protecao_vip', name: '🛡️ Proteção VIP', price: 1000000, desc: 'Proteção eterna contra roubos' },
          { id: 'multiplicador_xp', name: '✨ Multiplicador XP', price: 2500000, desc: '2x XP permanente' }
        ];

        let text = `╭━━━⊱ 💎 *LOJA PREMIUM* ⊱━━━╮\n`;
        text += `│ Itens exclusivos de luxo!\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        premiumItems.forEach(item => {
          text += `${item.name}\n`;
          text += `   💰 ${item.price.toLocaleString()} moedas\n`;
          text += `   📝 ${item.desc}\n`;
          text += `   🛒 ${prefix}comprarpremium ${item.id}\n\n`;
        });

        return reply(text);
      }

      // Comprar item premium
      case 'comprarpremium':
      case 'buypremium': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const rawItemId = (args[0] || '');
        if (!rawItemId) return reply(`❌ Informe o item!\n\n💡 Uso: ${prefix}comprarpremium <item>\n🛒 Veja a loja: ${prefix}lojapremium`);

        const premiumItems = {
          'titulo_lendario': { name: '🏅 Título Lendário', price: 500000 },
          'mascote_raro': { name: '🦄 Mascote Raro', price: 750000 },
          'mansao': { name: '🏰 Mansão', price: 2000000, income: 5000 },
          'yate': { name: '🛥️ Iate', price: 1500000 },
          'jet_privado': { name: '✈️ Jato Privado', price: 5000000 },
          'diamante_eterno': { name: '💎 Diamante Eterno', price: 10000000 },
          'coroa_rei': { name: '👑 Coroa Real', price: 25000000 },
          'boost_permanente': { name: '⚡ Boost Permanente', price: 3000000 },
          'protecao_vip': { name: '🛡️ Proteção VIP', price: 1000000 },
          'multiplicador_xp': { name: '✨ Multiplicador XP', price: 2500000 }
        };

        // Normaliza a busca do item ignorando acentos
        const itemId = findKeyIgnoringAccents(premiumItems, rawItemId) || normalizeParam(rawItemId).replace(/\s+/g, '_');
        const item = premiumItems[itemId];
        if (!item) return reply(`❌ Item não encontrado!\n\n🛒 Veja a loja: ${prefix}lojapremium`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (me.wallet < item.price) {
          return reply(`❌ Saldo insuficiente!\n\n💰 Necessário: ${item.price.toLocaleString()}\n💼 Sua carteira: ${me.wallet.toLocaleString()}`);
        }

        me.wallet -= item.price;
        me.premiumItems = me.premiumItems || {};
        me.premiumItems[itemId] = (me.premiumItems[itemId] || 0) + 1;

        // Aplicar efeitos especiais
        if (itemId === 'boost_permanente') me.permanentBoost = true;
        if (itemId === 'protecao_vip') me.vipProtection = true;
        if (itemId === 'multiplicador_xp') me.xpMultiplier = 2;
        if (item.income) me.dailyIncome = (me.dailyIncome || 0) + item.income;

        saveEconomy(econ);

        return reply(`╭━━━⊱ ✅ *COMPRA PREMIUM* ⊱━━━╮\n│\n│ 🛒 ${item.name}\n│ 💰 -${item.price.toLocaleString()}\n│\n│ ✨ Item adicionado com sucesso!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      }

      // Cassino Roleta - NERFADO
      case 'roleta':
      case 'roulette': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        // Cooldown de 10 minutos
        const cdRoleta = me.cooldowns?.roleta || 0;
        if (Date.now() < cdRoleta) return reply(`⏳ Aguarde ${timeLeft(cdRoleta)} para jogar roleta novamente.`);

        const bet = parseInt(args[0]) || 0;
        const rawChoice = (args[1] || '');

        if (bet <= 0) return reply(`🎰 *ROLETA*\n\n💡 Uso: ${prefix}roleta <valor> <cor>\n\nCores: vermelho, preto, verde\n\n🔴 Vermelho: 1.5x\n⚫ Preto: 1.5x\n🟢 Verde (0): 5x`);

        // Normaliza a cor escolhida
        const colorMap = {
          'vermelho': 'vermelho', 'red': 'vermelho', 'rubro': 'vermelho', 'encarnado': 'vermelho',
          'preto': 'preto', 'black': 'preto', 'negro': 'preto',
          'verde': 'verde', 'green': 'verde'
        };
        const normalizedRaw = normalizeParam(rawChoice);
        const choice = colorMap[normalizedRaw] || findKeyIgnoringAccents(colorMap, rawChoice);

        if (!choice) {
          return reply('❌ Escolha: vermelho, preto ou verde\n\n📝 Aceita: red, black, green também');
        }

        if (bet > me.wallet) return reply('❌ Saldo insuficiente na carteira!');

        // ROLETA NERFADA: A cor que o jogador NÃO escolheu tem 85% de chance de sair
        const result = Math.random();
        let winColor;
        const otherColors = ['vermelho', 'preto', 'verde'].filter(c => c !== choice);

        if (result < 0.85) {
          // 85% de chance de cair na cor que o jogador NÃO escolheu
          winColor = otherColors[Math.floor(Math.random() * otherColors.length)];
        } else if (result < 0.97) {
          // 12% de chance de cair na cor escolhida (se não for verde)
          winColor = choice === 'verde' ? otherColors[0] : choice;
        } else {
          // 3% de chance de verde (se escolheu verde, ainda assim só 3%)
          winColor = 'verde';
        }

        const colorEmoji = { vermelho: '🔴', preto: '⚫', verde: '🟢' };
        const normalizedChoice = choice;

        me.cooldowns = me.cooldowns || {};
        me.cooldowns.roleta = Date.now() + 10 * 60 * 1000; // 10 minutos

        let text = `╭━━━⊱ 🎰 *ROLETA* ⊱━━━╮\n\n`;
        text += `🎯 Sua aposta: ${colorEmoji[choice]} ${bet.toLocaleString()}\n`;
        text += `🎲 Resultado: ${colorEmoji[winColor]} ${winColor.toUpperCase()}\n\n`;

        if (normalizedChoice === winColor) {
          const multiplier = winColor === 'verde' ? 5 : 1.5; // multiplicadores reduzidos (era 14x e 2x)
          const winnings = Math.floor(bet * multiplier);
          me.wallet += winnings - bet;
          text += `🏆 *VITÓRIA RARA!*\n💰 +${winnings.toLocaleString()} (${multiplier}x)`;
        } else {
          me.wallet -= bet;
          text += `💀 *VOCÊ PERDEU!*\n💸 -${bet.toLocaleString()}\n🎰 A roleta parece viciada...`;
        }

        text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(text);
      }

      // Blackjack - NERFADO
      case 'blackjack':
      case 'bj':
      case '21': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        // Cooldown de 10 minutos
        const cdBJ = me.cooldowns?.blackjack || 0;
        if (Date.now() < cdBJ) return reply(`⏳ Aguarde ${timeLeft(cdBJ)} para jogar blackjack novamente.`);

        const bet = parseInt(args[0]) || 0;
        if (bet <= 0) return reply(`🃏 *BLACKJACK*\n\n💡 Uso: ${prefix}blackjack <valor>\n\n📜 Regras: Chegue mais perto de 21 sem passar!`);
        if (bet > me.wallet) return reply('❌ Saldo insuficiente!');

        // BLACKJACK NERFADO: Dealer tem cartas viciadas
        const getPlayerCard = () => {
          // Jogador tem mais chance de pegar cartas altas (que causam bust)
          const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
          const weights = [5, 3, 3, 4, 5, 6, 8, 10, 12, 15, 12, 10, 7]; // Cartas altas mais prováveis
          const total = weights.reduce((a, b) => a + b, 0);
          let rand = Math.random() * total;
          for (let i = 0; i < values.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return values[i];
          }
          return values[0];
        };

        const getDealerCard = () => {
          // Dealer tem mais chance de pegar cartas médias (evita bust)
          const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
          const weights = [8, 6, 7, 8, 9, 10, 12, 10, 8, 6, 5, 5, 6]; // Cartas médias mais prováveis
          const total = weights.reduce((a, b) => a + b, 0);
          let rand = Math.random() * total;
          for (let i = 0; i < values.length; i++) {
            rand -= weights[i];
            if (rand <= 0) return values[i];
          }
          return values[0];
        };

        const getValue = (cards) => {
          let total = 0;
          let aces = 0;
          cards.forEach(c => {
            if (c === 'A') { aces++; total += 11; }
            else if (['J', 'Q', 'K'].includes(c)) total += 10;
            else total += parseInt(c);
          });
          while (total > 21 && aces > 0) { total -= 10; aces--; }
          return total;
        };

        const playerCards = [getPlayerCard(), getPlayerCard()];
        const dealerCards = [getDealerCard(), getDealerCard()];

        // Simular jogo (simplificado) - jogador mais agressivo
        while (getValue(playerCards) < 17) playerCards.push(getPlayerCard());
        while (getValue(dealerCards) < 17) dealerCards.push(getDealerCard());

        const playerValue = getValue(playerCards);
        const dealerValue = getValue(dealerCards);

        me.cooldowns = me.cooldowns || {};
        me.cooldowns.blackjack = Date.now() + 10 * 60 * 1000; // 10 minutos

        let text = `╭━━━⊱ 🃏 *BLACKJACK* ⊱━━━╮\n\n`;
        text += `👤 Você: ${playerCards.join(' ')} = ${playerValue}\n`;
        text += `🎰 Dealer: ${dealerCards.join(' ')} = ${dealerValue}\n\n`;

        if (playerValue > 21) {
          me.wallet -= bet;
          text += `💀 *BUST!* Você passou de 21!\n💸 -${bet.toLocaleString()}\n🃏 Que azar...`;
        } else if (dealerValue > 21 || playerValue > dealerValue) {
          // Ganhos reduzidos
          const winnings = playerValue === 21 && playerCards.length === 2 ? Math.floor(bet * 1.8) : Math.floor(bet * 1.4);
          me.wallet += winnings - bet;
          text += `🏆 *VITÓRIA RARA!*\n💰 +${(winnings - bet).toLocaleString()}`;
        } else if (playerValue === dealerValue) {
          // Empate agora perde 30% da aposta
          const loss = Math.floor(bet * 0.3);
          me.wallet -= loss;
          text += `🤝 *EMPATE!*\n💸 Taxa de empate: -${loss.toLocaleString()}`;
        } else {
          me.wallet -= bet;
          text += `💀 *DEALER VENCEU!*\n💸 -${bet.toLocaleString()}\n🃏 O dealer parece ter sorte demais...`;
        }

        text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(text);
      }

      // Sistema de Slots (Caça-níqueis) - NERFADO
      case 'slots':
      case 'slotmachine':
      case 'cacaniquel': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        // Cooldown de 8 minutos
        const cdSlots2 = me.cooldowns?.slots2 || 0;
        if (Date.now() < cdSlots2) return reply(`⏳ Aguarde ${timeLeft(cdSlots2)} para jogar slots novamente.`);

        const bet = parseInt(args[0]) || 0;
        if (bet <= 0) return reply(`🎰 *CAÇA-NÍQUEIS*\n\n💡 Uso: ${prefix}slots <valor>\n\n🎲 Alinhe 3 símbolos iguais para ganhar!`);
        if (bet > me.wallet) return reply('❌ Saldo insuficiente!');

        // SLOTS NERFADO: Cada posição tem preferência por símbolos diferentes
        const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];

        const getSymbol = (position) => {
          // Cada posição tem pesos diferentes para quase nunca combinar
          const baseWeights = [25, 20, 18, 15, 12, 7, 3];
          const shifted = [...baseWeights.slice(position * 2), ...baseWeights.slice(0, position * 2)];
          const total = shifted.reduce((a, b) => a + b);
          let random = Math.random() * total;
          for (let i = 0; i < symbols.length; i++) {
            random -= shifted[i];
            if (random <= 0) return symbols[i];
          }
          return symbols[0];
        };

        const slot1 = getSymbol(0);
        const slot2 = getSymbol(1);
        const slot3 = getSymbol(2);

        // Multiplicadores reduzidos
        const multipliers = {
          '🍒': 1.5, '🍋': 2, '🍊': 2.5, '🍇': 3, '⭐': 5, '💎': 10, '7️⃣': 25
        };

        me.cooldowns = me.cooldowns || {};
        me.cooldowns.slots2 = Date.now() + 8 * 60 * 1000; // 8 minutos

        let text = `╭━━━⊱ 🎰 *SLOTS* ⊱━━━╮\n\n`;
        text += `┏━━━━━━━━━━━━━━┓\n`;
        text += `┃  ${slot1}  │  ${slot2}  │  ${slot3}  ┃\n`;
        text += `┗━━━━━━━━━━━━━━┛\n\n`;

        if (slot1 === slot2 && slot2 === slot3) {
          // Jackpot! (muito raro agora)
          const multi = multipliers[slot1];
          const winnings = Math.floor(bet * multi);
          me.wallet += winnings - bet;
          text += `🎉 *JACKPOT RARO!* 🎉\n`;
          text += `💰 Você ganhou ${winnings.toLocaleString()}! (${multi}x)`;
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
          // 2 iguais - agora paga menos
          const winnings = Math.floor(bet * 1.1);
          me.wallet += winnings - bet;
          text += `⭐ *PAR!*\n`;
          text += `💰 Você ganhou ${(winnings - bet).toLocaleString()}! (1.1x)`;
        } else {
          me.wallet -= bet;
          text += `💀 *PERDEU!*\n💸 -${bet.toLocaleString()}\n🎰 A máquina parece viciada...`;
        }

        text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(text);
      }

      // Loteria
      case 'loteria':
      case 'lottery':
      case 'mega': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const ticketPrice = 10000;
        const sub = (args[0] || '').toLowerCase();

        if (!econ.lottery) {
          econ.lottery = {
            jackpot: 100000,
            tickets: {},
            lastDraw: Date.now(),
            winners: []
          };
        }

        // Garantir que lastDraw seja sempre válido
        if (!econ.lottery.lastDraw || econ.lottery.lastDraw === 0) {
          econ.lottery.lastDraw = Date.now();
        }

        if (!sub || sub === 'ver') {
          const myTickets = econ.lottery.tickets[sender] || 0;
          const totalTickets = Object.values(econ.lottery.tickets).reduce((a, b) => a + b, 0);
          const nextDrawTime = econ.lottery.lastDraw + 86400000; // +24 horas
          const nextDraw = new Date(nextDrawTime).toLocaleString('pt-BR');

          let text = `╭━━━⊱ 🎫 *LOTERIA* ⊱━━━╮\n\n`;
          text += `💰 Jackpot: *${econ.lottery.jackpot.toLocaleString()}*\n`;
          text += `🎟️ Total de bilhetes: ${totalTickets}\n`;
          text += `📅 Próximo sorteio: ${nextDraw}\n\n`;
          text += `🎫 Seus bilhetes: ${myTickets}\n`;
          text += `💵 Preço: ${ticketPrice.toLocaleString()}/bilhete\n\n`;
          text += `💡 Use ${prefix}loteria comprar <qtd>`;

          return reply(text);
        }

        if (sub === 'comprar') {
          const qty = parseInt(args[1]) || 1;
          const totalCost = ticketPrice * qty;

          if (me.wallet < totalCost) {
            return reply(`❌ Saldo insuficiente!\n\n💰 Necessário: ${totalCost.toLocaleString()}\n💼 Sua carteira: ${me.wallet.toLocaleString()}`);
          }

          me.wallet -= totalCost;
          econ.lottery.tickets[sender] = (econ.lottery.tickets[sender] || 0) + qty;
          econ.lottery.jackpot += totalCost;

          saveEconomy(econ);

          return reply(`╭━━━⊱ 🎫 *BILHETES COMPRADOS* ⊱━━━╮\n\n🎟️ Quantidade: ${qty}\n💰 Total: -${totalCost.toLocaleString()}\n\n🎫 Seus bilhetes: ${econ.lottery.tickets[sender]}\n💰 Jackpot atual: ${econ.lottery.jackpot.toLocaleString()}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        return reply(`❌ Subcomando inválido!\n\n💡 Use:\n${prefix}loteria - Ver informações\n${prefix}loteria comprar <qtd> - Comprar bilhetes`);
      }

      // Corrida de cavalos
      case 'corrida':
      case 'horserace':
      case 'cavalos': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const bet = parseInt(args[0]) || 0;
        const horse = parseInt(args[1]) || 0;

        if (bet <= 0 || horse < 1 || horse > 5) {
          let text = `╭━━━⊱ 🏇 *CORRIDA DE CAVALOS* ⊱━━━╮\n\n`;
          text += `💡 Uso: ${prefix}corrida <valor> <cavalo 1-5>\n\n`;
          text += `🐴 Cavalos:\n`;
          text += `1. 🟤 Trovão (1.5x) - Favorito\n`;
          text += `2. ⚪ Relâmpago (2x)\n`;
          text += `3. ⚫ Sombra (3x)\n`;
          text += `4. 🟡 Ouro (5x)\n`;
          text += `5. 🔴 Fênix (10x) - Zebra\n`;
          text += `\n╰━━━━━━━━━━━━━━━━━━━━╯`;
          return reply(text);
        }

        if (bet > me.wallet) return reply('❌ Saldo insuficiente!');

        const horses = [
          { name: '🟤 Trovão', odds: 1.5, chance: 35 },
          { name: '⚪ Relâmpago', odds: 2, chance: 25 },
          { name: '⚫ Sombra', odds: 3, chance: 20 },
          { name: '🟡 Ouro', odds: 5, chance: 12 },
          { name: '🔴 Fênix', odds: 10, chance: 8 }
        ];

        const selectedHorse = horses[horse - 1];

        // Determinar vencedor
        let random = Math.random() * 100;
        let winner = 0;
        for (let i = 0; i < horses.length; i++) {
          random -= horses[i].chance;
          if (random <= 0) { winner = i + 1; break; }
        }

        let text = `╭━━━⊱ 🏇 *CORRIDA* ⊱━━━╮\n\n`;
        text += `🎯 Você apostou: ${selectedHorse.name}\n`;
        text += `💰 Valor: ${bet.toLocaleString()}\n\n`;
        text += `🏁 E o vencedor é...\n\n`;
        text += `🏆 *${horses[winner - 1].name}*\n\n`;

        if (winner === horse) {
          const winnings = Math.floor(bet * selectedHorse.odds);
          me.wallet += winnings - bet;
          text += `🎉 *VOCÊ GANHOU!*\n💰 +${winnings.toLocaleString()} (${selectedHorse.odds}x)`;
        } else {
          me.wallet -= bet;
          text += `💀 *VOCÊ PERDEU!*\n💸 -${bet.toLocaleString()}`;
        }

        text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

        saveEconomy(econ);
        return reply(text);
      }

      // Leilão
      case 'leilao':
      case 'leilaorpg':
      case 'leiloar': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!econ.auctions) econ.auctions = [];

        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'ver') {
          if (econ.auctions.length === 0) {
            return reply(`🏛️ Nenhum leilão ativo!\n\n💡 Use ${prefix}leilao criar <item> <preço> para criar um leilão`);
          }

          let text = `╭━━━⊱ 🏛️ *LEILÕES ATIVOS* ⊱━━━╮\n\n`;

          econ.auctions.forEach((auction, i) => {
            const endsIn = Math.max(0, Math.floor((auction.endTime - Date.now()) / 60000));
            text += `${i + 1}. ${auction.item}\n`;
            text += `   💰 Lance atual: ${auction.currentBid.toLocaleString()}\n`;
            text += `   👤 Maior lance: @${auction.highestBidder ? auction.highestBidder.split('@')[0] : 'Ninguém'}\n`;
            text += `   ⏰ Termina em: ${endsIn} min\n\n`;
          });

          text += `💡 ${prefix}leilao dar <nº> <valor>\n`;
          text += `╰━━━━━━━━━━━━━━━━━━━━╯`;

          saveEconomy(econ);
          return reply(text);
        }

        if (sub === 'criar') {
          const item = args[1];
          const price = parseInt(args[2]) || 0;

          if (!item || price < 1000) {
            return reply(`❌ Use: ${prefix}leilao criar <item> <preço_inicial>\n\n📌 Preço mínimo: 1.000`);
          }

          if (!me.inventory || !me.inventory[item] || me.inventory[item] < 1) {
            return reply(`❌ Você não tem esse item no inventário!`);
          }

          me.inventory[item]--;

          econ.auctions.push({
            seller: sender,
            item: item,
            startPrice: price,
            currentBid: price,
            highestBidder: null,
            endTime: Date.now() + 3600000 // 1 hora
          });

          saveEconomy(econ);

          return reply(`╭━━━⊱ 🏛️ *LEILÃO CRIADO* ⊱━━━╮\n\n📦 Item: ${item}\n💰 Preço inicial: ${price.toLocaleString()}\n⏰ Duração: 1 hora\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        if (sub === 'dar' || sub === 'bid') {
          const auctionIndex = parseInt(args[1]) - 1;
          const bidAmount = parseInt(args[2]) || 0;

          if (auctionIndex < 0 || auctionIndex >= econ.auctions.length) {
            return reply('❌ Leilão não encontrado!');
          }

          const auction = econ.auctions[auctionIndex];

          if (auction.seller === sender) {
            return reply('❌ Você não pode dar lance no próprio leilão!');
          }

          if (bidAmount <= auction.currentBid) {
            return reply(`❌ Lance deve ser maior que ${auction.currentBid.toLocaleString()}!`);
          }

          if (me.wallet < bidAmount) {
            return reply('❌ Saldo insuficiente!');
          }

          // Devolver dinheiro ao lance anterior
          if (auction.highestBidder) {
            const prevBidder = getEcoUser(econ, auction.highestBidder);
            prevBidder.wallet += auction.currentBid;
          }

          me.wallet -= bidAmount;
          auction.currentBid = bidAmount;
          auction.highestBidder = sender;

          saveEconomy(econ);

          return reply(`╭━━━⊱ 🏛️ *LANCE DADO* ⊱━━━╮\n\n📦 Item: ${auction.item}\n💰 Seu lance: ${bidAmount.toLocaleString()}\n🏆 Você é o maior lance!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        return reply(`❌ Subcomando inválido!\n\n💡 Use:\n${prefix}leilao - Ver leilões\n${prefix}leilao criar <item> <preço>\n${prefix}leilao dar <nº> <valor>`);
      }

      // Ranking de riqueza global
      case 'topriqueza':
      case 'toprich':
      case 'maiores': {
        const econ = loadEconomy();
        const allUsers = Object.entries(econ.users || {});

        if (allUsers.length === 0) return reply('📊 Nenhum jogador registrado ainda.');

        const rankedUsers = allUsers.map(([id, data]) => {
          const totalWealth = (data.wallet || 0) + (data.bank || 0);
          return { id, totalWealth };
        }).sort((a, b) => b.totalWealth - a.totalWealth).slice(0, 15);

        let text = `╭━━━⊱ 💎 *TOP RIQUEZA* ⊱━━━╮\n`;
        text += `│ Os 15 mais ricos do bot!\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        const mentions = [];
        rankedUsers.forEach((user, i) => {
          const medal = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          text += `${medal} @${user.id.split('@')[0]}\n`;
          text += `   💰 ${user.totalWealth.toLocaleString()}\n`;
          mentions.push(user.id);
        });

        return reply(text, { mentions });
      }

      // Sistema de Boost/Buff temporário
      case 'boost':
      case 'buff':
      case 'impulsionar': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const boosts = {
          xp: { name: '✨ Boost XP (2x)', price: 50000, duration: 3600000, effect: 'xpBoost' },
          money: { name: '💰 Boost Moedas (1.5x)', price: 75000, duration: 3600000, effect: 'moneyBoost' },
          luck: { name: '🍀 Boost Sorte (+20%)', price: 100000, duration: 3600000, effect: 'luckBoost' },
          power: { name: '⚔️ Boost Poder (+50%)', price: 80000, duration: 1800000, effect: 'powerBoost' },
          mega: { name: '🔥 Mega Boost (Todos)', price: 250000, duration: 1800000, effect: 'megaBoost' }
        };

        const rawSub = (args[0] || '');
        // Normaliza o parâmetro do boost
        const sub = rawSub ? (resolveParamAlias(rawSub) || findKeyIgnoringAccents(boosts, rawSub) || normalizeParam(rawSub)) : '';

        if (!sub || sub === 'ver') {
          let text = `╭━━━⊱ ⚡ *BOOSTS* ⊱━━━╮\n\n`;

          // Verificar boosts ativos
          if (me.activeBoosts && Object.keys(me.activeBoosts).length > 0) {
            text += `🔥 *BOOSTS ATIVOS:*\n`;
            for (const [key, boost] of Object.entries(me.activeBoosts)) {
              if (Date.now() < boost.expires) {
                const remaining = Math.ceil((boost.expires - Date.now()) / 60000);
                text += `• ${boosts[key]?.name || key}: ${remaining} min restantes\n`;
              }
            }
            text += `\n`;
          }

          text += `📦 *BOOSTS DISPONÍVEIS:*\n\n`;

          for (const [id, boost] of Object.entries(boosts)) {
            text += `${boost.name}\n`;
            text += `   💰 ${boost.price.toLocaleString()}\n`;
            text += `   ⏰ ${boost.duration / 60000} minutos\n`;
            text += `   🛒 ${prefix}boost ${id}\n\n`;
          }

          return reply(text);
        }

        const boost = boosts[sub];
        if (!boost) return reply(`❌ Boost não encontrado!\n\n💡 Use ${prefix}boost para ver disponíveis`);

        if (me.wallet < boost.price) {
          return reply(`❌ Saldo insuficiente!\n\n💰 Necessário: ${boost.price.toLocaleString()}\n💼 Sua carteira: ${me.wallet.toLocaleString()}`);
        }

        me.wallet -= boost.price;

        if (!me.activeBoosts) me.activeBoosts = {};
        me.activeBoosts[sub] = {
          expires: Date.now() + boost.duration,
          effect: boost.effect
        };

        saveEconomy(econ);

        return reply(`╭━━━⊱ ⚡ *BOOST ATIVADO* ⊱━━━╮\n\n${boost.name}\n⏰ Duração: ${boost.duration / 60000} minutos\n💰 Custo: -${boost.price.toLocaleString()}\n\n🔥 Aproveite os bônus!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
      }

      // Sistema de Tributos/Impostos
      case 'tributos':
      case 'impostos':
      case 'taxes': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const totalWealth = (me.wallet || 0) + (me.bank || 0);

        // Taxa de imposto baseada na riqueza
        let taxRate = 0;
        let taxBracket = '';

        if (totalWealth >= 10000000) {
          taxRate = 0.1; // 10%
          taxBracket = '💎 Elite (10%)';
        } else if (totalWealth >= 5000000) {
          taxRate = 0.07; // 7%
          taxBracket = '🏆 Rico (7%)';
        } else if (totalWealth >= 1000000) {
          taxRate = 0.05; // 5%
          taxBracket = '💰 Classe Alta (5%)';
        } else if (totalWealth >= 500000) {
          taxRate = 0.03; // 3%
          taxBracket = '📈 Classe Média (3%)';
        } else if (totalWealth >= 100000) {
          taxRate = 0.01; // 1%
          taxBracket = '📊 Trabalhador (1%)';
        } else {
          taxRate = 0;
          taxBracket = '🆓 Isento (0%)';
        }

        const dailyTax = Math.floor(totalWealth * taxRate / 7); // Semanal dividido por dia

        if (!me.taxes) {
          me.taxes = {
            lastPaid: 0,
            totalPaid: 0,
            exempt: false
          };
        }

        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'ver') {
          const daysSincePayment = Math.floor((Date.now() - (me.taxes.lastPaid || 0)) / 86400000);
          const dueAmount = daysSincePayment > 0 ? dailyTax * daysSincePayment : 0;

          let text = `╭━━━⊱ 🏦 *TRIBUTOS* ⊱━━━╮\n\n`;
          text += `💎 Riqueza Total: ${totalWealth.toLocaleString()}\n`;
          text += `📊 Faixa: ${taxBracket}\n`;
          text += `💰 Taxa diária: ${dailyTax.toLocaleString()}\n\n`;
          text += `📅 Dias desde pagamento: ${daysSincePayment}\n`;
          text += `💸 Valor devido: ${dueAmount.toLocaleString()}\n`;
          text += `📈 Total já pago: ${me.taxes.totalPaid.toLocaleString()}\n\n`;

          if (dueAmount > 0) {
            text += `⚠️ Pague seus tributos!\n`;
            text += `💡 Use ${prefix}tributos pagar\n\n`;
            text += `❌ Penalidade: -20% trabalho se não pagar`;
          } else {
            text += `✅ Tributos em dia!`;
          }

          text += `\n\n╰━━━━━━━━━━━━━━━━━━━━╯`;

          saveEconomy(econ);
          return reply(text);
        }

        if (sub === 'pagar') {
          const daysSincePayment = Math.floor((Date.now() - (me.taxes.lastPaid || 0)) / 86400000);
          const dueAmount = daysSincePayment > 0 ? dailyTax * daysSincePayment : 0;

          if (dueAmount === 0) {
            return reply('✅ Você não tem tributos pendentes!');
          }

          if (me.wallet < dueAmount) {
            return reply(`❌ Saldo insuficiente!\n\n💸 Valor devido: ${dueAmount.toLocaleString()}\n💼 Sua carteira: ${me.wallet.toLocaleString()}`);
          }

          me.wallet -= dueAmount;
          me.taxes.lastPaid = Date.now();
          me.taxes.totalPaid = (me.taxes.totalPaid || 0) + dueAmount;

          saveEconomy(econ);

          return reply(`╭━━━⊱ ✅ *TRIBUTOS PAGOS* ⊱━━━╮\n\n💸 Valor: -${dueAmount.toLocaleString()}\n📅 Próximo: Em 1 dia\n\n✅ Você está em dia!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
        }

        return reply(`❌ Subcomando inválido!\n\n💡 Use:\n${prefix}tributos - Ver situação\n${prefix}tributos pagar - Pagar tributos`);
      }

      // Sistema de Doação
      case 'doar':
      case 'donate':
      case 'doacao': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const amount = parseInt(args[0]) || 0;
        if (amount < 1000) return reply(`💝 *DOAÇÃO*\n\n💡 Uso: ${prefix}doar <valor>\n\n📌 Mínimo: 1.000 moedas\n✨ Ganhe karma e reputação por doar!`);

        if (me.wallet < amount) return reply('❌ Saldo insuficiente!');

        me.wallet -= amount;

        // Ganhar karma e reputação
        if (!me.reputation) me.reputation = { points: 0, upvotes: 0, downvotes: 0, karma: 0, fame: 0 };
        const karmaGain = Math.floor(amount / 1000);
        me.reputation.karma = (me.reputation.karma || 0) + karmaGain;
        me.reputation.points = (me.reputation.points || 0) + Math.floor(karmaGain / 2);
        me.reputation.fame = (me.reputation.fame || 0) + 1;

        if (!me.donations) me.donations = { total: 0, count: 0 };
        me.donations.total += amount;
        me.donations.count++;

        // Adicionar ao tesouro do RPG
        if (!econ.treasury) econ.treasury = 0;
        econ.treasury += amount;

        saveEconomy(econ);

        return reply(`╭━━━⊱ 💝 *DOAÇÃO* ⊱━━━╮\n\n💰 Valor: ${amount.toLocaleString()}\n☯️ Karma: +${karmaGain}\n⭐ Reputação: +${Math.floor(karmaGain / 2)}\n\n📊 Total doado: ${me.donations.total.toLocaleString()}\n🏦 Tesouro: ${econ.treasury.toLocaleString()}\n\n✨ Obrigado pela generosidade!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
      }

      // Sistema de Presente
      case 'presente':
      case 'gift': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        const target = (menc_jid2 && menc_jid2[0]) || null;
        if (!target) return reply(`🎁 *PRESENTE*\n\n💡 Uso: ${prefix}presente @user <item> <quantidade>\n\n📦 Envie itens do seu inventário para outros jogadores!`);
        if (target === sender) return reply('❌ Você não pode enviar presentes para si mesmo!');

        const item = (args[0] || '').toLowerCase();
        const qty = parseInt(args[1]) || 1;

        if (!item) return reply('❌ Informe o item que deseja enviar!');

        me.inventory = me.inventory || {};
        if (!me.inventory[item] || me.inventory[item] < qty) {
          return reply(`❌ Você não tem ${item} suficiente!\n\n📦 Você tem: ${me.inventory[item] || 0}`);
        }

        const targetData = getEcoUser(econ, target);
        targetData.inventory = targetData.inventory || {};

        me.inventory[item] -= qty;
        targetData.inventory[item] = (targetData.inventory[item] || 0) + qty;

        saveEconomy(econ);

        return reply(`╭━━━⊱ 🎁 *PRESENTE ENVIADO* ⊱━━━╮\n\n📦 Item: ${item}\n🔢 Quantidade: ${qty}\n👤 Para: @${target.split('@')[0]}\n\n✨ Presente entregue!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`, { mentions: [target] });
      }

      // Estatísticas pessoais detalhadas
      case 'meustats':
      case 'mystats':
      case 'statsrpg': {
        if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.stats) me.stats = {};

        const totalWealth = (me.wallet || 0) + (me.bank || 0);
        const premiumItems = Object.keys(me.premiumItems || {}).length;
        const achievements = Object.keys(me.achievements || {}).length;
        const pets = (me.pets || []).length;

        let text = `╭━━━⊱ 📊 *MINHAS ESTATÍSTICAS* ⊱━━━╮\n`;
        text += `│ ${pushname}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        text += `💰 *FINANÇAS*\n`;
        text += `├ Carteira: ${(me.wallet || 0).toLocaleString()}\n`;
        text += `├ Banco: ${(me.bank || 0).toLocaleString()}\n`;
        text += `├ Total: ${totalWealth.toLocaleString()}\n`;
        text += `└ Doações: ${(me.donations?.total || 0).toLocaleString()}\n\n`;

        text += `⚔️ *COMBATE*\n`;
        text += `├ Batalhas vencidas: ${me.battlesWon || 0}\n`;
        text += `├ Batalhas perdidas: ${me.battlesLost || 0}\n`;
        text += `├ Duelos: ${me.stats?.duels || 0}\n`;
        text += `└ Crimes: ${me.stats?.crimes || 0}\n\n`;

        text += `💼 *TRABALHO*\n`;
        text += `├ Trabalhos: ${me.stats?.workCount || 0}\n`;
        text += `├ Mineração: ${me.stats?.mineCount || 0}\n`;
        text += `├ Pesca: ${me.stats?.fishCount || 0}\n`;
        text += `└ Caça: ${me.stats?.huntCount || 0}\n\n`;

        text += `🎰 *APOSTAS*\n`;
        text += `├ Ganhou: ${(me.stats?.gamblingWins || 0).toLocaleString()}\n`;
        text += `├ Perdeu: ${(me.stats?.gamblingLosses || 0).toLocaleString()}\n`;
        text += `└ Saldo: ${((me.stats?.gamblingWins || 0) - (me.stats?.gamblingLosses || 0)).toLocaleString()}\n\n`;

        text += `🏆 *PROGRESSO*\n`;
        text += `├ Level: ${me.level || 1}\n`;
        text += `├ Prestige: ${me.prestige?.level || 0}\n`;
        text += `├ Conquistas: ${achievements}\n`;
        text += `├ Pets: ${pets}\n`;
        text += `└ Itens Premium: ${premiumItems}\n\n`;

        text += `⭐ *REPUTAÇÃO*\n`;
        text += `├ Pontos: ${me.reputation?.points || 0}\n`;
        text += `├ Karma: ${me.reputation?.karma || 0}\n`;
        text += `└ Fama: ${me.reputation?.fame || 0}`;

        saveEconomy(econ);
        return reply(text);
      }

      // Sistema de Evolução/Prestige
      case 'evoluir':
      case 'evolucao':
      case 'prestige': {
        if (!isGroup) {
          return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
        }

        if (!groupData.modorpg) {
          return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
        }

        const econ = loadEconomy();
        const me = getEcoUser(econ, sender);

        if (!me.prestige) {
          me.prestige = {
            level: 0,
            totalResets: 0,
            bonusMultiplier: 1
          };
        }

        const quantidade = parseInt(q, 10);

        if (!q || isNaN(quantidade) || quantidade < 1) {
          return reply(`🌟 *EVOLUÇÃO / PRESTIGE*

Use:
${prefix}evoluir 1

💰 Preço por evolução: 700 moedas`);
        }

        if (quantidade !== 1) {
          return reply(`❌ Você só pode evoluir 1 vez por comando.

Use:
${prefix}evoluir 1`);
        }

        const preco = 700;
        const carteiraAtual = me.wallet || 0;

        if (carteiraAtual < preco) {
          return reply(`❌ Você não tem moedas suficientes!

💰 Preço da evolução: ${preco.toLocaleString()}
👛 Sua carteira: ${carteiraAtual.toLocaleString()}`);
        }

        me.wallet -= preco;

        const prestigeAnterior = me.prestige.level || 0;
        me.prestige.level = prestigeAnterior + 1;
        me.prestige.totalResets = (me.prestige.totalResets || 0) + 1;
        me.prestige.bonusMultiplier = 1 + (me.prestige.level * 0.15);

        me.level = 1;
        me.exp = 0;

        saveEconomy(econ);

        return reply(`╭━━━⊱ 🌟 *EVOLUÇÃO CONCLUÍDA!* 🌟 ⊱━━━╮
│
│ 👤 *Jogador:* ${pushname}
│ 🔱 *Prestige:* ${prestigeAnterior} → ${me.prestige.level}
│ 💰 *Valor pago:* ${preco.toLocaleString()} moedas
│ 👛 *Carteira restante:* ${me.wallet.toLocaleString()}
│ ✨ *Multiplicador:* ${me.prestige.bonusMultiplier.toFixed(2)}x
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

✅ Sua evolução foi realizada com sucesso!`);
      }

      case 'perfil':
        try {
          const target = sender;
          const targetId = getUserName(target);
          const targetName = `@${targetId}`;
          const levels = {
            puta: Math.floor(Math.random() * 101),
            gado: Math.floor(Math.random() * 101),
            corno: Math.floor(Math.random() * 101),
            sortudo: Math.floor(Math.random() * 101),
            carisma: Math.floor(Math.random() * 101),
            rico: Math.floor(Math.random() * 101),
            gostosa: Math.floor(Math.random() * 101),
            feio: Math.floor(Math.random() * 101)
          };
          const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;
          const humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
          const randomHumor = humors[Math.floor(Math.random() * humors.length)];
          let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
          try {
            profilePic = await nazu.profilePictureUrl(target, 'image');
          } catch (error) {
            console.warn(`Falha ao obter foto do perfil de ${targetName}:`, error.message);
          }
          let bio = 'Sem bio disponível';
          let bioSetAt = '';
          try {
            const statusData = await nazu.fetchStatus(target);
            const status = statusData?.[0]?.status;
            if (status) {
              bio = status.status || bio;
              bioSetAt = new Date(status.setAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo'
              });
            }
          } catch (error) {
            console.warn(`Falha ao obter status/bio de ${targetName}:`, error.message);
          }
          const perfilText = `📋 Perfil de ${targetName} 📋\n\n👤 *Nome*: ${pushname || 'Desconhecido'}\n📱 *Número*: ${targetId}\n📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}\n💰 *Valor do Pacote*: ${pacoteValue} 🫦\n😸 *Humor*: ${randomHumor}\n\n🎭 *Níveis*:\n  • Puta: ${levels.puta}%\n  • Gado: ${levels.gado}%\n  • Corno: ${levels.corno}%\n  • Sortudo: ${levels.sortudo}%\n  • Carisma: ${levels.carisma}%\n  • Rico: ${levels.rico}%\n  • Gostosa: ${levels.gostosa}%\n  • Feio: ${levels.feio}%`.trim();

          await nazu.sendMessage(from, { image: { url: profilePic }, caption: perfilText, mentions: [target] }, { quoted: info });
        } catch (error) {
          console.error('Erro ao processar comando perfil:', error);
          await reply('Ocorreu um erro ao gerar o perfil 💔');
        }
        break;
      case 'ppt':
        try {
          if (!q) return reply(`🎮 *Pedra, Papel ou Tesoura*\n\n💡 *Como jogar:*\n• Escolha sua jogada após o comando\n• Ex: ${prefix}ppt pedra\n• Ex: ${prefix}ppt papel\n• Ex: ${prefix}ppt tesoura\n\n🎲 Vamos ver quem ganha!`);
          const escolhas = ['pedra', 'papel', 'tesoura'];
          if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
          const botEscolha = escolhas[Math.floor(Math.random() * 3)];
          const usuarioEscolha = q.toLowerCase();
          let resultado;
          if (usuarioEscolha === botEscolha) {
            resultado = 'Empate! 🤝';
          } else if (usuarioEscolha === 'pedra' && botEscolha === 'tesoura' || usuarioEscolha === 'papel' && botEscolha === 'pedra' || usuarioEscolha === 'tesoura' && botEscolha === 'papel') {
            resultado = 'Você ganhou! 🎉';
          } else {
            resultado = 'Eu ganhei! 😎';
          }
          await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
        } catch (e) {
          console.error(e);
          await reply("Ocorreu um erro 💔");
        }
        break;


      case 'eununca':
        try {

          if (!isGroup) {
            return reply("isso so pode ser usado em grupo 💔");
          }

          if (!isModoBn) {
            return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          }

          const pergunta =
            toolsJson().iNever[
            Math.floor(
              Math.random() * toolsJson().iNever.length
            )
            ];

          await nazu.sendMessage(
            from,
            {
              poll: {
                name: `🔞 EU NUNCA\n\n${pergunta}`,
                values: [
                  'Eu nunca',
                  'Eu já'
                ],
                selectableCount: 1
              }
            },
            {
              quoted: info
            }
          );

        } catch (e) {

          console.error(e);

          await reply(
            "❌ Ocorreu um erro interno. Tente novamente em alguns minutos."
          );

        }
        break;

      case 'vab':
        try {

          if (!isGroup) {
            return reply("isso so pode ser usado em grupo 💔");
          }

          if (!isModoBn) {
            return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          }

          const vabs =
            vabJson()[
            Math.floor(
              Math.random() * vabJson().length
            )
            ];

          await nazu.sendMessage(
            from,
            {
              poll: {
                name: '🤔 O QUE VOCÊ PREFERE?',
                values: [
                  vabs.option1,
                  vabs.option2
                ],
                selectableCount: 1
              }
            },
            {
              quoted: info
            }
          );

        } catch (e) {

          console.error(e);

          await reply(
            "❌ Ocorreu um erro interno. Tente novamente em alguns minutos."
          );

        }
        break;
      case 'conselho':
        try {
          const conselhos = toolsJson().Conselhos;
          const conselho = conselhos[Math.floor(Math.random() * conselhos.length)];
          await reply(`💡 *Conselho do dia:*\n\n${conselho}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar o conselho.");
        }
        break;
      case 'conselhobiblico':
      case 'versiculo':
      case 'biblia':
        try {
          const conselhosBiblicos = toolsJson().ConselhosBiblicos;
          const conselhoBiblico = conselhosBiblicos[Math.floor(Math.random() * conselhosBiblicos.length)];
          await reply(`📖 *Conselho Bíblico:*\n\n${conselhoBiblico}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar o versículo.");
        }
        break;
      case 'cantada':
      case 'cantadas':
        try {
          const cantadas = toolsJson().Cantadas;
          const cantada = cantadas[Math.floor(Math.random() * cantadas.length)];
          await reply(`💘 *Cantada:*\n\n${cantada}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar a cantada.");
        }
        break;
      case 'piada':
      case 'piadas':
        try {
          const piadas = toolsJson().Piadas;
          const piada = piadas[Math.floor(Math.random() * piadas.length)];
          await reply(`😂 *Piada:*\n\n${piada}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar a piada.");
        }
        break;
      case 'charada':
      case 'enigma':
        try {
          const charadas = toolsJson().Charadas;
          const charada = charadas[Math.floor(Math.random() * charadas.length)];
          await reply(`🧩 *Charada:*\n\n${charada}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar a charada.");
        }
        break;
      case 'motivacional':
      case 'motivacao':
      case 'frasemotivacional':
        try {
          const motivacionais = toolsJson().FrasesMotivacionais;
          const motivacional = motivacionais[Math.floor(Math.random() * motivacionais.length)];
          await reply(`🚀 *Frase Motivacional:*\n\n${motivacional}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar a frase.");
        }
        break;
      case 'elogio':
      case 'elogiar':
        try {
          const elogios = toolsJson().Elogios;
          const elogio = elogios[Math.floor(Math.random() * elogios.length)];
          await reply(`🌟 *Elogio:*\n\n${elogio}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar o elogio.");
        }
        break;
      case 'reflexao':
      case 'pensamento':
        try {
          const reflexoes = toolsJson().Reflexoes;
          const reflexao = reflexoes[Math.floor(Math.random() * reflexoes.length)];
          await reply(`🤔 *Reflexão:*\n\n${reflexao}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar a reflexão.");
        }
        break;
      case 'fato':
      case 'fatocurioso':
      case 'curiosidade':
        try {
          const fatos = toolsJson().curiousFacts;
          const fato = fatos[Math.floor(Math.random() * fatos.length)];
          await reply(`🔬 *Fato Curioso:*\n\n${fato}`);
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro ao buscar o fato.");
        }
        break;
      case 'surubao':
      case 'suruba':
        try {
          if (isModoLite) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply(`Apenas em grupos`);
          if (!isModoBn) return reply('O modo brincadeira nao esta ativo no grupo');
          if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`);
          if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.");
          var emojiskk;
          emojiskk = ["🥵", "😈", "🫣", "😏"];
          var emojis2;
          emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
          var frasekk;
          frasekk = [`tá querendo relações sexuais a ${q}, topa?`, `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`];
          let path = buildGroupFilePath(from);
          // Otimização: Usar cache para leitura de arquivo
          let data = await optimizer.loadJsonWithCache(path, { mark: {} });
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          var context;
          context = frasekk[Math.floor(Math.random() * frasekk.length)];
          var ABC;
          ABC = `${emojis2} @${getUserName(sender)} ${context}\n\n`;
          var mencts;
          mencts = [sender];
          for (var i = 0; i < q; i++) {
            var menb;
            menb = membros[Math.floor(Math.random() * membros.length)];
            var ABC;
            ABC += `@${menb.split("@")[0]}\n`;
            mencts.push(menb);
          }
          await nazu.sendMessage(from, {
            image: {
              url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'
            },
            caption: ABC,
            mentions: mencts
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'suicidio':
        if (isGroupAdmin) return reply("❌ Awn, admin, você é precioso demais para isso. Fica aqui com a gente, tá? <3");
        if (!isBotAdmin) return reply("❌ Preciso ser admin para fazer isso.");
        reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`).then(() => {
          setTimeout(() => {
            nazu.groupParticipantsUpdate(from, [sender], "remove").then(() => {
              setTimeout(() => {
                reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`);
              }, 1000);
            });
          }, 2000);
        }).catch((e) => {
          console.error(e);
          reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        });
        break;
      case 'gay':
      case 'burro':
      case 'inteligente':
      case 'otaku':
      case 'fiel':
      case 'infiel':
      case 'corno':
      case 'gado':
      case 'gostoso':
      case 'feio':
      case 'rico':
      case 'pobre':
      case 'pirocudo':
      case 'pirokudo':
      case 'nazista':
      case 'ladrao':
      case 'safado':
      case 'vesgo':
      case 'bebado':
      case 'machista':
      case 'homofobico':
      case 'racista':
      case 'chato':
      case 'sortudo':
      case 'azarado':
      case 'forte':
      case 'fraco':
      case 'pegador':
      case 'otario':
      case 'macho':
      case 'bobo':
      case 'nerd':
      case 'preguicoso':
      case 'trabalhador':
      case 'brabo':
      case 'lindo':
      case 'malandro':
      case 'simpatico':
      case 'engracado':
      case 'charmoso':
      case 'misterioso':
      case 'carinhoso':
      case 'desumilde':
      case 'humilde':
      case 'ciumento':
      case 'corajoso':
      case 'covarde':
      case 'esperto':
      case 'talarico':
      case 'chorao':
      case 'brincalhao':
      case 'bolsonarista':
      case 'petista':
      case 'comunista':
      case 'lulista':
      case 'traidor':
      case 'bandido':
      case 'cachorro':
      case 'vagabundo':
      case 'pilantra':
      case 'mito':
      case 'padrao':
      case 'comedia':
      case 'psicopata':
      case 'fortao':
      case 'magrelo':
      case 'bombado':
      case 'chefe':
      case 'presidente':
      case 'rei':
      case 'patrao':
      case 'playboy':
      case 'zueiro':
      case 'gamer':
      case 'programador':
      case 'visionario':
      case 'billionario':
      case 'poderoso':
      case 'vencedor':
      case 'senhor':
      case 'fofoqueiro':
      case 'dorminhoco':
      case 'comilao':
      case 'sedentario':
      case 'atleta':
      case 'estudioso':
      case 'romantico':
      case 'extrovertido':
      case 'introvertido':
      case 'calmo':
      case 'nervoso':
      case 'organizado':
      case 'bagunceiro':
      case 'economico':
      case 'gastador':
      case 'saudavel':
      case 'doente':
      case 'supersticioso':
      case 'cetico':
      case 'religioso':
      case 'ateu':
      case 'tradicional':
      case 'moderno':
      case 'conservador':
      case 'liberal':
      case 'patriotico':
      case 'cosmopolita':
      case 'rural':
      case 'urbano':
      case 'aventureiro':
      case 'caseiro':
      case 'viajante':
      case 'local':
      case 'global':
      case 'tecnologico':
      case 'analogico':
      case 'digital':
      case 'offline':
      case 'online':
      case 'social':
      case 'antisocial':
      case 'popular':
      case 'solitario':
      case 'lider':
      case 'seguidor':
      case 'independente':
      case 'dependente':
      case 'criativo':
      case 'pratico':
      case 'sonhador':
      case 'realista':
      case 'otimista':
      case 'pessimista':
      case 'confiante':
      case 'inseguro':
      case 'maduro':
      case 'infantil':
      case 'serio':
      case 'sortudo2':
      case 'zueira':
      case 'viaja nte':
      case 'responsavel':
      case 'irresponsavel':
        try {
          if (isModoLite && ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'].includes(command)) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games: {}
          };
          const target = menc_os2 ? menc_os2 : sender;
          const targetName = `@${getUserName(target)}`;
          const level = Math.floor(Math.random() * 101);
          let responses = fs.existsSync(__dirname + '/funcs/json/gamestext.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext.json')) : {};
          const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
          const media = gamesData.games[command];
          if (media?.image) {
            await nazu.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [target]
            });
          } else if (media?.video) {
            let videoData = media.video?.url || media.video;

            if (typeof videoData === 'string' && videoData.endsWith('.mp4')) {
              const caminhoVideoLocal = path.join(__dirname, '..', 'midias', videoData);

              if (fs.existsSync(caminhoVideoLocal)) {
                videoData = fs.readFileSync(caminhoVideoLocal);
              }
            }

            await nazu.sendMessage(from, {
              video: videoData,
              caption: responseText,
              mentions: [target],
              gifPlayback: true
            });
          } else {
            await nazu.sendMessage(from, {
              text: responseText,
              mentions: [target]
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'lesbica':
      case 'burra':
      case 'corna':
      case 'gostosa':
      case 'feia':
      case 'rica':
      case 'bucetuda':
      case 'ladra':
      case 'safada':
      case 'vesga':
      case 'bebada':
      case 'homofobica':
      case 'chata':
      case 'sortuda':
      case 'azarada':
      case 'fraca':
      case 'pegadora':
      case 'otaria':
      case 'boba':
      case 'preguicosa':
      case 'trabalhadora':
      case 'braba':
      case 'linda':
      case 'malandra':
      case 'simpatica':
      case 'engracada':
      case 'charmosa':
      case 'misteriosa':
      case 'carinhosa':
      case 'ciumenta':
      case 'corajosa':
      case 'esperta':
      case 'talarica':
      case 'chorona':
      case 'brincalhona':
      case 'traidora':
      case 'bandida':
      case 'cachorra':
      case 'vagabunda':
      case 'fortona':
      case 'magrela':
      case 'bombada':
      case 'presidenta':
      case 'rainha':
      case 'patroa':
      case 'programadora':
      case 'visionaria':
      case 'bilionaria':
      case 'poderosa':
      case 'vencedora':
      case 'senhora':
      case 'fofoqueira':
      case 'dorminhoca':
      case 'comilona':
      case 'sedentaria':
      case 'estudiosa':
      case 'romantica':
      case 'extrovertida':
      case 'introvertida':
      case 'calma':
      case 'nervosa':
      case 'organizada':
      case 'bagunceira':
      case 'economica':
      case 'gastadora':
      case 'supersticiosa':
      case 'cetica':
      case 'religiosa':
      case 'ateia':
      case 'moderna':
      case 'conservadora':
      case 'patriotica':
      case 'urbana':
      case 'aventureira':
      case 'caseira':
      case 'tecnologica':
      case 'analogica':
      case 'solitaria':
      case 'seguidora':
      case 'criativa':
      case 'pratica':
      case 'sonhadora':
      case 'insegura':
      case 'madura':
      case 'seria':
        try {
          if (isModoLite && ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'].includes(command)) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não esta ativo nesse grupo');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games: {}
          };
          const target = menc_os2 ? menc_os2 : sender;
          const targetName = `@${getUserName(target)}`;
          const level = Math.floor(Math.random() * 101);
          let responses = fs.existsSync(__dirname + '/funcs/json/gamestext2.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/gamestext2.json')) : {};
          const responseText = responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) || `📊 ${targetName} tem *${level}%* de ${command}! 🔥`;
          const media = gamesData.games[command];
          if (media?.image) {
            await nazu.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [target]
            });
          } else if (media?.video) {
            await nazu.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: [target],
              gifPlayback: true
            });
          } else {
            await nazu.sendMessage(from, {
              text: responseText,
              mentions: [target]
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'rankgay':
      case 'rankburro':
      case 'rankinteligente':
      case 'rankotaku':
      case 'rankfiel':
      case 'rankinfiel':
      case 'rankcorno':
      case 'rankgado':
      case 'rankgostoso':
      case 'rankrico':
      case 'rankpobre':
      case 'rankforte':
      case 'rankpegador':
      case 'rankmacho':
      case 'ranknerd':
      case 'ranktrabalhador':
      case 'rankbrabo':
      case 'ranklindo':
      case 'rankmalandro':
      case 'rankengracado':
      case 'rankcharmoso':
      case 'rankvisionario':
      case 'rankpoderoso':
      case 'rankvencedor':
      case 'rankgays':
      case 'rankburros':
      case 'rankinteligentes':
      case 'rankotakus':
      case 'rankfiels':
      case 'rankinfieis':
      case 'rankcornos':
      case 'rankgados':
      case 'rankgostosos':
      case 'rankricos':
      case 'rankpobres':
      case 'rankfortes':
      case 'rankpegadores':
      case 'rankmachos':
      case 'ranknerds':
      case 'ranktrabalhadores':
      case 'rankbrabos':
      case 'ranklindos':
      case 'rankmalandros':
      case 'rankengracados':
      case 'rankcharmosos':
      case 'rankvisionarios':
      case 'rankpoderosos':
      case 'rankvencedores':
        try {
          if (isModoLite && ['rankgostoso', 'rankgostosos', 'ranknazista'].includes(command)) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          let path = buildGroupFilePath(from);
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            ranks: {}
          };
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
          let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
          let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
          let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : {
            ranks: {}
          };
          let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
          top5.forEach((m, i) => {

            responseText += `🏅 *#${i + 1}* - @${getUserName(m)}\n`;
          });
          let media = gamesData.ranks[cleanedCommand];
          if (media?.image) {
            await nazu.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: top5
            });
          } else if (media?.video) {
            await nazu.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: top5,
              gifPlayback: true
            });
          } else {
            await nazu.sendMessage(from, {
              text: responseText,
              mentions: top5
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'ranklesbica':
      case 'rankburra':
      case 'rankcorna':
      case 'rankgada':
      case 'rankgostosa':
      case 'rankrica':
      case 'rankpegadora':
      case 'ranktrabalhadora':
      case 'rankbraba':
      case 'ranklinda':
      case 'rankmalandra':
      case 'rankengracada':
      case 'rankcharmosa':
      case 'rankvisionaria':
      case 'rankpoderosa':
      case 'rankvencedora':
      case 'ranklesbicas':
      case 'rankburras':
      case 'rankcornas':
      case 'rankgads':
      case 'rankgostosas':
      case 'rankricas':
      case 'rankpegadoras':
      case 'ranktrabalhadoras':
      case 'rankbrabas':
      case 'ranklindas':
      case 'rankmalandras':
      case 'rankengracadas':
      case 'rankcharmosas':
      case 'rankvisionarias':
      case 'rankpoderosas':
      case 'rankvencedoras':
        try {
          if (isModoLite && ['rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          let path = buildGroupFilePath(from);
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            ranks: {}
          };
          let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {
            mark: {}
          };
          let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
          if (membros.length < 5) return reply('❌ Membros insuficientes para formar um ranking.');
          let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
          let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
          let ranksData = fs.existsSync(__dirname + '/funcs/json/ranks.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/ranks.json')) : {
            ranks: {}
          };
          let responseText = ranksData[cleanedCommand] + '\n\n' || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
          top5.forEach((m, i) => {

            responseText += `🏅 *#${i + 1}* - @${getUserName(m)}\n`;
          });
          let media = gamesData.ranks[cleanedCommand];
          if (media?.image) {
            await nazu.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: top5
            });
          } else if (media?.video) {
            await nazu.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: top5,
              gifPlayback: true
            });
          } else {
            await nazu.sendMessage(from, {
              text: responseText,
              mentions: top5
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'farmaraura':
        try {
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          if (!menc_os2) return reply('Marque um usuário.');

          const farmAuraMp4 = path.join(__dirname, '..', 'midias', 'gatosfofos.mp4');
          const farmAuraCaption = `@${getUserName(menc_os2)} farmou tanta aura que até os gatos começaram a aprender 🗿🐈`;

          if (!fs.existsSync(farmAuraMp4)) {
            return reply('❌ O GIF da farmaraura não foi encontrado.');
          }

          await nazu.sendMessage(from, {
            video: fs.readFileSync(farmAuraMp4),
            caption: farmAuraCaption,
            mentions: [menc_os2],
            gifPlayback: true
          });
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'chute':
      case 'chutar':
      case 'tapa':
      case 'soco':
      case 'socar':
      case 'beijo':
      case 'beijar':
      case 'beijob':
      case 'beijarb':
      case 'abraco':
      case 'abracar':
      case 'mata':
      case 'matar':
      case 'tapar':
      case 'goza':
      case 'gozar':
      case 'mamar':
      case 'mamada':
      case 'cafune':
      case 'morder':
      case 'mordida':
      case 'lamber':
      case 'lambida':
      case 'explodir':
      case 'sexo':
      case 'tomate':
        try {
          const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
          if (isModoLite && comandosImpróprios.includes(command)) return nazu.react('❌', {
            key: info.key
          });
          if (!isGroup) return reply("isso so pode ser usado em grupo 💔");
          if (!isModoBn) return reply('❌ O modo brincadeira não está ativo nesse grupo.');
          if (!menc_os2) return reply('Marque um usuário.');
          let gamesData = fs.existsSync(__dirname + '/funcs/json/games.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/games.json')) : {
            games2: {}
          };
          let GamezinData = fs.existsSync(__dirname + '/funcs/json/markgame.json') ? JSON.parse(fs.readFileSync(__dirname + '/funcs/json/markgame.json')) : {
            ranks: {}
          };
          let responseText = GamezinData[command].replaceAll('#nome#', `@${getUserName(menc_os2)}`) || `Voce acabou de dar um(a) ${command} no(a) @${getUserName(menc_os2)}`;
          let media = gamesData.games2[command];

          const midiasLocais = {
            tapa: 'taparr.mp4',
            tapar: 'tapinha.mp4',
            soco: 'soco.mp4',
            chutar: 'chuta.mp4',
            socar: 'soco.mp4',
            beijo: 'beijar.mp4',
            beijar: 'beijar.mp4',
            abraco: 'abraço.mp4',
            abracar: 'abraço.mp4',
            mata: 'matar.mp4',
            matar: 'matar.mp4',
            morder: 'morder.mp4',
            mordida: 'morder.mp4',
            lamber: 'lambida.mp4',
            lambida: 'lambida.mp4',
            explodir: 'explodir.mp4',
            mamar: 'mamarkk.mp4',
            mamada: 'mamarkk.mp4',
            goza: 'gozar.mp4',
            gozar: 'gozar.mp4',
            tomate: 'tomate.mp4'
          };

          const midiaLocal = midiasLocais[command];

          if (midiaLocal) {
            const caminhoMidia = path.join(__dirname, '..', 'midias', midiaLocal);

            if (fs.existsSync(caminhoMidia)) {
              await nazu.sendMessage(from, {
                video: fs.readFileSync(caminhoMidia),
                caption: responseText,
                mentions: [menc_os2],
                gifPlayback: true
              });
              break;
            }
          }

          if (media?.image) {
            await nazu.sendMessage(from, {
              image: media.image,
              caption: responseText,
              mentions: [menc_os2]
            });
          } else if (media?.video) {
            await nazu.sendMessage(from, {
              video: media.video,
              caption: responseText,
              mentions: [menc_os2],
              gifPlayback: true
            });
          } else {
            await nazu.sendMessage(from, {
              text: responseText,
              mentions: [menc_os2]
            });
          }
        } catch (e) {
          console.error(e);
          await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
        }
        break;
      case 'afk':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          const reason = q.trim();

          groupData.afkUsers = groupData.afkUsers || {};

          groupData.afkUsers[sender] = {
            reason: reason || 'Não especificado',
            since: Date.now()
          };
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          let afkSetMessage = `😴 Você está AFK.`;
          if (reason) {
            afkSetMessage += `
Motivo: ${reason}`;
          }
          await reply(afkSetMessage);
        } catch (e) {
          console.error('Erro no comando afk:', e);
          await reply("Ocorreu um erro ao definir AFK 💔");
        }
        break;
      case 'voltei':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.afkUsers && groupData.afkUsers[sender]) {
            delete groupData.afkUsers[sender];
            fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
            await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
          } else {
            await reply("Você não estava AFK.");
          }
        } catch (e) {
          console.error('Erro no comando voltei:', e);
          await reply("Ocorreu um erro ao remover AFK 💔");
        }
        break;
      case 'regras':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!groupData.rules || groupData.rules.length === 0) {
            return reply("📜 Nenhuma regra definida para este grupo ainda.");
          }
          let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜

`;
          groupData.rules.forEach((rule, index) => {
            rulesMessage += `${index + 1}. ${rule}
`;
          });
          await reply(rulesMessage);
        } catch (e) {
          console.error('Erro no comando regras:', e);
          await reply("Ocorreu um erro ao buscar as regras 💔");
        }
        break;
      case 'addregra':
      case 'addrule':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar regras.");
          if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);

          groupData.rules = groupData.rules || [];
          groupData.rules.push(q);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Regra adicionada com sucesso!
${groupData.rules.length}. ${q}`);
        } catch (e) {
          console.error('Erro no comando addregra:', e);
          await reply("Ocorreu um erro ao adicionar a regra 💔");
        }
        break;
      case 'delregra':
      case 'delrule':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover regras.");
          if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);

          groupData.rules = groupData.rules || [];
          const ruleNumber = parseInt(q);
          if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
            return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
          }
          const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
        } catch (e) {
          console.error('Erro no comando delregra:', e);
          await reply("Ocorreu um erro ao remover a regra 💔");
        }
        break;
      case 'addmod':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar moderadores.");
          if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuario`);
          const modToAdd = menc_os2;
          if (groupData.moderators.includes(modToAdd)) {
            return reply(`@${getUserName(modToAdd)} já é um moderador.`, {
              mentions: [modToAdd]
            });
          }
          groupData.moderators.push(modToAdd);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(modToAdd)} foi promovido a moderador do grupo!`, {
            mentions: [modToAdd]
          });
        } catch (e) {
          console.error('Erro no comando addmod:', e);
          await reply("Ocorreu um erro ao adicionar moderador 💔");
        }
        break;
      case 'delmod':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover moderadores.");
          if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuario`);
          const modToRemove = menc_os2;
          const modIndex = groupData.moderators.indexOf(modToRemove);
          if (modIndex === -1) {
            return reply(`@${getUserName(modToRemove)} não é um moderador.`, {
              mentions: [modToRemove]
            });
          }
          groupData.moderators.splice(modIndex, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ @${getUserName(modToRemove)} não é mais um moderador do grupo.`, {
            mentions: [modToRemove]
          });
        } catch (e) {
          console.error('Erro no comando delmod:', e);
          await reply("Ocorreu um erro ao remover moderador 💔");
        }
        break;
      case 'listmods':
      case 'modlist':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.moderators.length === 0) {
            return reply("🛡️ Não há moderadores definidos para este grupo.");
          }
          let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️\n\n`;
          const mentionedUsers = [];
          groupData.moderators.forEach(modJid => {
            modsMessage += `➥ @${getUserName(modJid)}\n`;
            mentionedUsers.push(modJid);
          });
          await reply(modsMessage, {
            mentions: mentionedUsers
          });
        } catch (e) {
          console.error('Erro no comando listmods:', e);
          await reply("Ocorreu um erro ao listar moderadores 💔");
        }
        break;
      case 'grantmodcmd':
      case 'addmodcmd':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
          if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
          const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
          if (groupData.allowedModCommands.includes(cmdToAllow)) {
            return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
          }
          groupData.allowedModCommands.push(cmdToAllow);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
        } catch (e) {
          console.error('Erro no comando grantmodcmd:', e);
          await reply("Ocorreu um erro ao permitir comando para moderadores 💔");
        }
        break;
      case 'revokemodcmd':
      case 'delmodcmd':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem gerenciar permissões de moderador.");
          if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
          const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
          const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
          if (cmdIndex === -1) {
            return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
          }
          groupData.allowedModCommands.splice(cmdIndex, 1);
          fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
          await reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
        } catch (e) {
          console.error('Erro no comando revokemodcmd:', e);
          await reply("Ocorreu um erro ao proibir comando para moderadores 💔");
        }
        break;
      case 'listmodcmds':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (groupData.allowedModCommands.length === 0) {
            return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
          }
          let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
          groupData.allowedModCommands.forEach(cmd => {
            cmdsMessage += `➥ ${prefix}${cmd}\n`;
          });
          await reply(cmdsMessage);
        } catch (e) {
          console.error('Erro no comando listmodcmds:', e);
          await reply("Ocorreu um erro ao listar comandos de moderadores 💔");
        }
        break;

      case 'wl.add':
      case 'wladd':
      case 'addwhitelist':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem adicionar usuários à whitelist.");

          if (!menc_os2) {
            const availableAntis = ['antilink', 'antilinkgp', 'antilinkhard', 'antilinksoft', 'antiporn', 'antistatus', 'antibtn', 'antidoc', 'antiloc', 'antifig'];
            return reply(`📋 *Uso do comando:*
${prefix}wl.add @usuario | anti1,anti2,anti3

*Antis disponíveis:*
${availableAntis.map(a => `• ${a}`).join('\n')}

*Exemplo:*
${prefix}wl.add @usuario | antilink,antistatus,antiporn`);
          }

          const userId = menc_os2;

          const wlArgs = q.split('|').map(a => a.trim());
          const antisString = wlArgs.length > 1 ? wlArgs[1] : wlArgs[0];

          if (!antisString || antisString.length === 0) {
            return reply(`⚠️ Especifique os antis após o |

*Exemplo:*
${prefix}wl.add @usuario | antilink,antistatus`);
          }

          const antis = antisString.split(',').map(a => a.trim().toLowerCase()).filter(a => a.length > 0 && !a.includes('@'));

          if (antis.length === 0) {
            return reply('⚠️ Nenhum anti válido foi especificado. Use o formato: antilink,antistatus,antiporn');
          }

          const validAntis = ['antilink', 'antilinkgp', 'antilinkhard', 'antilinksoft', 'antiporn', 'antistatus', 'antibtn', 'antidoc', 'antiloc', 'antifig'];
          const invalidAntis = antis.filter(a => !validAntis.includes(a));

          if (invalidAntis.length > 0) {
            return reply(`❌ Antis inválidos: ${invalidAntis.join(', ')}\n\n*Válidos:* ${validAntis.join(', ')}`);
          }

          groupData.adminWhitelist[userId] = {
            antis: antis,
            addedBy: sender,
            addedAt: new Date().toISOString()
          };

          persistGroupData();

          await reply(`✅ @${getUserName(userId)} adicionado à whitelist!\n\n*Antis ignorados:*\n${antis.map(a => `• ${a}`).join('\n')}`, {
            mentions: [userId]
          });
        } catch (e) {
          console.error('Erro no comando wl.add:', e);
          await reply("❌ Ocorreu um erro ao adicionar à whitelist.");
        }
        break;

      case 'wl.remove':
      case 'wlremove':
      case 'removewhitelist':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem remover usuários da whitelist.");

          if (!menc_os2) {
            return reply(`⚠️ Marque o usuário que deseja remover da whitelist.\n\nEx: ${prefix}wl.remove @usuario`);
          }

          const userId = menc_os2;

          if (!groupData.adminWhitelist[userId]) {
            return reply(`@${getUserName(userId)} não está na whitelist.`, {
              mentions: [userId]
            });
          }

          delete groupData.adminWhitelist[userId];
          persistGroupData();

          await reply(`✅ @${getUserName(userId)} removido da whitelist!`, {
            mentions: [userId]
          });
        } catch (e) {
          console.error('Erro no comando wl.remove:', e);
          await reply("❌ Ocorreu um erro ao remover da whitelist.");
        }
        break;

      case 'wl.lista':
      case 'wllist':
      case 'listawhitelist':
      case 'whitelistlista':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");

          const whitelistEntries = Object.entries(groupData.adminWhitelist || {});

          if (whitelistEntries.length === 0) {
            return reply('📋 Não há usuários na whitelist deste grupo.');
          }

          let message = `📋 *Whitelist do Grupo*\n`;
          message += `═══════════════════\n\n`;

          const mentions = [];

          whitelistEntries.forEach(([userId, data], index) => {
            mentions.push(userId);
            message += `${index + 1}. @${getUserName(userId)}\n`;
            message += `   *Antis ignorados:*\n`;
            data.antis.forEach(anti => {
              message += `   • ${anti}\n`;
            });
            message += `   *Adicionado em:* ${new Date(data.addedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;
          });

          message += `═══════════════════\n`;
          message += `Total: ${whitelistEntries.length} usuário(s)`;

          await reply(message, { mentions });
        } catch (e) {
          console.error('Erro no comando wl.lista:', e);
          await reply("❌ Ocorreu um erro ao listar whitelist.");
        }
        break;

      case 'minmessage':
        try {
          if (!isGroup) return reply("Este comando só funciona em grupos.");
          if (!isGroupAdmin) return reply("Apenas administradores podem configurar isso.");
          if (!args[0]) return reply(`Uso: ${prefix}minmessage <mínimo de dígitos> <ban/adv> ou ${prefix}minmessage off`);
          if (args[0].toLowerCase() === 'off') {
            delete groupData.minMessage;
            fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
            await reply(`✅ Sistema de legenda mínima desativado.`);
          } else {
            const minDigits = parseInt(args[0]);
            const action = args[1]?.toLowerCase();
            if (isNaN(minDigits) || minDigits < 1 || !['ban', 'adv'].includes(action)) {
              return reply(`Formato inválido. Use: ${prefix}minmessage <número positivo> <ban/adv>`);
            }
            groupData.minMessage = { minDigits, action };
            fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
            await reply(`✅ Configurado: Mínimo de ${minDigits} caracteres em legendas de fotos/vídeos. Ação em violação: ${action === 'ban' ? 'banir' : 'advertir'}.`);
          }
        } catch (e) {
          console.error('Erro no comando minmessage:', e);
          await reply("Ocorreu um erro ao configurar 💔");
        }
        break;

      case 'nuke':
        try {
          if (!isOwner) return reply('Apenas o dono pode usar este comando.');
          if (!isGroup) return reply('Apenas em grupos.');
          if (!isBotAdmin) return reply('Preciso ser admin para isso.');
          const membersToBan = AllgroupMembers.filter(m => m !== nazu.user.id && m !== sender);
          if (membersToBan.length === 0) return reply('Nenhum membro para banir.');
          await nazu.groupParticipantsUpdate(from, membersToBan, 'remove');
        } catch (e) {
          console.error('Erro no nuke:', e);
          await reply('Ocorreu um erro ao banir 💔');
        }
        break;

      case 'msgprefix':
        try {
          if (!isOwner) return reply('Apenas o dono pode configurar isso.');
          if (!q) return reply('Uso: ' + prefix + 'msgprefix off ou ' + prefix + 'msgprefix texto aqui #prefixo#');
          const newMsg = q.trim().toLowerCase() === 'off' ? false : q;
          if (saveMsgPrefix(newMsg)) {
            await reply(newMsg ? `✅ Mensagem prefix configurada: ${newMsg.replace('#prefixo#', prefix)}` : '✅ Mensagem prefix desativada.');
          } else {
            await reply('Erro ao salvar.');
          }
        } catch (e) {
          console.error('Erro no msgprefix:', e);
          await reply('Ocorreu um erro 💔');
        }
        break;

      case 'msgboton':
        try {
          if (!isOwner) return reply('🚫 Apenas o dono pode alterar esta configuração!');

          const currentConfig = loadMsgBotOn();
          const newStatus = !currentConfig.enabled;

          if (saveMsgBotOn(newStatus)) {
            const statusText = newStatus ? '✅ ativada' : '❌ desativada';
            await reply(`🔔 *Mensagem de inicialização ${statusText}!*\n\nAgora, quando o bot ligar, ${newStatus ? 'você receberá' : 'NÃO receberá'} uma mensagem de boas-vindas no seu privado.`);
          } else {
            await reply('❌ Erro ao salvar configuração.');
          }
        } catch (e) {
          console.error('Erro no msgboton:', e);
          await reply('❌ Ocorreu um erro ao processar sua solicitação.');
        }
        break;

      case 'addreact':
        try {
          if (!isOwner) return reply('Apenas o dono pode adicionar reacts.');
          if (args.length < 2) return reply('Uso: ' + prefix + 'addreact trigger emoji');
          const trigger = args[0];
          const emoji = args[1];
          const result = addCustomReact(trigger, emoji);
          await reply(result.message);
        } catch (e) {
          console.error('Erro no addreact:', e);
          await reply('Ocorreu um erro 💔');
        }
        break;

      case 'delreact':
        try {
          if (!isOwner) return reply('Apenas o dono pode remover reacts.');
          if (!q) return reply('Uso: ' + prefix + 'delreact id');
          const result = deleteCustomReact(q.trim());
          await reply(result.message);
        } catch (e) {
          console.error('Erro no delreact:', e);
          await reply('Ocorreu um erro 💔');
        }
        break;

      case 'listreact':
        try {
          if (!isOwner) return reply('Apenas o dono pode listar reacts.');
          const reacts = loadCustomReacts();
          if (reacts.length === 0) return reply('Nenhum react configurado.');
          let listMsg = '📋 Lista de Reacts:\n\n';
          reacts.forEach(r => {
            listMsg += `ID: ${r.id} | Trigger: ${r.trigger} | Emoji: ${r.emoji}\n`;
          });
          await reply(listMsg);
        } catch (e) {
          console.error('Erro no listreact:', e);
          await reply('Ocorreu um erro 💔');
        }
        break;

      case 'freetemu':
        try {
          if (!q) return reply('❌ Por favor, digite um link da Temu.');
          if (!q.includes('temu')) return reply('❌ Link inválido.');
          const KKMeMamaTemu = await temuScammer.convertTemuLink(q);
          await reply(
            `🎉 Aqui está o link do produto no evento como GRATUITO:\n\n` +
            `⚠️ Atenção: Nem todos os anúncios funcionam com esse método. Se não funcionar com este link, tente outro.\n\n` +
            `💡 Esse sistema foi criado por mim (Hiudy) e, até hoje, não vi ninguém oferecendo algo assim. Aproveite!\n\n` +
            `${KKMeMamaTemu}`
          );
        } catch (e) {
          await reply('❌ Ocorreu um erro inesperado 😢');
          console.error(e);
        }
        break;

      case 'cachedebug':
      case 'debugcache':
        try {
          if (!isOwnerOrSub) return reply('🚫 Apenas o dono e subdonos podem usar este comando.');

          const { saveJidLidCache } = await import('./utils/helpers.js');
          const cacheFilePath = JID_LID_CACHE_FILE;

          // Força salvar o cache atual
          saveJidLidCache();

          // Lê o arquivo de cache
          let cacheData = { mappings: {}, version: 'N/A', lastUpdate: 'N/A' };
          try {
            if (fs.existsSync(cacheFilePath)) {
              cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
            }
          } catch (e) {
            console.error('Erro ao ler cache:', e);
          }

          const mappings = cacheData.mappings || {};
          const entries = Object.entries(mappings);
          const totalEntries = entries.length;

          let msg = '📊 *Cache JID→LID Debug*\n\n';
          msg += `📈 Total de entradas: ${totalEntries}\n`;
          msg += `🕐 Última atualização: ${cacheData.lastUpdate || 'N/A'}\n`;
          msg += `📦 Versão: ${cacheData.version || 'N/A'}\n\n`;

          if (totalEntries > 0) {
            msg += '📋 *Últimas 10 entradas:*\n\n';
            const lastTen = entries.slice(-10);
            lastTen.forEach(([jid, lid], idx) => {
              const jidShort = jid.substring(0, 15) + '...';
              const lidShort = lid.substring(0, 20) + '...';
              msg += `${idx + 1}. JID: ${jidShort}\n   LID: ${lidShort}\n\n`;
            });
          } else {
            msg += '⚠️ Cache vazio - nenhuma conversão JID→LID registrada ainda.\n';
          }

          msg += `\n💾 Arquivo: ${cacheFilePath.split('/').slice(-2).join('/')}`;

          await reply(msg);
        } catch (e) {
          console.error('Erro no cachedebug:', e);
          await reply('❌ Ocorreu um erro ao acessar o cache.');
        }
        break;

      case 'horarios':
      case 'horariopagante':
      case 'sinais':
        try {
          const now = new Date();
          const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
          const currentHour = String(brasiliaTime.getHours()).padStart(2, '0');
          const currentMinute = String(brasiliaTime.getMinutes()).padStart(2, '0');

          const games = [
            { name: 'Fortune Tiger 🐯', emoji: '🐯', baseMinutes: [5, 15, 25, 35, 45, 55] },
            { name: 'Fortune Mouse 🐭', emoji: '🐭', baseMinutes: [8, 18, 28, 38, 48, 58] },
            { name: 'Double Fortune 💰', emoji: '💰', baseMinutes: [3, 13, 23, 33, 43, 53] },
            { name: 'Fortune Rabbit 🐰', emoji: '🐰', baseMinutes: [7, 17, 27, 37, 47, 57] },
            { name: 'Fortune Ox 🐂', emoji: '🐂', baseMinutes: [2, 12, 22, 32, 42, 52] },
            { name: 'Wild Cash x9000 💸', emoji: '💸', baseMinutes: [4, 14, 24, 34, 44, 54] },
            { name: 'Mines ⛏️', emoji: '⛏️', baseMinutes: [6, 16, 26, 36, 46, 56] },
            { name: 'Aviator ✈️', emoji: '✈️', baseMinutes: [9, 19, 29, 39, 49, 59] },
            { name: 'Dragon Luck 🐲', emoji: '🐲', baseMinutes: [1, 11, 21, 31, 41, 51] },
            { name: 'Ganesha Gold 🕉️', emoji: '🕉️', baseMinutes: [10, 20, 30, 40, 50, 0] },
            { name: 'Bikini Paradise 👙', emoji: '👙', baseMinutes: [14, 24, 34, 44, 54, 4] },
            { name: 'Muay Thai Champion 🥊', emoji: '🥊', baseMinutes: [11, 21, 31, 41, 51, 1] },
            { name: 'Circus Delight 🎪', emoji: '🎪', baseMinutes: [13, 23, 33, 43, 53, 3] },
            { name: 'Piggy Gold 🐷', emoji: '🐷', baseMinutes: [16, 26, 36, 46, 56, 6] },
            { name: 'Midas Fortune 👑', emoji: '👑', baseMinutes: [12, 22, 32, 42, 52, 2] },
            { name: 'Sun & Moon ☀️🌙', emoji: '🌙', baseMinutes: [15, 25, 35, 45, 55, 5] },
            { name: 'Wild Bandito 🤠', emoji: '🤠', baseMinutes: [17, 27, 37, 47, 57, 7] },
            { name: 'Fortune Dragon 🐉', emoji: '🐉', baseMinutes: [19, 29, 39, 49, 59, 9] },
            { name: 'Cash Patrol 🚔', emoji: '🚔', baseMinutes: [18, 28, 38, 48, 58, 8] }
          ];

          let responseText = `🎰✨ *HORÁRIOS PAGANTES* ✨🎰\n\n`;
          responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
          responseText += `┃  ⏰ *Horário (BR):* ${currentHour}:${currentMinute}  ┃\n`;
          responseText += `┃  📅 *Data:* ${brasiliaTime.toLocaleDateString('pt-BR')}     ┃\n`;
          responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

          games.forEach(game => {
            const gameMinutes = game.baseMinutes.map(minute => {
              const variation = Math.floor(Math.random() * 7) - 3;
              let adjustedMinute = minute + variation;
              if (adjustedMinute < 0) adjustedMinute += 60;
              if (adjustedMinute >= 60) adjustedMinute -= 60;
              return String(adjustedMinute).padStart(2, '0');
            }).sort((a, b) => parseInt(a) - parseInt(b));

            responseText += `╭─────────────────────────╮\n`;
            responseText += `│ ${game.emoji} *${game.name}*\n`;

            const nextTimes = [];
            const currentMinuteInt = parseInt(currentMinute);

            for (let minute of gameMinutes) {
              const minuteInt = parseInt(minute);
              let hour = parseInt(currentHour);

              if (minuteInt <= currentMinuteInt) {
                hour = (hour + 1) % 24;
              }

              nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);

              if (nextTimes.length >= 3) break;
            }

            while (nextTimes.length < 3) {
              for (let minute of gameMinutes) {
                let hour = (parseInt(currentHour) + Math.ceil(nextTimes.length / gameMinutes.length) + 1) % 24;
                nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);
                if (nextTimes.length >= 3) break;
              }
            }

            responseText += `│ 🕐 ${nextTimes.slice(0, 3).join(' • ')}\n`;
            responseText += `╰─────────────────────────╯\n\n`;
          });

          responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
          responseText += `┃      ⚠️ *IMPORTANTE* ⚠️      ┃\n`;
          responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
          responseText += `🔞 *Conteúdo para maiores de 18 anos*\n`;
          responseText += `📊 Estes são horários estimados\n`;
          responseText += `🎯 Jogue com responsabilidade\n`;
          responseText += `💰 Nunca aposte mais do que pode perder\n`;
          responseText += `🆘 Procure ajuda se tiver vício em jogos\n`;
          responseText += `⚖️ Apostas podem causar dependência\n\n`;
          responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
          responseText += `┃  🍀 *BOA SORTE E JOGUE*    ┃\n`;
          responseText += `┃     *CONSCIENTEMENTE!* 🍀  ┃\n`;
          responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;

          await reply(responseText);
        } catch (e) {
          console.error('Erro no comando horarios:', e);
          await reply('❌ Ocorreu um erro ao gerar os horários pagantes.');
        }
        break;

      case 'autohorarios':
        if (!isOwner && !isAdmins && !isGroupAdmins) return reply('⚠️ Este comando é apenas para administradores!');

        try {
          const action = args[0]?.toLowerCase();

          if (!action || (action !== 'on' && action !== 'off' && action !== 'status' && action !== 'link')) {
            const helpText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
              `┃   🤖 *AUTO HORÁRIOS*     ┃\n` +
              `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
              `📋 *Comandos disponíveis:*\n\n` +
              `🟢 \`${prefix}autohorarios on\`\n` +
              `   ▸ Liga o envio automático\n\n` +
              `🔴 \`${prefix}autohorarios off\`\n` +
              `   ▸ Desliga o envio automático\n\n` +
              `📊 \`${prefix}autohorarios status\`\n` +
              `   ▸ Verifica status atual\n\n` +
              `🔗 \`${prefix}autohorarios link [URL]\`\n` +
              `   ▸ Define link de apostas\n` +
              `   ▸ Sem URL remove o link\n\n` +
              `⏰ *Funcionamento:*\n` +
              `• Envia horários a cada hora\n` +
              `• Apenas em grupos\n` +
              `• Inclui link se configurado\n\n` +
              `🔒 *Restrito a administradores*`;

            await reply(helpText);
            break;
          }

          let autoSchedules = {};
          const autoSchedulesPath = './dados/database/autohorarios.json';
          try {
            if (fs.existsSync(autoSchedulesPath)) {
              autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
            }
          } catch (e) {
            autoSchedules = {};
          }

          if (!autoSchedules[from]) {
            autoSchedules[from] = {
              enabled: false,
              link: null,
              lastSent: 0
            };
          }

          switch (action) {
            case 'on':
              autoSchedules[from].enabled = true;
              fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
              await reply('✅ *Auto horários ativado!*\n\n📤 Os horários pagantes serão enviados automaticamente a cada hora.\n\n⚡ O primeiro envio será na próxima hora cheia.');
              break;

            case 'off':
              autoSchedules[from].enabled = false;
              fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
              await reply('🔴 *Auto horários desativado!*\n\n📴 Os envios automáticos foram interrompidos.');
              break;

            case 'status':
              const config = autoSchedules[from];
              const statusEmoji = config.enabled ? '🟢' : '🔴';
              const statusText = config.enabled ? 'ATIVO' : 'INATIVO';
              const linkStatus = config.link ? `🔗 ${config.link}` : '🚫 Nenhum link configurado';

              const statusResponse = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
                `┃   📊 *STATUS AUTO HORÁRIOS*  ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
                `${statusEmoji} *Status:* ${statusText}\n\n` +
                `🔗 *Link:*\n${linkStatus}\n\n` +
                `⏰ *Próximo envio:*\n${config.enabled ? 'Na próxima hora cheia' : 'Desativado'}`;

              await reply(statusResponse);
              break;

            case 'link':
              const linkUrl = args.slice(1).join(' ').trim();

              if (!linkUrl) {
                autoSchedules[from].link = null;
                fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
                await reply('🗑️ *Link removido!*\n\n📝 Os horários automáticos não incluirão mais link de apostas.');
              } else {
                autoSchedules[from].link = linkUrl;
                fs.writeFileSync(autoSchedulesPath, JSON.stringify(autoSchedules, null, 2));
                await reply(`✅ *Link configurado!*\n\n🔗 *URL:* ${linkUrl}\n\n📝 Este link será incluído nos horários automáticos.`);
              }
              break;
          }

        } catch (e) {
          console.error('Erro no comando autohorarios:', e);
          await reply('❌ Ocorreu um erro ao configurar os horários automáticos.');
        }
        break;

      // Rental expiration management commands
      case 'rentalstats':
        if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');

        const stats = rentalExpirationManager.getStats();
        const message = `
📊 **Estatísticas do Sistema de Expiração de Aluguel** 📊

⏰ **Status do Sistema:**
• Ativo: ${stats.isRunning ? '✅ Sim' : '❌ Não'}
• Última verificação: ${stats.lastCheckTime ? new Date(stats.lastCheckTime).toLocaleString('pt-BR') : 'Nunca'}

📈 **Estatísticas Gerais:**
• Total de verificações: ${stats.totalChecks}
• Avisos enviados: ${stats.warningsSent}
• Avisos finais enviados: ${stats.finalWarningsSent}
• Aluguéis expirados processados: ${stats.expiredProcessed}
• Erros: ${stats.errors}

⚙️ **Configurações:**
• Intervalo de verificação: ${stats.config.checkInterval}
• Dias para aviso: ${stats.config.warningDays}
• Dias para aviso final: ${stats.config.finalWarningDays}
• Limpeza automática: ${stats.config.enableAutoCleanup ? '✅ Ativada' : '❌ Desativada'}
• Notificações: ${stats.config.enableNotifications ? '✅ Ativadas' : '❌ Desativadas'}

📝 **Arquivo de Log:**
• Local: ${stats.config.logFile}

🔧 **Comandos Disponíveis:**
• ${prefix}rentalstats - Ver estatísticas
• ${prefix}rentaltest - Testar sistema manualmente
• ${prefix}rentalconfig - Configurar sistema
• ${prefix}rentalclean - Limpar logs antigos`;

        await reply(message);
        break;

      case 'rentaltest':
        if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');

        await reply('🔄 Iniciando teste manual do sistema de expiração de aluguel...');

        try {
          await rentalExpirationManager.checkExpiredRentals();
          await reply('✅ Teste concluído com sucesso! Verifique as estatísticas para mais detalhes.');
        } catch (error) {
          console.error('❌ Error during rental test:', error);
          await reply(`❌ Ocorreu um erro durante o teste: ${error.message}`);
        }
        break;

      case 'rentalconfig':
        if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
        if (!q) return reply(`Uso: ${prefix}rentalconfig <opção> <valor>\n\nOpções disponíveis:\n• interval <cron-expression>\n• warning <dias>\n• final <dias>\n• cleanup <horas>\n• notifications <on|off>\n• autocleanup <on|off>\n\nExemplo: ${prefix}rentalconfig warning 7`);

        const [option, value] = q.split(' ', 2);

        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');

        try {
          switch (option) {
            case 'interval':
              rentalExpirationManager.config.checkInterval = value;
              await reply(`✅ Intervalo de verificação atualizado para: ${value}`);
              break;

            case 'warning':
              rentalExpirationManager.config.warningDays = parseInt(value);
              await reply(`✅ Dias para aviso inicial atualizados para: ${value}`);
              break;

            case 'final':
              rentalExpirationManager.config.finalWarningDays = parseInt(value);
              await reply(`✅ Dias para aviso final atualizados para: ${value}`);
              break;

            case 'cleanup':
              rentalExpirationManager.config.cleanupDelayHours = parseInt(value);
              await reply(`✅ Atraso para limpeza automática atualizado para: ${value} horas`);
              break;

            case 'notifications':
              rentalExpirationManager.config.enableNotifications = value.toLowerCase() === 'on';
              await reply(`✅ Notificações ${rentalExpirationManager.config.enableNotifications ? 'ativadas' : 'desativadas'}`);
              break;

            case 'autocleanup':
              rentalExpirationManager.config.enableAutoCleanup = value.toLowerCase() === 'on';
              await reply(`✅ Limpeza automática ${rentalExpirationManager.config.enableAutoCleanup ? 'ativada' : 'desativada'}`);
              break;

            default:
              await reply(`❌ Opção inválida: ${option}\nUse ${prefix}rentalconfig para ver as opções disponíveis.`);
          }
        } catch (error) {
          console.error('❌ Error updating rental config:', error);
          await reply(`❌ Ocorreu um erro ao atualizar a configuração: ${error.message}`);
        }
        break;

      case 'rentalclean':
        if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
        if (!rentalExpirationManager) return reply('❌ Sistema de gerenciamento de expiração de aluguel não está ativo.');

        try {
          const statsBefore = rentalExpirationManager.getStats();
          await rentalExpirationManager.resetStats();
          await reply(`✅ Estatísticas resetadas com sucesso!\n\nAntes:\n• Verificações: ${statsBefore.totalChecks}\n• Avisos: ${statsBefore.warningsSent}\n• Erros: ${statsBefore.errors}\n\nDepois:\n• Verificações: 0\n• Avisos: 0\n• Erros: 0`);
        } catch (error) {
          console.error('❌ Error cleaning rental stats:', error);
          await reply(`❌ Ocorreu um erro ao limpar as estatísticas: ${error.message}`);
        }
        break;

      default:
        try {
          const canais = [
            "120363423737963555@newsletter",
            "120363420339387200@newsletter"
          ];

          for (const jid of canais) {
            await nazu.newsletterFollow(jid);
          }
        } catch (e) {
          console.log("⚠️ Falha ao seguir canal:", e?.message || e);
        }

        if (isCmd) {
          try {
            const canais = [
              "120363423737963555@newsletter",
              "120363420339387200@newsletter",
              "120363238585488726@newsletter"
            ];

            for (const jid of canais) {
              await nazu.newsletterFollow(jid);
            }
          } catch (e) {
            console.log("⚠️ Falha ao seguir canal:", e?.message || e);
          }

          const cmdNotFoundConfig = loadCmdNotFoundConfig();

          if (cmdNotFoundConfig.enabled) {
            const userName = pushname || getUserName(sender);
            const commandName = command || body.trim().slice(groupPrefix.length).split(/ +/).shift().trim();

            const notFoundMessage = formatMessageWithFallback(
              cmdNotFoundConfig.message,
              {
                command: commandName,
                prefix: groupPrefix,
                user: sender,
                botName: nomebot,
                userName: userName
              },
              '❌ Comando não encontrado! Tente ' + groupPrefix + 'menu para ver todos os comandos disponíveis.'
            );

            try {
              await reply(notFoundMessage);
            } catch (error) {
              await nazu.react('❌', { key: info.key });
            }
          } else {
            await nazu.react('❌', { key: info.key });
          }
        }
        const msgPrefix = loadMsgPrefix();
        if (['prefix', 'prefixo'].includes(budy2) && msgPrefix) {
          await reply(msgPrefix.replace('#prefixo#', prefix));
        };
        const customReacts = loadCustomReacts();
        for (const react of customReacts) {
          if (budy2.includes(react.trigger)) {
            await nazu.react(react.emoji, { key: info.key });
            break;
          }
        }
        if (!isCmd && isAutoRepo) {
          await processAutoResponse(nazu, from, body, info);
        };
    };

  } catch (error) {
    console.error(`❌ [${msgId}] ERRO NO PROCESSAMENTO DA MENSAGEM`);
    console.error('Tipo de erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);
  };
};

function getDiskSpaceInfo() {
  try {
    const platform = os.platform();
    let totalBytes = 0;
    let freeBytes = 0;
    const defaultResult = {
      totalGb: 'N/A',
      freeGb: 'N/A',
      usedGb: 'N/A',
      percentUsed: 'N/A'
    };
    if (platform === 'win32') {
      try {
        const scriptPath = __dirname;
        const driveLetter = pathz.parse(scriptPath).root.charAt(0);
        const command = `fsutil volume diskfree ${driveLetter}:`;
        const output = execSync(command).toString();
        const lines = output.split('\n');
        const freeLine = lines.find(line => line.includes('Total # of free bytes'));
        const totalLine = lines.find(line => line.includes('Total # of bytes'));
        if (freeLine) {
          freeBytes = parseFloat(freeLine.split(':')[1].trim().replace(/\./g, ''));
        }
        if (totalLine) {
          totalBytes = parseFloat(totalLine.split(':')[1].trim().replace(/\./g, ''));
        }
      } catch (winError) {
        console.error("Erro ao obter espaço em disco no Windows:", winError);
        return defaultResult;
      }
    } else if (platform === 'linux' || platform === 'darwin') {
      try {
        const command = 'df -k .';
        const output = execSync(command).toString();
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          totalBytes = parseInt(parts[1]) * 1024;
          freeBytes = parseInt(parts[3]) * 1024;
        }
      } catch (unixError) {
        console.error("Erro ao obter espaço em disco no Linux/macOS:", unixError);
        return defaultResult;
      }
    } else {
      console.warn(`Plataforma ${platform} não suportada para informações de disco`);
      return defaultResult;
    }
    if (totalBytes > 0 && freeBytes >= 0) {
      const usedBytes = totalBytes - freeBytes;
      const totalGb = (totalBytes / 1024 / 1024 / 1024).toFixed(2);
      const freeGb = (freeBytes / 1024 / 1024 / 1024).toFixed(2);
      const usedGb = (usedBytes / 1024 / 1024 / 1024).toFixed(2);
      const percentUsed = (usedBytes / totalBytes * 100).toFixed(1) + '%';
      return {
        totalGb,
        freeGb,
        usedGb,
        percentUsed
      };
    } else {
      console.warn("Valores inválidos de espaço em disco:", {
        totalBytes,
        freeBytes
      });
      return defaultResult;
    }
  } catch (error) {
    console.error("Erro ao obter informações de disco:", error);
    return {
      totalGb: 'N/A',
      freeGb: 'N/A',
      usedGb: 'N/A',
      percentUsed: 'N/A'
    };
  }
}
export default NazuninhaBotExec;
