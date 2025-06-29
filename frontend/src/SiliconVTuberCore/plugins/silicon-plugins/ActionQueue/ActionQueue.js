import AbstractPlugin from '@/SiliconVTuberCore/plugins/AbstractPlugin';
import ResourceManager from './ResourceManager';

/**
 * 动作
 * @param type [string] type of action
 * @param data [Object] data of action
 */
export class Action {
    constructor(type, data) {
        /** @type {string} */
        this.type = type;
        this.data = data;

        /** @type {Resource[]} */
        this.resources = [];
    }
}

async function sayAloud(action, self) {
    if (action.type !== 'SayAloud') return;
    try {
        await self.resourceManager.playAudio(action.resources[0], false); // 播放音频，播放结束后不会立即删除
    } catch(e) {
        console.warn(`Skipping SayAloud Action (text: ${action.data}), because an error occurred:`, e);
    }
    
    // 等到一段话结束时再删除所有音频，减小性能开销
}

async function endOfResponse(action, self) {
    if (action.type === 'EndOfResponse' && self.queue.length === 1) {
        self.resourceManager.clearResources();
        self.dispatchEvent(new Event('empty'));

        for (let key in self.parent.subtitles) {
            let subtitle = self.parent.subtitles[key];
            console.log();
            if (subtitle) {
                subtitle.clear();
            }
        }
    }
}

/**
 * 动作队列
 * 
 * 管理、控制动作的顺序执行 (包括TTS、Live2D动作与表情等)
 * 这是 Agent 的基本插件
 * 
 * 默认提供 "SayAloud" "Expression/Motion" "EndOfResponse" 三种动作类型
 * 
 * 使用 registerActionType 方法来注册其他动作类型
 */
export default class ActionQueue extends AbstractPlugin {
    constructor({ttsConfig, translationConfig}) {
        super();
        this.ttsConfig = ttsConfig;
        this.translationConfig = translationConfig;

        /** @type {Array<Action>} */
        this.queue = [];

        /** @type {boolean} */
        this.busy = false;

        /** @type {number} */
        this.timeoutId = null;

        /** @type {ResourceManager} */
        this.resourceManager = null;

        /** @type {{[actionTypeName: string]: (action:Action, self: ActionQueue)=>Promise<void>}} */
        this.actionTypes = {};

        this.registerActionType('SayAloud', sayAloud);
        this.registerActionType('EndOfResponse', endOfResponse);

        this.mainLoop();
    }

    setup(agent) {
        this.parent = agent;
        this.resourceManager = new ResourceManager(this.ttsConfig, this.translationConfig);
        agent.actionQueue = this; // 方便访问 actionQueue
        agent.resourceManager = this.resourceManager;
    }

    async queryToLLM(agent, userInput) {
        return '';
    }

    /**
     * 注册动作类型
     * @param {string} typeName 注册动作类型名称
     * @param {(action: Action, self: ActionQueue) => Promise<void>} actionFunc 动作执行函数
     */
    registerActionType(typeName, actionFunc) {
        if (!this.actionTypes) this.actionTypes = {};
        this.actionTypes[typeName] = actionFunc;
    }

    /**
     * 动作入队
     * @param {Action} action 动作
     */
    enqueue(action) {
        this.queue.push(action);
    }

    /**
     * 动作出队
     * @returns {Action} 出队的动作
     */
    dequeue() {
        return this.queue.shift();
    }

    /**
     * 获取队列长度
     * @returns {number} 队列长度
     */
    length() {
        return this.queue.length;
    }

    /**
     * 判断队列是否为空
     * @returns {boolean} 是否为空
     */
    isEmpty() {
        return this.length() === 0;
    }

    /**
     * 主循环
     */
    async mainLoop() {
        const INTERVAL = 100; // (ms)

        // console.log(`ActionQueue mainLoop alive! Actions: ${this.queue}`);

        while (this.length() > 0) {
            let action = this.queue[0]; // 先不dequeue，因为可能由于resource不全而执行失败
            if (action.resources) {

                // 如果有尚未就绪的resource，则暂不执行action
                let ready = true;
                for (let resource of action.resources) {
                    if (!resource.ready) {
                        ready = false;
                        break;
                    }
                }
                if (!ready) break;

                // 执行action
                await this.doAction(action);
                this.dequeue(); // 出队
            }
        }

        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(async() => {await this.mainLoop()}, INTERVAL);
    }

    /**
     * 执行动作
     * @param {Action} action 待执行的动作
     */
    async doAction(action) {
        this.parent.dispatchEvent(new CustomEvent("action_start", {detail: {action: action}}));

        if (!this.actionTypes[action.type]) return;
        const actionFunc = this.actionTypes[action.type];
        return await actionFunc(action, this);
    }
}
