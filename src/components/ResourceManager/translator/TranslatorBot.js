import AbstractTranslator from "./AbstractTranslator";
import { GetBotFromConfig } from "@/components/Bot/BotUtils";

const DEFAULT_TRANSLATION_PROMPT = `
你是一个翻译机器人，将输入的内容全部翻译成中文
注意要翻译的文本会分批输入，翻译的时候需要结合上文语境
可以有创造力一些，不要输出多余信息
再次强调：输出中文翻译结果，不要输出其他信息！
`;

export default class TranslatorBot extends AbstractTranslator {
    constructor(config) {
        super();

        let botConfig = config;
        if (!botConfig.systemPrompt) botConfig.systemPrompt = DEFAULT_TRANSLATION_PROMPT;
        let bot = GetBotFromConfig(botConfig);
        if (!bot) {
            throw `ValueError: Unsupported bot config! ${botConfig}`;
        }
        this.bot = bot;
    }

    async translate(text, config) {
        this.bot.appendContext(text, 'user');
        let translation = await this.bot.respondToContext();
        return translation;
    }
}
