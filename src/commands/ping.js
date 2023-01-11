const { SlashCommandBuilder } = require('discord.js');
import { log_server } from "../util";
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		log_server(`[${interaction.guild.name}:${interaction.user.username}] used ping`);
		await interaction.reply('Pong!');
	},
};