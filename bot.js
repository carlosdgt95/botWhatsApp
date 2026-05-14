// ============================================
// 🤖 BOT WHATSAPP - Menú Atención al Cliente
// ============================================
// Instalación: npm install whatsapp-web.js qrcode-terminal
// Uso: node bot.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

// ── Estado de cada usuario ──────────────────
const sesiones = {};

// ── Textos del bot ──────────────────────────
const MENU_PRINCIPAL = `👋 ¡Hola! Bienvenido a *Soporte XYZ* 

Por favor elige una opción:

1️⃣  Consultar estado de mi pedido
2️⃣  Reportar un problema
3️⃣  Horarios y contacto
4️⃣  Hablar con un agente
0️⃣  Salir

_Responde con el número de tu opción_`;

const MENU_PROBLEMA = `🔧 *¿Qué tipo de problema tienes?*

1️⃣  Producto dañado o defectuoso
2️⃣  No recibí mi pedido
3️⃣  Cobro incorrecto
4️⃣  Otro problema

0️⃣  ← Volver al menú principal`;

// ── FILTRO PRINCIPAL ────────────────────────
function debeIgnorar(msg) {
    if (msg.fromMe) return true;
    if (!msg.from) return true;
    if (msg.from.endsWith('@g.us')) return true;
    if (msg.from.endsWith('@broadcast')) return true;
    if (msg.from === 'status@broadcast') return true;
    if (msg.type === 'e2e_notification') return true;
    if (msg.type === 'notification_template') return true;
    return false;
}

// ── Función principal del flujo ─────────────
async function manejarMensaje(msg) {
    if (debeIgnorar(msg)) return;

    const chatId = msg.from;
    const texto = msg.body.trim();

    if (!sesiones[chatId]) {
        sesiones[chatId] = { paso: 'inicio', datos: {} };
    }

    const sesion = sesiones[chatId];

    const palabrasInicio = ['hola', 'inicio', 'menu', 'menú', 'start', 'hi', 'buenos días', 'buenas'];
    if (palabrasInicio.some(p => texto.toLowerCase().includes(p))) {
        sesiones[chatId] = { paso: 'menu_principal', datos: {} };
        return await msg.reply(MENU_PRINCIPAL);
    }

    switch (sesion.paso) {

        case 'inicio':
            sesiones[chatId].paso = 'menu_principal';
            await msg.reply(MENU_PRINCIPAL);
            break;

        case 'menu_principal':
            switch (texto) {
                case '1':
                    sesion.paso = 'pedir_numero_pedido';
                    await msg.reply('📦 *Consulta de pedido*\n\nPor favor escribe tu *número de pedido*:');
                    break;
                case '2':
                    sesion.paso = 'menu_problema';
                    await msg.reply(MENU_PROBLEMA);
                    break;
                case '3':
                    await msg.reply(
                        `🕐 *Horarios de atención*\n\n` +
                        `Lunes a Viernes: 8:00 - 18:00\n` +
                        `Sábados: 9:00 - 13:00\n\n` +
                        `📧 soporte@xyz.com\n` +
                        `📞 +593 99 999 9999\n\n` +
                        `Escribe *menú* para volver al inicio.`
                    );
                    break;
                case '4':
                    sesion.paso = 'esperando_agente';
                    await msg.reply(
                        `👤 *Conectando con un agente...*\n\n` +
                        `Un agente estará contigo en breve.\n` +
                        `Tiempo estimado: *5-10 minutos*\n\n` +
                        `Mientras esperas, ¿puedes describir tu consulta?`
                    );
                    break;
                case '0':
                    sesiones[chatId] = { paso: 'inicio', datos: {} };
                    await msg.reply('👋 ¡Hasta luego! Escribe *hola* cuando necesites ayuda.');
                    break;
                default:
                    await msg.reply('❓ Opción no válida. Por favor elige un número del menú.\n\n' + MENU_PRINCIPAL);
            }
            break;

        case 'pedir_numero_pedido':
            sesion.datos.numeroPedido = texto;
            sesion.paso = 'menu_principal';
            await msg.reply(
                `🔍 Buscando pedido *#${texto}*...\n\n` +
                `✅ Pedido encontrado!\n` +
                `📦 Estado: *En tránsito*\n` +
                `🚚 Entrega estimada: *2-3 días hábiles*\n\n` +
                `¿Necesitas algo más?\n\n` + MENU_PRINCIPAL
            );
            break;

        case 'menu_problema':
            switch (texto) {
                case '1':
                    sesion.paso = 'describir_problema';
                    sesion.datos.tipoproblema = 'Producto dañado';
                    await msg.reply('😔 Lamentamos el inconveniente.\n\nPor favor *describe el daño*:');
                    break;
                case '2':
                    sesion.paso = 'pedir_numero_pedido_problema';
                    sesion.datos.tipoproblema = 'Pedido no recibido';
                    await msg.reply('📦 Escribe tu *número de pedido*:');
                    break;
                case '3':
                    sesion.paso = 'describir_problema';
                    sesion.datos.tipoproblema = 'Cobro incorrecto';
                    await msg.reply('💳 Escribe el *monto cobrado* y el *monto correcto*:');
                    break;
                case '4':
                    sesion.paso = 'describir_problema';
                    sesion.datos.tipoproblema = 'Otro';
                    await msg.reply('📝 *Describe tu problema* con el mayor detalle posible:');
                    break;
                case '0':
                    sesion.paso = 'menu_principal';
                    await msg.reply(MENU_PRINCIPAL);
                    break;
                default:
                    await msg.reply('❓ Opción no válida.\n\n' + MENU_PROBLEMA);
            }
            break;

        case 'describir_problema':
            sesion.datos.descripcion = texto;
            sesion.paso = 'menu_principal';
            await msg.reply(
                `✅ *Ticket creado exitosamente*\n\n` +
                `🎫 Ticket #${Math.floor(Math.random() * 90000) + 10000}\n` +
                `📋 Tipo: ${sesion.datos.tipoproblema}\n` +
                `⏱ Respuesta en: *24-48 horas hábiles*\n\n` +
                `¿Necesitas algo más?\n\n` + MENU_PRINCIPAL
            );
            break;

        case 'pedir_numero_pedido_problema':
            sesion.datos.numeroPedido = texto;
            sesion.paso = 'menu_principal';
            await msg.reply(
                `🔍 Revisando pedido *#${texto}*...\n\n` +
                `⚠️ Tu pedido presenta un retraso.\n` +
                `📞 Un agente te contactará en *2 horas*.\n\n` +
                `¿Necesitas algo más?\n\n` + MENU_PRINCIPAL
            );
            break;

        case 'esperando_agente':
            sesion.datos.mensajeParaAgente = texto;
            await msg.reply('📩 Mensaje recibido. Un agente lo verá en breve.');
            break;

        default:
            sesiones[chatId] = { paso: 'menu_principal', datos: {} };
            await msg.reply(MENU_PRINCIPAL);
    }
}

// ── Eventos del cliente ─────────────────────
client.on('qr', qr => {
    console.log('\n📱 Escanea este QR con tu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot conectado y listo!');
    console.log('💬 Solo responde a mensajes directos\n');
});

client.on('message', async msg => {
    try {
        await manejarMensaje(msg);
    } catch (err) {
        console.error('Error:', err.message);
    }
});

client.initialize();
