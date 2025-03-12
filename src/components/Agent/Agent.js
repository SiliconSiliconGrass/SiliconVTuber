import CozeBot from '../Bot/CozeBot.js';
import OllamaBot from '../Bot/OllamaBot.js';
import GlmBot from '../Bot/GlmBot.js';
import ActionQueue from '../ActionQueue/ActionQueue.vue';
import { Resource } from '../ResourceManager/ResourceManager.vue';
import { GetBotFromConfig } from '../Bot/BotUtils.js';

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
        console.log(event.detail.content);
        self.response += event.detail.content;
        self.buffer += event.detail.content;
    }

    if (!areBracketsBalanced(self.buffer)) return; // 若不匹配，则暂不处理

    const seps = "。？！；.?!;";
    let splitList = self.buffer.split('[');

    if (splitList.length === 1 && multipleSplit(self.buffer, seps).length === 1) {
        return;
    }

    for (let i = 0; i < splitList.length; i++) {
        let chunk = splitList[i];
        if (i == 0) {
            // 第一个chunk需要特殊化处理，因为不包含"]", 直接SayAloud
            let sentences = multipleSplit(chunk, seps);
            for (let sentence of sentences) {
                if (isEmpty(sentence)) continue;
                let resource = new Resource(self.uuid(), 'TTS', {text: sentence});
                self.resourceManager.add(resource); // 注册所需TTS audio 资源
                self.actionQueue.enqueue({type: "SayAloud", data: sentence, resources: [resource]}); // 将SayAloud动作加入队列
            }
        } else {
            // 一般的chunk处理：先按照"]"切分后，再分别处理
            let splitList_ = chunk.split(']');
            if (splitList_.length === 2) {

                // 处理方括号中的tag
                let tag = splitList_[0];
                if (tag.startsWith('zh:')) {
                    // Chinese Translation
                    self.actionQueue.enqueue({type: "Translation", data: tag.slice(3), resources: []}); // Translation动作入队
                } else {
                    // Expression/Motion
                    self.actionQueue.enqueue({type: "Expression/Motion", data: tag, resources: []}); // Expression/Motion动作入队
                }

                // 处理"]"后面的text
                let text = splitList_[1];
                let sentences = multipleSplit(text, seps);
                for (let sentence of sentences) {
                    if (isEmpty(sentence)) continue;
                    let resource = new Resource(self.uuid(), 'TTS', {text: sentence});
                    self.resourceManager.add(resource); // 注册所需TTS audio 资源
                    self.actionQueue.enqueue({type: "SayAloud", data: sentence, resources: [resource]}); // 将SayAloud动作加入队列
                }

            } else {
                console.warn(`Found unbalanced brackets when parsing message delta! (Current buffer: ${self.buffer})`);
            }
        }
    }
    self.buffer = '';
};

const responseDone = (self) => {
    // console.log(self.response);
    // 记录智能体输出的信息
    console.log(self.response);
    self.bot.messages.push({
        role: "assistant",
        content: self.response,
        content_type: "text"
    });
    // console.log('recorded messgaes:', self.messages);

    let sentence = self.buffer;

    // 处理方括号[]中的motion/expression信息
    let sentenceSplit = sentence.split('[');

    for (let split of sentenceSplit) {
        let splitSplit = split.split(']');
        if (splitSplit.length == 1) {
            if (splitSplit[0] !== '') {
                let resource = new Resource(self.uuid(), 'TTS', {text: splitSplit[0]});
                self.resourceManager.add(resource); // 注册所需TTS audio 资源
                self.actionQueue.enqueue({type: "SayAloud", data: splitSplit[0], resources: [resource]}); // 将SayAloud动作加入队列
                // self.actionQueue.enqueue({type: "SayAloud", data: splitSplit[0], resources: []}); // 将SayAloud动作加入队列, 不使用coze生成resource
            }
        } else {
            // splitSplit[0]: expression/motion name
            // splitSplit[1]: tts text

            // expression/motion 应该不需要resource
            self.actionQueue.enqueue({type: "Expression/Motion", data: splitSplit[0], resources: []}); // Expression/Motion动作入队
            
            if (splitSplit[1] !== '') {
                let resource = new Resource(self.uuid(), 'TTS', {text: splitSplit[1]});
                self.resourceManager.add(resource); // 注册所需TTS audio 资源
                self.actionQueue.enqueue({type: "SayAloud", data: splitSplit[1], resources: [resource]}); // 将SayAloud动作加入队列
                // self.actionQueue.enqueue({type: "SayAloud", data: splitSplit[1], resources: []}); // 将SayAloud动作加入队列, 不使用coze生成resource
            }
        }
    }

    self.actionQueue.enqueue({type: "EndOfResponse", data: {}, resources: []}); // 将EndOfResponse动作加入队列
    // self.response = '';
    self.buffer = '';
}

// export default class Mao extends CozeBot {
export default class Agent extends EventTarget {
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

        this.buffer = '';          // 接收agent消息的buffer // TODO: 可以考虑移至Bot类
        this.response = '';        // 用于存储一次的回答
        this.userInputBuffer = []; // 用户输入的buffer
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

        self.dispatchEvent(new CustomEvent('end_of_query', {detail: self.userInputBuffer})); // End Of Query

        // await self.waitUntilEndOfResponse();
        self.dispatchEvent(new CustomEvent('end_of_response', {detail: self.userInputBuffer})); // End Of Response

        let sleepTime = (self.userInputBuffer.length === 0) ? 1000 : 10;
        self.timeoutId = setTimeout(() => self.mainLoop(self), sleepTime);
    }
}