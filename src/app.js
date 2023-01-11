import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import fs from "fs"
import path from "path"
import { token } from "./config.json"
import { log_server } from "./util";
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
	],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		log_server(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const handleCommand = async (interaction, command) => {
	await command.execute(interaction, client);
}

client.on(Events.InteractionCreate, async interaction => {
	if(!interaction) {
		log_server("Interaction is null", interaction);
		return;
	}
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await handleCommand(interaction, command);
	} catch (error) {
		log_server(`Error executing ${interaction.commandName}`);
		log_server(error);
	}
});

client.login(token);
client.once(Events.ClientReady, () => {
	client.user.setActivity('말하는 민트쿠키 개발');
    log_server(`🌎 Logged in as ${client.user.tag}!`);
    log_server(`🚀 Discord Bot is Listening!!`);
});
