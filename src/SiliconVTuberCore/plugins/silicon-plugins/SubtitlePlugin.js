import AbstractPlugin from "../AbstractPlugin";
import { GetBotFromConfig } from "@/components/Bot/BotUtils";

const DEFAULT_TRANSLATION_PROMPT = `
你是一个翻译机器人，将输入的内容全部翻译成中文
注意要翻译的文本会分批输入，翻译的时候需要结合上文语境
可以有创造力一些，不要输出多余信息
再次强调：输出中文翻译结果，不要输出其他信息！
`;

export default class SubtitlePlugin extends AbstractPlugin {
    constructor({enableTranslation = false, botConfig = null}) {
        super();

        this.enableTranslation = enableTranslation;

        if (this.enableTranslation) {
            let botConfig = config.botConfig;
            if (!botConfig.systemPrompt) botConfig.systemPrompt = DEFAULT_TRANSLATION_PROMPT;
            let bot = GetBotFromConfig(botConfig);
            if (!bot) {
                throw `ValueError: Unsupported bot config! ${botConfig}`;
            }
            this.bot = bot;
        }
    }

    setup(agent) {
        if (this.agent) {
            console.warn('This plugin is already initialized! Do not call setup() again!');
            return;
        }
        this.agent = agent;

        agent.addEventListener('action_start', (e) => {
            let subtitle = agent.subtitles.main;
            let action = e.detail.action;
            if (subtitle) {
                if (action.type !== 'SayAloud') return;
                subtitle.add(action.data);
            }

            if (action.resources.length > 1) { // 使用在ResourceManager中实现的翻译功能，但这一方案延迟较高，应当考虑弃用！
                if (action.resources[1].type === 'Translation') {
                    let subtitle = agent.subtitles.translation;
                    let text = action.resources[1].data.translation;
                    if (text) subtitle.add(action.resources[1].data.translation);
                }
            }
        });

        if (this.enableTranslation) {
            agent.addEventListener('end_of_query', (e) => {
                let subtitle = agent.subtitles.translation;
                if (subtitle) {
                    let agentResponse = e.detail.response;
                    this.bot.appendContext(agentResponse, 'user');
                    this.bot.respondToContext().then((translation) => {
                        subtitle.add(translation);
                    });
                }
            });

            // agent.addEventListener('action_start', (e) => {
            //     let subtitle = agent.subtitles.translation;
            //     let action = e.detail.action;
            //     if (subtitle) {
            //         if (action.type !== 'SayAloud') return;
            //         this.bot.appendContext(action.data, 'user');
            //         this.bot.respondToContext().then((translation) => {
            //             console.log({translation});
            //             subtitle.add(translation);
            //         });
            //     }
            // });
        }
        
    }

    async queryToLLM(agent, userInput) {
        return '';
    }
}