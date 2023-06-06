const { Configuration, OpenAIApi } = require("openai");
import { openai_api_key } from './config.json';
import { log_server } from "./util";

const configiration = new Configuration({
    apiKey: openai_api_key,
});

const openai = new OpenAIApi(configiration);

const embed = {
    color: 0x00FFFF,
    fields: [{
        name: '',
        value: '',
        inline: false
      },
    ],
    timestamp: new Date().toISOString(),
};

const runGPT35 = async (prompt) => {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
    });
    return {
        resMsg: (response.data.choices[0].message.content),
        tokens: response.data.usage.total_tokens
    };
};

const respondGPT = async (interaction, client) => {
    if(!interaction || !client) {
        interaction.reply({ content: '🚫 Discord 서버와의 통신에 오류가 발생했습니다.', ephemeral: true });
        return;
    }
    await interaction.deferReply();

    let retJson;
    const content = interaction.options.getString('content');
    
    try {
        retJson = await runGPT35(content);
    } catch (error) {
        log_server(error);
        await interaction.editReply({ content: '🚫 민트 쿠키가 수면 중입니다.' });
        return;
    }
    log_server("OpenAI Response:" + retJson.resMsg + "\nToken Usage: " + retJson.tokens);
    if (retJson.resMsg.length > 1023) {
        retJson = retJson.substring(0, 1023);
    } 
    embed.fields[0].name = content;
    embed.fields[0].value = retJson.resMsg;
    embed.timestamp = new Date().toISOString();
    await interaction.editReply({embeds: [embed]});
}

module.exports = { respondGPT }