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
                    { label: 'Deletar Mensagem', value: 'deletar' },
                    { label: 'Enviar Mensagem Agora', value: 'enviar' }
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
                .addComponents(
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
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'menu_configuracao') {
        if (interaction.values[0] === 'deletar') {
            const db = loadDB();
            const options = db.map(entry => ({
                label: `ID ${entry.id} - ${entry.serverId || 'Não definido'}`,
                value: entry.id || 'sem_id'
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_message_deletar')
                    .setPlaceholder('Selecione a mensagem para deletar')
                    .addOptions(options)
            );

            await interaction.reply({ content: 'Escolha uma mensagem para deletar:', components: [row], ephemeral: true });
        }
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_message_deletar') {
        const selectedId = interaction.values[0];
        const db = loadDB();
        const messageIndex = db.findIndex(entry => entry.id === selectedId);

        if (messageIndex !== -1) {
            // Deletar a mensagem da DB
            db.splice(messageIndex, 1);
            saveDB(db);

            await interaction.reply({ content: `Mensagem com ID ${selectedId} deletada com sucesso!`, ephemeral: true });
        } else {
            await interaction.reply({ content: 'Mensagem não encontrada.', ephemeral: true });
        }
    }
});


bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'menu_configuracao') {
        if (interaction.values[0] === 'enviar') {
            const db = loadDB();
            const options = db.map(entry => ({
                label: `ID ${entry.serverId || 'Não definido'}`,
                value: entry.serverId || 'sem_id'
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_servers')
                    .setPlaceholder('Escolha um ou mais servidores')
                    .addOptions(options)
                    .setMinValues(1) // Permite selecionar no mínimo um servidor
                    .setMaxValues(options.length) // Permite selecionar até todos os servidores
            );

            await interaction.reply({ content: 'Escolha os servidores para enviar a mensagem:', components: [row], ephemeral: true });
        }
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_servers') {
        const selectedServers = interaction.values; // Servidores selecionados pelo usuário

        // Pedir para o usuário digitar a mensagem que deseja enviar
        await interaction.reply({
            content: 'Por favor, envie a mensagem que deseja enviar para os servidores selecionados:',
            ephemeral: true
        });

        // Criar um filtro para capturar a mensagem do usuário
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', async (message) => {
            const userMessage = message.content.trim(); // Remover espaços em branco no início e fim

            // Verificar se a mensagem não está vazia
            if (!userMessage) {
                await interaction.followUp({ content: 'A mensagem não pode estar vazia. Tente novamente.', ephemeral: true });
                return; // Não vamos parar o coletor aqui, permitindo que o usuário tente novamente
            }

            // Enviar a mensagem para os servidores escolhidos
            for (const serverId of selectedServers) {
                try {
                    const guild = await selfbot.guilds.fetch(serverId); // Buscar o servidor pelo ID
                    const channel = guild.channels.cache.find(c => c.isText()); // Procurar o primeiro canal de texto

                    if (channel) {
                        await channel.send(userMessage); // Enviar a mensagem para o canal de texto encontrado
                    } else {
                        await interaction.followUp({ content: `Nenhum canal de texto encontrado no servidor ${serverId}.`, ephemeral: true });
                    }
                } catch (error) {
                    console.error(`Erro ao enviar mensagem para o servidor ${serverId}: ${error.message}`);
                    await interaction.followUp({ content: `Erro ao enviar mensagem para o servidor ${serverId}: ${error.message}`, ephemeral: true });
                }
            }

            // Confirmação de envio
            await interaction.followUp({ content: 'Mensagem enviada com sucesso para os servidores selecionados!', ephemeral: true });

            collector.stop(); // Parar o coletor após a primeira mensagem ser recebida
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Tempo esgotado! Nenhuma mensagem foi recebida.', ephemeral: true });
            }
        });
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_message') {
        const selectedMessageId = interaction.values[0];
        const db = loadDB();
        const messageData = db.find(entry => entry.id === selectedMessageId);

        if (messageData) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_send_message')
                    .setLabel('Enviar Mensagem')
                    .setStyle('PRIMARY')
            );

            await interaction.reply({
                content: `Você selecionou a mensagem com ID ${selectedMessageId}. Deseja enviar essa mensagem para os servidores escolhidos?`,
                components: [row],
                ephemeral: true
            });
        } else {
            await interaction.reply({ content: 'Mensagem não encontrada.', ephemeral: true });
        }
    }
});

bot.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'confirm_send_message') {
        const selectedMessageId = interaction.message.content.match(/ID (\d+)/)[1]; // Pega o ID da mensagem
        const db = loadDB();
        const messageData = db.find(entry => entry.id === selectedMessageId);

        if (messageData) {
            // Enviar a mensagem para todos os servidores selecionados
            const selectedServers = interaction.message.content.match(/ID (\d+)/)[1]; // Servidores selecionados
            for (const serverId of selectedServers) {
                try {
                    const channel = await selfbot.channels.fetch(messageData.channelId).catch(() => null);
                    if (channel) {
                        await channel.send(messageData.messageText);
                        await interaction.reply({ content: `Mensagem enviada com sucesso para o canal ${messageData.channelId}`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `Canal não encontrado para enviar a mensagem no servidor ${serverId}.`, ephemeral: true });
                    }
                } catch (error) {
                    await interaction.reply({ content: `Erro ao enviar mensagem para o servidor ${serverId}: ${error.message}`, ephemeral: true });
                }
            }
        } else {
            await interaction.reply({ content: 'Mensagem não encontrada para enviar.', ephemeral: true });
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
