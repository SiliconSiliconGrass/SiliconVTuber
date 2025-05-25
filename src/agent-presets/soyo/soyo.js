import VTuber from "@/SiliconVTuberCore/Agent/VTuberAgent.js";
import ActionQueue from "@/SiliconVTuberCore/plugins/silicon-plugins/ActionQueue/ActionQueue.js";
import L2dDisplay from "@/SiliconVTuberCore/plugins/silicon-plugins/L2dDisplay/L2dDisplay.js";
import SubtitlePlugin from "@/SiliconVTuberCore/plugins/silicon-plugins/SubtitlePlugin.js";
import { getToken } from "@/SiliconVTuberCore/utils/tokenGatewary.js";
import { live2dPrompter } from "@/SiliconVTuberCore/utils/live2dPrompter.js";
import { createAgent } from "@/SiliconVTuberCore/utils/createAgent.js";

import LIVE2D_CONFIG from "./live2dConfig.js";
import PROMPT from "./prompt.js"

/**
 * 获取一个 Soyo Agent
 * @param {HTMLCanvasElement} live2dCanvas 展示Live2D的Canvas元素
 * @param {HTMLElement} subtitle 日语字幕元素
 * @param {HTMLElement} transSubtitle 中文翻译字幕元素
 * @returns {VTuber} Soyo Agent
 */
export function Soyo(live2dCanvas, subtitle, transSubtitle) {

    LIVE2D_CONFIG.canvas = live2dCanvas;

    const config = {
        Agent: VTuber,
        botConfig: {
            type: 'GLM',
            token: getToken('glm'),
            modelName: 'glm-4-flash-250414',
            systemPrompt: live2dPrompter(PROMPT, LIVE2D_CONFIG, 'jp')
        },
        queryTemplate: '%USER_INPUT%',

        plugins: [
            [ActionQueue, {
                ttsConfig: {
                    type: 'gptsovits',
                    character: 'misaka-ja', // debug
                    "refer_wav_path": "参考音频/Soyo干声素材/正常参考/うちはとても裕福になった綺麗な家に引っ越して.wav",
                    "prompt_text": "うちはとても裕福になった綺麗な家に引っ越して。",
                    "prompt_language": "ja",
                    "text_language": "ja", // 要合成的文本的语言
                    // "text_language": "zh",
                    "temperature": 1.0,
                    "speed": 1.0,


                    "text": "",
                    "speaker": "soyo0"

                }, translationConfig: null
            }],
            [L2dDisplay, LIVE2D_CONFIG],
            [SubtitlePlugin, {
                element: subtitle, 
                enableTranslation: true, 
                botConfig: {type: 'GLM', token: getToken('glm'), modelName: 'glm-4-flash'}, 
                translationElement: transSubtitle
            }],
        ]
    };

    return createAgent(config);
}
