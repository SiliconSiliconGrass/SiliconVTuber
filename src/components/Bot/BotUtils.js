import GlmBot from "./GlmBot";
import OllamaBot from "./OllamaBot";
import CozeBot from "./CozeBot";

export function GetBotFromConfig(botConfig) {
    /**
     * Get a bot instance from bot config
     * @param {Object} botConfig must include "type" property
     */
    let bot;
    let botType = botConfig.type;
    if (botType === 'Ollama') {
        bot = new OllamaBot(botConfig.modelName);
    } else if (botType === 'Coze') {
        bot = new CozeBot(botConfig.pat, botConfig.botID, botConfig.userID);
    } else if (botType === 'GLM') {
        bot = new GlmBot(botConfig.token, botConfig.modelName, botConfig.systemPrompt);
    }
    return bot;
}
