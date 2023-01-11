const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus, joinVoiceChannel } = require("@discordjs/voice");
const discordTTS = require('discord-tts');
import { log_server, sleep } from "./util";
const queueMap = new Map();
const add_tts = async (interaction, client) => {
    if(!interaction || !client) {
        interaction.reply({ content: '🚫 Discord 서버와의 통신에 오류가 발생했습니다.' });
        return;
    }
    if(!interaction.member.voice.channel) {
        interaction.reply({ content: '🚫 tts 기능을 사용하기 위해서는 음성 채널에 참가해야 합니다.' });
        return;
    }
    if(interaction.options.getString('text').length >= 200) {
        interaction.reply({ content: 'text는 200글자 미만이어야 합니다.', ephemeral: true });
        return;
    }

    let serverQueue = queueMap.get(interaction.guild.id)
    try {
        if(!serverQueue){
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            const player = createAudioPlayer();
            player.on('error', error => {
                speak_next(interaction, client);
            });
            player.on(AudioPlayerStatus.Idle, () => {
                speak_next(interaction, client);
            });
            connection.subscribe(player);
            serverQueue = {
                tts_queue: [],
                player: player,
                connection: connection
            }
            queueMap.set(interaction.guild.id, serverQueue);
            serverQueue.tts_queue.push(interaction.options.getString('text'));
            interaction.reply({ content: 'TTS added!', ephemeral: true });
            speak_tts(interaction);
            return;
        }
    } catch (error) {
        console.log(error);
    }
    if(interaction.member.voice.channel.id != serverQueue.connection.joinConfig.channelId) {
        interaction.reply({ content: '🚫 봇이 이미 사용중입니다.' });
        return;
    }
    serverQueue.tts_queue.push(interaction.options.getString('text'));
    interaction.reply({ content: 'TTS added!', ephemeral: true });
}

const speak_tts = async (interaction, client) => {
    let serverQueue = queueMap.get(interaction.guild.id);
    if(!serverQueue) {
        log_server("Cannot find Queue at funcion SPEAK_TTS");
        interaction.reply({ content: `🚫 서버의 재생목록을 찾지 못 했습니다.` });
        return;
    }
    const tts_text = serverQueue.tts_queue[0];
    const player = serverQueue.player;
    try {
        const tts_stream=discordTTS.getVoiceStream(tts_text);
        const resource=createAudioResource(tts_stream, {inputType: StreamType.Arbitrary, inlineVolume:true});
        resource.volume.setVolume(0.1);
        player.play(resource);
    } catch (error) {
        speak_next(interaction, client);
        console.log(error);
    }
}

const speak_next = async (interaction, client) => {
    let serverQueue = queueMap.get(interaction.guild.id)
    if(serverQueue) {
        serverQueue.tts_queue.shift();
        if (serverQueue.tts_queue.length == 0) {
            for(let i = 0; i < 600; i++) {
                await sleep(1000);
                let tmpServerQueue = queueMap.get(interaction.guild.id);
                if(!tmpServerQueue) return;
                if(tmpServerQueue.tts_queue.length > 0) {
                    tmpServerQueue.tts_queue.unshift("Dummy");
                    speak_next(interaction, client);
                    return;
                }
            }
            serverQueue.player.stop();
            serverQueue.connection.destroy();
            queueMap.delete(interaction.guild.id);
        } else {
            speak_tts(interaction, client);
        }
    }
}

module.exports = { add_tts };