const { SlashCommandBuilder } = require('discord.js');
import { log_server } from "../util";
import { add_tts } from "../speaker"
module.exports = {
	data: new SlashCommandBuilder()
		.setName('tts')
		.setDescription('Read Text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to read')
                .setRequired(true)
        ),
	async execute(interaction, client) {
		await log_server(`[${interaction.guild.name}:${interaction.user.username}] added tts => [${interaction.options.getString('text')}]`);
        await add_tts(interaction, client)
	},
};