<script>

import axios from 'axios';

const MAO_MOTIONS = {
  'shy': 1000,
  'comfy': 1000,
  'touch_hat': 2000,
  'draw_heart_success': 2000,
  'draw_heart_failed': 3000,
  'rabbit_magic': 2000,
};

const MAO_EXPRESSIONS = {
  'smile': 'exp_01',
  'smile_with_eyes_closed': 'exp_02',
  'close_eyes': 'exp_03',
  'stars_in_eyes': 'exp_04',
  'doubtful': 'exp_05',
  'blush': 'exp_06',
  'shocked': 'exp_07',
  'disdainful': 'exp_08'
};

const MISAKA_MOTIONS = {
    'akimbo': 1000,
    'raise_one_hand': 1000
};

const MISAKA_EXPRESSIONS = {
    'no_expression': '默认的表情，比较严肃',
    'smile': '微笑',
    'frown': '皱眉，有些生气',
    'doubtful': '疑惑地皱眉',
    'smile_with_eyes_closed': '眯眼微笑',
    'shocked': '震惊，瞪大眼睛',
    'blush': '害羞地脸红'
};

const MOTION_DICT = MISAKA_MOTIONS;
const EXPRESSION_DICT = MISAKA_EXPRESSIONS;

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export class Action {
    /**
     * @param type [string] type of action
     * @param data [Object] data of action
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

export default class ActionQueue extends EventTarget {
    /**
     * A delegate used to manage and carry out actions
     * @param {Agent} parent parent agent
     */
    constructor(parent) {
        super();
        this.queue = [];
        this.busy = false;
        this.parent = parent; // 关联Bot
        this.audioGenInterval = 0;

        this.lastAudioGenTime = null;
        this.timeoutId = null;

        this.mainLoop();
    }

    enqueue(action) {
        this.queue.push(action);
        // this.activate(); // 在入队时尝试执行
    }

    dequeue() {
        return this.queue.shift();
    }

    length() {
        return this.queue.length;
    }

    isEmpty() {
        return this.length() === 0;
    }

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

    async doAction(action) {
        this.parent.dispatchEvent(new CustomEvent("action_start", {detail: {action: action}}));

        if (action.type === 'SayAloud') {
            // // 添加字幕
            // let subtitle = this.parent.subtitles.main;
            // if (subtitle) {
            //     subtitle.add(action.data);
            // }

            // // 添加翻译字幕
            // if (this.queue.length >= 2 && this.queue[1].type === 'Translation') {
            //     let subtitle = this.parent.subtitles.translation;
            //     if (subtitle) {
            //         subtitle.add(this.queue[1].data);
            //     }
            // }
            // // (可选) 把下下个动作也判断一下
            // if (this.queue.length >= 3 && this.queue[2].type === 'Translation') {
            //     let subtitle = this.parent.subtitles.translation;
            //     if (subtitle) {
            //         subtitle.add(this.queue[2].data);
            //         this.queue.splice(2, 1); // 避免这条翻译弹幕被添加两边
            //     }
            // }


            // // TODO: 将这一部分移动到专门的Translator类中, 以增强可扩展性
            // axios.post('http://127.0.0.1:8083/translate', {
            //     from_lang: 'JA',
            //     to_lang:   'ZH',
            //     text: action.data
            // }).then((response) => {
            //     let subtitle = this.parent.subtitles.translation;
            //     if (subtitle) {
            //         subtitle.add(response.data.result);
            //     }
            // });

            try {
                await this.parent.resourceManager.playAudio(action.resources[0], false); // 播放音频，播放结束后不会立即删除
            } catch(e) {
                console.warn(`Skipping SayAloud Action (text: ${action.data}), because an error occurred:`, e);
            }
            
            // 等到一段话结束时再删除所有音频，减小性能开销
        }

        if (action.type === 'Expression/Motion') {
            let name = action.data;
            if (name in MOTION_DICT) {
                let event = new Event('launchMotion');
                event.motionName = name;
                document.getElementById('l2dEventTrigger').dispatchEvent(event);

                await delay(MOTION_DICT[name]); // MOTION_DICT中存储了每隔动作的持续时间

                // motionEnd的触发时机似乎不是很正确, 故弃用
                // return new Promise((resolve) => {
                //     document.getElementById('l2dCallbackTrigger').addEventListener('motionEnd', async () => {
                //         console.log('motionEnd!');
                //         resolve();
                //     }, { once: true }); // 该listener只触发一次
                // });

            } else if (name in EXPRESSION_DICT) {
                let event = new Event('setExpression');
                event.expressionName = name;
                document.getElementById('l2dEventTrigger').dispatchEvent(event);
            }
        }

        if (action.type === 'Translation') {
            // do nothing
            // 翻译的字幕在SayAloud的时候就加了
        }


        if (action.type === 'EndOfResponse' && this.queue.length === 1) {
            this.parent.resourceManager.clearResources();
            this.dispatchEvent(new Event('empty'));

            for (let key in this.parent.subtitles) {
                let subtitle = this.parent.subtitles[key];
                console.log();
                if (subtitle) {
                    subtitle.clear();
                }
            }
        }
    }
}

</script>