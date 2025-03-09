const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');
const { Client: Selfbot } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const selfbot = new Selfbot();
const DB_PATH = path.join(__dirname, 'database.json');

// Função para carregar a DB
function loadDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Função para salvar a DB
function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Função para gerar um ID único
function generateId(db) {
    return db.length > 0 ? (Math.max(...db.map(entry => Number(entry.id))) + 1).toString() : "1";
}

bot.once('ready', async () => {
    console.log(`Bot logado como ${bot.user.tag}`);
    
    // Registrar comandos
    const commands = [
        new SlashCommandBuilder().setName('configurar_mensagens').setDescription('Configura o envio automático de mensagens'),
    ].map(command => command.toJSON());

    try {
        await bot.application.commands.set(commands);
        console.log('Comandos registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
});

selfbot.once('ready', () => {
    console.log(`Selfbot logado como ${selfbot.user.tag}`);
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'configurar_mensagens') {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_configuracao')
                .setPlaceholder('Escolha uma opção')
                .addOptions([
                    { label: 'Cadastrar Mensagem', value: 'cadastrar' },
                    { label: 'Editar Mensagem', value: 'editar' },
                    { label: 'Enviar Mensagem', value: 'enviar' }
                ])
        );
        await interaction.reply({ content: 'Selecione uma opção:', components: [row], ephemeral: true });
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'menu_configuracao') {
        if (interaction.values[0] === 'cadastrar') {
            const modal = new ModalBuilder()
                .setCustomId('modal_cadastrar')
                .setTitle('Cadastrar Mensagem')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('server_id')
                            .setLabel('ID do Servidor')
                            .setStyle(TextInputStyle.Short)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('channel_id')
                            .setLabel('ID do Canal')
                            .setStyle(TextInputStyle.Short)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('message_text')
                            .setLabel('Mensagem')
                            .setStyle(TextInputStyle.Paragraph)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('schedule_time')
                            .setLabel('Horário (HH:mm)')
                            .setStyle(TextInputStyle.Short)
                    )
                );
            await interaction.showModal(modal);
        } else if (interaction.values[0] === 'editar') {
            const db = loadDB();
            const options = db.map(entry => ({
                label: `ID ${entry.id} - ${entry.serverId || 'Não definido'}`,
                value: entry.id || 'sem_id'
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_message')
                    .setPlaceholder('Selecione a mensagem para editar')
                    .addOptions(options)
            );

            await interaction.reply({ content: 'Escolha uma mensagem para editar:', components: [row], ephemeral: true });
        }
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_message') {
        const selectedId = interaction.values[0];
        const db = loadDB();
        const messageData = db.find(entry => entry.id === selectedId);

        if (messageData) {
            const modal = new ModalBuilder()
                .setCustomId('modal_editar')
                .setTitle('Editar Mensagem')
                .addComponents(a
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('id')
                            .setLabel('ID de Cadastro')
                            .setStyle(TextInputStyle.Short)
                            .setValue(messageData.id)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('server_id')
                            .setLabel('ID do Servidor')
                            .setStyle(TextInputStyle.Short)
                            .setValue(messageData.serverId)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('channel_id')
                            .setLabel('ID do Canal')
                            .setStyle(TextInputStyle.Short)
                            .setValue(messageData.channelId)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('message_text')
                            .setLabel('Mensagem')
                            .setStyle(TextInputStyle.Paragraph)
                            .setValue(messageData.messageText)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('schedule_time')
                            .setLabel('Horário (HH:mm)')
                            .setStyle(TextInputStyle.Short)
                            .setValue(messageData.scheduleTime)
                    )
                );
            await interaction.showModal(modal);
        } else {
            await interaction.reply({ content: 'Mensagem não encontrada.', ephemeral: true });
        }
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'modal_cadastrar') {
        const db = loadDB();
        const id = generateId(db);
        const newEntry = {
            id,
            serverId: interaction.fields.getTextInputValue('server_id'),
            channelId: interaction.fields.getTextInputValue('channel_id'),
            messageText: interaction.fields.getTextInputValue('message_text'),
            scheduleTime: interaction.fields.getTextInputValue('schedule_time')
        };
        db.push(newEntry);
        saveDB(db);

        await interaction.reply({ content: 'Mensagem cadastrada com sucesso!', ephemeral: true });
    } else if (interaction.customId === 'modal_editar') {
        const db = loadDB();
        const id = interaction.fields.getTextInputValue('id');
        const index = db.findIndex(entry => entry.id === id);
        
        if (index !== -1) {
            db[index] = {
                id,
                serverId: interaction.fields.getTextInputValue('server_id'),
                channelId: interaction.fields.getTextInputValue('channel_id'),
                messageText: interaction.fields.getTextInputValue('message_text'),
                scheduleTime: interaction.fields.getTextInputValue('schedule_time')
            };
            saveDB(db);
            await interaction.reply({ content: 'Mensagem editada com sucesso!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Mensagem não encontrada para editar.', ephemeral: true });
        }
    }
});

// Agendador para enviar mensagens automaticamente
cron.schedule('* * * * *', async () => {
    const db = loadDB();
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Formato HH:mm
    
    for (const entry of db) {
        if (entry.scheduleTime === currentTime) {
            // Verifica se o selfbot está logado e tenta enviar a mensagem
            try {
                const channel = await selfbot.channels.fetch(entry.channelId).catch(() => null);
                if (channel) {
                    await channel.send(entry.messageText);
                    console.log(`Mensagem enviada para o canal ${entry.channelId}`);
                }
            } catch (error) {
                console.error(`Erro ao enviar mensagem: ${error.message}`);
            }
        }
    }
});

bot.login(process.env.TOKEN);
selfbot.login(process.env.SELFBOT_TOKEN);
