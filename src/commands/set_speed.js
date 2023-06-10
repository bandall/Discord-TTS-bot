const { SlashCommandBuilder } = require('discord.js');
import { log_server } from "../util";
import { set_audio_speed } from "../speaker"
module.exports = {
	data: new SlashCommandBuilder()
		.setName('speed')
		.setDescription('0.5 ~ 10.0 사이의 배속 지정이 가능합니다. 기본값: 2.0')
        .addNumberOption(option =>
            option.setName('audio_speed')
                .setDescription('분')
                .setRequired(true)
    ),
    
	async execute(interaction, client) {
        await log_server(`[${interaction.guild.name}:${interaction.user.username}] set voicee speed`);
        await set_audio_speed(interaction, client);
	},
};