const { SlashCommandBuilder } = require('discord.js');
import { log_server } from "../util";
import { respondGPT } from "../chatGPT";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mint_cookie')
		.setDescription('말하는 민트 쿠키와 대화합니다.')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('민트 쿠키와 대화할 내용')
                .setRequired(true)
        ),
	async execute(interaction, client) {
		await log_server(`[${interaction.guild.name}:${interaction.user.username}] used mint_cookie => [${interaction.options.getString('content')}]`);
		//await interaction.reply('점검중!');
		await respondGPT(interaction, client);
	},
};