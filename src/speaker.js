const { createAudioResource, createAudioPlayer, StreamType, AudioPlayerStatus, joinVoiceChannel } = require("@discordjs/voice");
import discordTTS  from "discord-tts";
import * as googleTTS from 'google-tts-api';
import fs, {createReadStream} from "fs"
import cld from "cld"
import { log_server, sleep } from "./util";

const queueMap = new Map();
const add_tts = async (interaction, client) => {
    if(!interaction || !client) {
        interaction.reply({ content: '🚫 Discord 서버와의 통신에 오류가 발생했습니다.', ephemeral: true });
        return;
    }
    if(!interaction.member.voice.channel) {
        interaction.reply({ content: '🚫 tts 기능을 사용하기 위해서는 음성 채널에 참가해야 합니다.', ephemeral: true });
        return;
    }
    
    const parsedArray = await parseStringUnder200(interaction.options.getString('text'));
    if(!parsedArray) {
        interaction.reply({ content: '한 단어는 190글자 미만이어야 합니다.', ephemeral: true });
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
                connection: connection,
                filePath: interaction.guild.id
            }
            queueMap.set(interaction.guild.id, serverQueue);
            serverQueue.tts_queue.push(...parsedArray);
            interaction.reply({ content: 'TTS added!', ephemeral: true });
            speak_tts(interaction);
            return;
        }
    } catch (error) {
        console.log(error);
    }
    if(interaction.member.voice.channel.id != serverQueue.connection.joinConfig.channelId) {
        interaction.reply({ content: '🚫 봇이 이미 사용중입니다.', ephemeral: true });
        return;
    }
    serverQueue.tts_queue.push(...parsedArray);
    interaction.reply({ content: 'TTS added!', ephemeral: true });
}

const parseStringUnder200 = async (text) => {
    const result = [];
    const splitText = text.split(" ");

    for(let i = 0; i < splitText.length; i++) {
        if(splitText[i].length >= 200) {
            log_server("Word length is over 200");
            return null;
        }
    }

    let tmp = ""
    for(let i = 0; i < splitText.length; i++) {
        if(tmp.length + splitText[i].length >= 190) {
            result.push(tmp);
            tmp = "";
        }
        tmp += (splitText[i] + " ");
    }
    if(tmp != "") {
        result.push(tmp.slice(0, -1));
    }

    for(let i = 0; i < result.length; i++) {
        if(result[i].length >= 200) {
            log_server("Parse Method Error");
            return null;
        }
    }
    return result;
}

const speak_tts = async (interaction, client) => {
    let serverQueue = queueMap.get(interaction.guild.id);
    if(!serverQueue) {
        log_server("Cannot find Queue at funcion SPEAK_TTS");
        interaction.reply({ content: `🚫 서버의 재생목록을 찾지 못 했습니다.`, ephemeral: true });
        return;
    }
    const tts_text = serverQueue.tts_queue[0];
    const player = serverQueue.player;
    const tts_file = `./voice/${interaction.guild.id}.mp3`;

    let TTStype = false;
    try {
        TTStype = await makeTTSFile(interaction, tts_text);
    } catch (error) {
        TTStype = false;
    }

    let tts_stream, resource;
    try {
        if(TTStype) {
            resource = createAudioResource(createReadStream(tts_file), {inlineVolume:true});
            log_server(`[${interaction.guild.name}] speaking => [${TTStype}:${tts_text}]`);
        } else {
            log_server(`[${interaction.guild.name}] speaking => [DiscordAPI:${tts_text}]`);
            tts_stream = await discordTTS.getVoiceStream(tts_text);
            resource = createAudioResource(tts_stream, {inputType: StreamType.Arbitrary, inlineVolume:true});
        }
        resource.volume.setVolume(1);
        player.play(resource);
    } catch (error) {
        speak_next(interaction, client);
        console.log(error);
    }
}

const makeTTSFile = async (interaction, text) => {    
    let language;
    try {
        language = (await cld.detect(text)).languages[0].code;
    } catch (error) {
        log_server('Language specify miss');
        return false;
    }

    let base64TTS;
    try {
        base64TTS = await googleTTS.getAudioBase64(text, {
            lang: language,
            slow: false,
            timeout: 10000,
        });
    } catch (error) {
        log_server('google tts api error');
        console.log(error);
        return false;
    }

    try {
        const filename = `./voice/${interaction.guild.id}.mp3`;
        const fileContents = Buffer.from(base64TTS, 'base64');
        await fs.writeFileSync(filename, fileContents);
    } catch (error) {
        log_server('save mp3 file error');
        log_server(error);
        return false;
    }
    return language;
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

const leave = async (interaction, client) => {
    if(!interaction || !client) {
        interaction.reply({ content: '🚫 Discord 서버와의 통신에 오류가 발생했습니다.', ephemeral: true  });
        return;
    }
    let serverQueue = queueMap.get(interaction.guild.id);
    if(!serverQueue) {
        interaction.reply({content: "🚫 현재 음성 채팅 방에 참가 중이지 않습니다.", ephemeral: true });
        return;
    }
    try {
        log_server(`[${interaction.guild.name}:${interaction.user.username}] used leave`);
        interaction.reply({content: "🛏", ephemeral: true });
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queueMap.delete(interaction.guild.id);
    } catch (error) {
        log_server(`[${interaction.guild.name}:${interaction.user.username}] can't leave`);
        log_server(error);
    }
}

module.exports = { add_tts, leave };