<script>
// import CozeBot from './CozeBot.vue';
import OllamaBot from './OllamaBot';
import ActionQueue from '../ActionQueue/ActionQueue.vue';
import { Resource } from '../ResourceManager/ResourceManager.vue';

function multipleSplit(inputString, delimiters) {
    // 构建一个正则表达式，匹配任一指定的分隔符
    const delimiterRegex = new RegExp('[' + delimiters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']+');
    // 使用正则表达式分割字符串
    return inputString.split(delimiterRegex);
}

function isEmpty(str) {
    const bannedChars = "「」，。？/：；‘“’”【】、｜,.:;./'\"'=+-_)(*&^%$#@!`` "
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
    self.response += event['content'];
    self.buffer += data['content'];

    if (!areBracketsBalanced(self.buffer)) return; // 若不匹配，则暂不处理

    const seps = "，。？！；,.?!;、";
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
    self.messages.push({
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
export default class Mao extends OllamaBot {
    /**
     * A common chat bot model, using coze api
     * @param pat coze token for bot brain
     * @param botID coze bot id for bot brain
     * @param userID coze user id (any string, except empty)
     * @param ttsPat coze token for TTS bot
     * @param ttsBotID coze bot id for TTS bot
     * @param resourceManager resourceManager (used for resource management, such as TTS audios)
     * @param actionQueue actionQueue (used for action management)
     */
    constructor(pat, botID, userID, ttsPat, ttsBotID, resourceManager, actionQueue) {
        let eventCallBacks = {
            'conversation.message.delta': msgDelta,
            'done': responseDone
        }
        // super(pat, botID, userID, eventCallBacks); // Coze
        super(eventCallBacks); // Ollama

        this.ttsBotID = ttsBotID;
        this.ttsPat = ttsPat;

        if (!actionQueue) actionQueue = new ActionQueue(this);

        this.resourceManager = resourceManager;
        this.actionQueue = actionQueue;
        this.buffer = ''; // 缓冲区

        this.subtitles = {'main': null, 'translation': null}; // 字幕DOM元素

        this.uuidFacotry = 0;
        

        this.setup(); // 初始化时自动创建ConvID, 以提高首句TTS生成速度
    }

    uuid() {
        return this.uuidFacotry++;
    }
}

</script>