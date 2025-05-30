import ActionQueue from '../ActionQueue/ActionQueue.vue';
import { Resource } from '../ResourceManager/ResourceManager.vue';
import { GetBotFromConfig } from '../Bot/BotUtils.js';
import AbstractAgent from './AbstractAgent';

function multipleSplit(inputString, delimiters) {
    let result = [];
    let curr = '';
    for (let i in inputString) {
        let char = inputString[i];
        curr += char;
        if (delimiters.includes(char)) {
            result.push(curr);
            curr = '';
        }
    }

    // if (curr !== '') {
    //     result.push(curr);
    // }
    if (curr !== '') {
        result.push(curr);
    }

    return result;
}

function isEmpty(str) {
    const bannedChars = "「」，。？/：；‘“’”【】、｜,.:;./'\"'=+-_)(*&^%$#@!`` \n"
    for (let char of bannedChars) str = str.replaceAll(char, '');
    return str === '';
}

function areBracketsBalanced(str) {
    const openBracketCount = (str.match(/\[/g) || []).length;
    const closeBracketCount = (str.match(/\]/g) || []).length;
    
    return openBracketCount === closeBracketCount;
}

const msgDelta = (self, event) => {
    // 定义收到流式请求中的message delta时的处理过程
    if (event.detail.content) {
        self.response += event.detail.content;
        self.buffer += event.detail.content;
    }

    console.log(event.detail.content);

    let chunks = self.buffer.split('```');
    if (chunks.length % 2 == 0) return;

    const seps = '，。；！？,.:!?';

    for (let i in chunks) {
        let chunk = chunks[i];
        // console.log({chunk});

        if (i % 2 == 1) {
            // LaTeX 代码块
            let latex = chunk.replace('latex\n', '');
            self.dispatchEvent(new CustomEvent('latex_update', {detail: {latex: latex}}));
        } else {
            // 聊天
            let sentences = multipleSplit(chunk, seps);
            console.log({sentences});
            for (let j in sentences) {
                let sentence = sentences[j];

                if (i == chunks.length - 1 && j == sentences.length - 1) {
                    // 处理可能不完整的句子(还没说完的一句)
                    if (seps.includes(sentence.slice(-1))) {
                        self.buffer = '';
                    } else {
                        self.buffer = sentence;
                        return;
                    }
                }

                // 添加朗读的句子
                if (isEmpty(sentence)) continue;
                sentence = sentence.replaceAll('$', '美元符号');
                let ttsResource = new Resource(self.uuid(), 'TTS', {text: sentence});
                self.resourceManager.add(ttsResource); // 注册所需TTS audio 资源
                self.actionQueue.enqueue({type: "SayAloud", data: sentence, resources: [ttsResource]}); // 将SayAloud动作加入队列
            }
        }
    }
};

const responseDone = (self) => {

    if (self.buffer != "") {
        // 添加朗读的句子
        let sentence = self.buffer;
        let ttsResource = new Resource(self.uuid(), 'TTS', {text: sentence});
        self.resourceManager.add(ttsResource); // 注册所需TTS audio 资源
        self.actionQueue.enqueue({type: "SayAloud", data: sentence, resources: [ttsResource]}); // 将SayAloud动作加入队列
    }

    // console.log(self.response);
    // 记录智能体输出的信息
    console.log(self.response);
    self.bot.messages.push({
        role: "assistant",
        content: self.response,
        content_type: "text"
    });
    // console.log('recorded messgaes:', self.messages);

    self.actionQueue.enqueue({type: "EndOfResponse", data: {}, resources: []}); // 将EndOfResponse动作加入队列
    // self.response = '';
    self.buffer = '';
}

export default class Agent extends AbstractAgent {
    /**
     * A common chat bot model, using coze api
     * @param {Object} botConfig configuration for agent brain
     * @param {ResourceManager} resourceManager resource management proxy, including TTS
     * @param {ActionQueue} actionQueue action management proxy
     */
    constructor(botConfig, resourceManager, actionQueue, queryTemplate = null) {
        super();
        // let bot;
        // let botType = botConfig.type;
        // if (botType === 'Ollama') {
        //     bot = new OllamaBot(botConfig.modelName);
        // } else if (botType === 'Coze') {
        //     bot = new CozeBot(botConfig.pat, botConfig.botID, botConfig.userID);
        // } else if (botType === 'GLM') {
        //     bot = new GlmBot(botConfig.token, botConfig.modelName, botConfig.systemPrompt);
        // }
        // this.bot = bot;

        this.bot = GetBotFromConfig(botConfig);

        if (!actionQueue) actionQueue = new ActionQueue(this);
        this.resourceManager = resourceManager;
        this.actionQueue = actionQueue;

        this.subtitles = {'main': null, 'translation': null}; // 字幕DOM元素

        this.uuidFacotry = 0;

        this.bot.setup(); // 初始化时自动创建ConvID, 以提高首句TTS生成速度
        this.bot.addEventListener('message_delta', (event) => {
            msgDelta(this, event);
        });
        this.bot.addEventListener('done', () => {
            responseDone(this);
        });

        if (!queryTemplate) {
            queryTemplate = '[时间: %TIME%]\n%PLUGIN_INFO%\n用户的输入: %USER_INPUT%';
            // queryTemplate = '%USER_INPUT%';
        }
        this.queryTemplate = queryTemplate;

        this.buffer = '';          // 保存 message delta 以等待分句处理的缓冲区
        this.response = '';        // 用于存储一次的回答
        this.userInputBuffer = []; // 用户输入缓冲区
        this.timeoutId = null;     // mainLoop timeout id

        this.plugins = [];         // 所有插件或扩展

        this.dispatchEvent(new CustomEvent('init')); // init
    }

    uuid() {
        return this.uuidFacotry++;
    }

    async respondToContext(messages) {
        return await this.bot.respondToContext(messages);
    }

    appendContext(text, role = 'user') {
        return this.bot.appendContext(text, role);
    }

    waitUntilEndOfResponse() {
        // 等待直到动作列表被清空
        return new Promise(resolve => {
            if (this.actionQueue.isEmpty()) {
                return resolve();
            }
            this.actionQueue.addEventListener('empty', resolve, { once: true });
        });
    }

    async mainLoop(self) {
        /**
         * 主循环 (向LLM进行轮询)
         */

        // console.log({this: self});

        let message = ''; // 从userInputBuffer中获取用户的全部输入

        if (self.userInputBuffer.length > 0) {
            console.log({userInputBuffer: self.userInputBuffer});
        }

        for (let userInput of self.userInputBuffer) {
            message += userInput + '\n';
        }
        self.userInputBuffer = []; // 清空userInputBffer

        let messageEmpty = (message === "");
        if (messageEmpty) {

            /* TODO: 用户没有输入的时候，应该如何表现？ */

            // if (Math.random() < 0.9) {
            //     return setTimeout(self.mainLoop, 3000);
            // }
            // message = "[系统提示: 用户什么也没输入, 如果你认为没有必须要说的话, 那就回复“。”, 如果你有想说的话或想做的动作，那就直接正常回答, 但不要一直问用户为什么不说话]";
            return setTimeout(() => self.mainLoop(self), 10);
        }

        self.dispatchEvent(new CustomEvent('start_of_response', {detail: {userInputBuffer: self.userInputBuffer}}));

        let pluginInfo = '';
        for (let plugin of self.plugins) {
            try {
                pluginInfo += await plugin.queryToLLM(self, message);
            } catch(e) {
                console.warn('An error occurred when running a plugin', {plugin: plugin, error: e});
            }
        }

        let content = self.queryTemplate;
        content = content.replaceAll('%TIME%', `${new Date(Date.now())}`);
        content = content.replaceAll('%PLUGIN_INFO%', pluginInfo);
        content = content.replaceAll('%USER_INPUT%', message);

        self.appendContext(content, 'user');
        console.log(self.bot.messages);
        console.log('responding...');
        let response = await self.respondToContext();
        console.log({response});
        console.log('respond end');

        self.dispatchEvent(new CustomEvent('end_of_query', {detail: {
            userInputBuffer: self.userInputBuffer,
            response: response
        }})); // End Of Query

        // await self.waitUntilEndOfResponse();
        self.dispatchEvent(new CustomEvent('end_of_response', {detail: {
            userInputBuffer: self.userInputBuffer,
            response: response
        }})); // End Of Response

        let sleepTime = (self.userInputBuffer.length === 0) ? 1000 : 10;
        self.timeoutId = setTimeout(() => self.mainLoop(self), sleepTime);
    }
}