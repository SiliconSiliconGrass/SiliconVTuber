<script>
import CozeBot from './CozeBot.vue';
import ActionQueue from '../ActionQueue/ActionQueue.vue';
import { Resource } from '../ResourceManager/ResourceManager.vue';

function multipleSplit(inputString, delimiters) {
    // 构建一个正则表达式，匹配任一指定的分隔符
    const delimiterRegex = new RegExp('[' + delimiters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']+');
    // 使用正则表达式分割字符串
    return inputString.split(delimiterRegex);
}

const msgDelta = (self, data) => {
    self.response += data['content'];
    self.buffer += data['content'];

    const seps = "，。？！：；,.?!:;";
    var splitList = multipleSplit(self.buffer, seps);
    for (var i = 0; i < splitList.length - 1; i++) {
        // 处理一个短句

        let sentence = splitList[i];

        // 处理方括号[]中的motion/expression信息
        let sentenceSplit = sentence.split('[');

        for (let split of sentenceSplit) {
            let splitSplit = split.split(']');
            if (splitSplit.length == 1) {
                if (splitSplit[0] !== '') {
                    let resource = new Resource(self.uuid(), 'TTS', {text: splitSplit[0]});
                    self.resourceManager.add(resource); // 注册所需TTS audio 资源
                    self.actionQueue.enqueue({type: "SayAloud", data: splitSplit[0], resources: [resource]}); // 将SayAloud动作加入队列
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
                }
            }
        }
    }
    self.buffer = splitList[splitList.length - 1];
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
            }
        }
    }

    self.actionQueue.enqueue({type: "EndOfResponse", data: {}, resources: []}); // 将EndOfResponse动作加入队列
    // self.response = '';
    self.buffer = '';
}

export default class Mao extends CozeBot {
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
        var eventCallBacks = {
            'conversation.message.delta': msgDelta,
            'done': responseDone
        }
        super(pat, botID, userID, eventCallBacks);

        this.ttsBotID = ttsBotID;
        this.ttsPat = ttsPat;

        if (!actionQueue) actionQueue = new ActionQueue(this);

        this.resourceManager = resourceManager;
        this.actionQueue = actionQueue;
        this.buffer = ''; // 缓冲区

        this.uuidFacotry = 0;

        this.createConv(); // 初始化时自动创建ConvID, 以提高首句TTS生成速度
    }

    uuid() {
        return this.uuidFacotry++;
    }
}

</script>