export default async function menu(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭━━━⊱ 🪷 *${botName}* ⊰━━━╮
┃
┃ (⁠・⁠∀⁠・⁠) Oii, #user#! 💚
┃
┃ Eu sou a ${botName}! 🌱
┃ Tem bastante coisinha escondida por aqui hehe ✨
┃
┃ ୨୧ Escolhe uma categoria abaixo
┃ pra abrir os comandos! 🫶
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗💚⭟",
    separatorIcon = "❁",
    middleBorder = "┊"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *CATEGORIAS DA VERDINHA* ${separatorIcon}
${middleBorder}${menuItemIcon}${prefix}menugeral
${middleBorder}${menuItemIcon}${prefix}menubrincadeira
${middleBorder}${menuItemIcon}${prefix}menusticker
${middleBorder}${menuItemIcon}${prefix}menualteradores
${middleBorder}${menuItemIcon}${prefix}menulogo
${middleBorder}${menuItemIcon}${prefix}menudown
${middleBorder}${menuItemIcon}${prefix}menuferramentas
${middleBorder}${menuItemIcon}${prefix}menuadm
${bottomBorder}`;
}
