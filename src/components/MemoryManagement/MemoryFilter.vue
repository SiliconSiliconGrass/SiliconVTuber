<script>
// TODO (现在只是copy了一下MemoryWriter, core function 还没写好)

import CozeBot from '../BotBrain/CozeBot.vue';

const msgDelta = (self, data) => {
    self.response += data['content'];
};

function copy(messages) {
    let c = [];
    for (let message of messages) {
        c.push(message);
    }
    return c;
}

const memoryFilterMessage = `
[系统提示] 请你先从你的记忆库(JSON格式)中选择你可能需要用到的记忆
你需要根据语境，选择与你接下来的回答相关(或者你认为需要被长期记住)的一条或多条记忆内容，将它们的id以一个JSON整数数组(Array<Int>)的形式输出出来。

例如:
当前的语境: 用户正在问你想给他买什么好吃的作为礼物
你的记忆: [{"id":1,"content":"用户的名字叫做“小明”",{"id":2,"content":"小明喜欢吃巧克力"},{"id":3,"content":"用户夸我可爱"}]
期待的输出:“[1,2]”
解释: id为1的记忆表明了用户的姓名，属于需要长期记忆的信息，而你在与用户说话，因此需要强化这条记忆；id为2的记忆与用户的提问直接相关；id为3的记忆与语境关系不大
（该示例仅供参考，你可以根据你的个性来筛选所需记忆）

注意:
1. 此次不要输出多余的信息;
2. 严格按照JSON格式，如果认为没有需要用到的记忆，就将回答“[]”，如果认为一条记忆是需要用到的，则也要回答一个长度为1的整数数组

这是此次用户的输入: %USER_INPUT%
这是你的记忆库: %MEMORY%
无论你收到了多少个用户输入，每次只能输出一个数组！“[3][1,2][]”这样的回答是非法的！
`;


export default class MemoryFilter extends CozeBot {
    /**
     * Memory Selecting Agent (select related memories)
     * @param pat coze token for bot brain
     * @param botID coze bot id for bot brain
     * @param userID coze user id (any string, except empty)
     */
    constructor(pat, botID, userID, memoryServer) {
        var eventCallBacks = {
            'conversation.message.delta': msgDelta,
            // 'done': responseDone
        }
        super(pat, botID, userID, eventCallBacks);

        if (!memoryServer) memoryServer = 'http://127.0.0.1:8082/';
        this.url = memoryServer;

        this.createConv(); // 初始化时自动创建ConvID, 以提高首句生成速度
    }

    async selectRelatedMemoryIds(messages, userInput, memory) {
        /**
         * Create new memories
         * @param messages 聊天记录 Array<Object>
         * @param userInput 用户此次的输入内容 Array<String>
         * @param memory 当前的记忆库 Array<Object>
         */
        let memoryFilterMessages = copy(messages);
        memoryFilterMessages.push({
            role: 'user',
            content: memoryFilterMessage.replaceAll('%MEMORY%', JSON.stringify(memory)).replaceAll('%USER_INPUT%', JSON.stringify(userInput)),
            content_type: 'text'
        });

        console.log('memory filter got messages:', memoryFilterMessages);

        let response = await this.respondToContext(memoryFilterMessages);
        let relatedMemoryIds = [];
        try {
            relatedMemoryIds = JSON.parse(response);
        } catch(e) {
            console.warn(`[MemoryFileter] The agent didn't respond in JSON format! (Got response: "${response}")`);
        }
        return relatedMemoryIds;
    }
}

</script>