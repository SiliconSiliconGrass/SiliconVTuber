import AbstractPlugin from "../AbstractPlugin";
import { GetBotFromConfig } from "@/SiliconVTuberCore/Bot/BotUtils.js";

const DEFAULT_TRANSLATION_PROMPT = `
你是一个翻译机器人，将输入的内容全部翻译成中文
注意要翻译的文本会分批输入，翻译的时候需要结合上文语境
可以有创造力一些，不要输出多余信息
再次强调：输出中文翻译结果，不要输出其他信息！
`;

/**
 * SubtitleHandler
 * @description 该类用于处理字幕的显示
 */
class SubtitleHandler {
    /**
     * @param {HTMLElement} element 字幕元素
     */
    constructor(element) {
        /** @type {HTMLElement} */
        this.element = element;
        /** @type {string} */
        this.targetContent = '';
        /** @type {string} */
        this.currentContent = '';

        this.mainLoop(this);
    }

    /**
     * 主循环
     */
    mainLoop(self) {
        if (self.targetContent.length > self.currentContent.length) {
            // 逐渐显示字幕
            self.currentContent += self.targetContent[self.currentContent.length];
        }
        self.element.innerHTML = self.currentContent;
        self.intervalId = setTimeout(() => self.mainLoop(self), 100);
    }

    /**
     * 更新字幕内容
     * @param {string} content 更新后的字幕内容
     */
    setContent(content) {
        this.currentContent = '';
        this.targetContent = content;
    }

    /**
     * 增量更新字幕内容
     * @param {string} delta 增量字幕内容
     */
    add(delta) {
        this.targetContent += delta;
    }

    /**
     * 清空字幕内容
     */
    clear() {
        this.element.innerHTML = '';
        this.targetContent = '';
        this.currentContent = '';
    }
}

/**
 * SubtitlePlugin
 * @description 该插件用于处理字幕的显示和翻译
 */
export default class SubtitlePlugin extends AbstractPlugin {
    constructor({element, enableTranslation = false, botConfig = null, translationElement = null}) {
        super();

        this.subtitle = new SubtitleHandler(element);
        this.enableTranslation = enableTranslation;

        if (this.enableTranslation) {
            if (!botConfig.systemPrompt) botConfig.systemPrompt = DEFAULT_TRANSLATION_PROMPT;
            let bot = GetBotFromConfig(botConfig);
            if (!bot) {
                throw `ValueError: Unsupported bot config! ${botConfig}`;
            }
            this.bot = bot;
            this.translationSubtitle = new SubtitleHandler(translationElement);
        }
    }

    setup(agent) {
        if (this.agent) {
            console.warn('This plugin is already initialized! Do not call setup() again!');
            return;
        }
        this.agent = agent;

        agent.addEventListener('action_start', (e) => {
            let subtitle = this.subtitle;
            let action = e.detail.action;
            if (subtitle) {
                if (action.type === 'EndOfResponse') {
                    subtitle.clear();
                    return;
                }
                if (action.type !== 'SayAloud') return;
                subtitle.add(action.data);
            }

            // if (action.resources.length > 1) { // 使用在ResourceManager中实现的翻译功能，但这一方案延迟较高，应当考虑弃用！
            //     if (action.resources[1].type === 'Translation') {
            //         let subtitle = agent.subtitles.translation;
            //         let text = action.resources[1].data.translation;
            //         if (text) subtitle.add(action.resources[1].data.translation);
            //     }
            // }
        });

        if (this.enableTranslation) {
            agent.addEventListener('end_of_query', (e) => {
                let subtitle = this.translationSubtitle;
                if (subtitle) {
                    let agentResponse = e.detail.response;
                    this.bot.appendContext(agentResponse, 'user');
                    this.bot.respondToContext().then((translation) => {
                        subtitle.add(translation);
                    });
                }
            });

            agent.addEventListener('end_of_response', (e) => {
                this.subtitle.clear();
                this.translationSubtitle.clear();
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