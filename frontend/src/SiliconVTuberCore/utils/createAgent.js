/**
 * @typedef {Function} PluginClass
 * @description 插件类构造函数
 */

/**
 * @typedef {Object} PluginConfig
 * @description 插件配置对象的通用结构
 * @property {*} [key: string] - 允许任意类型的配置项
 */

/**
 * @typedef {[PluginClass, PluginConfig]} PluginEntry
 * @description 插件配置条目：包含插件类和其配置的元组
 */

/**
 * @typedef {Object} AgentConfig
 * @property {Function} Agent - Agent 主类
 * @property {Object} botConfig - 机器人核心配置
 * @property {string} botConfig.type - 模型类型
 * @property {string} botConfig.token - 认证令牌
 * @property {string} botConfig.modelName - 模型名称
 * @property {string|null} [queryTemplate] - 查询模板
 * @property {Array<PluginEntry>} plugins - 插件配置数组（元组形式）
 */


// import VTuber from "../Agent/VTuberAgent"
// import ActionQueue from "../plugins/silicon-plugins/ActionQueue/ActionQueue"
// import BatteryStatus from "../plugins/silicon-plugins/BatteryStatus"
// import L2dDisplay from "../plugins/silicon-plugins/L2dDisplay/L2dDisplay"
// import { getToken } from "./tokenGatewary"

// const exampleAgentConfig = {
//     Agent: VTuber,
//     botConfig: {
//         type: 'GLM',
//         token: getToken('glm'),
//         modelName: 'glm-4-flash',
//     },
//     queryTemplate: null,

//     plugins: [
//         [ActionQueue, { ttsConfig: { type: 'gptsovits', character: 'misaka-ja' }, translationConfig: null }],
//         [L2dDisplay, { modelURL: '/Resources/mikoto/mikoto.model.json', canvas: new HTMLCanvasElement(),
//             motionDict: {
//                 'akimbo': {group: 'tap', order: 0, duration: 1000},
//                 'raise_one_hand': {group: 'tap', order: 1, duration: 1000}
//             },
//             expressionDict: {
//                 'no_expression': {order: 0},
//                 'smile': {order: 1},
//                 'frown': {order: 2},
//                 'doubtful': {order: 3},
//                 'smile_with_eyes_closed': {order: 4},
//                 'shocked': {order: 5},
//                 'blush': {order: 6},
//             } }],
//         [BatteryStatus, {}],
//     ]
// }

/**
 * 创建 Agent 实例
 * @param {AgentConfig} config - Agent 配置对象
 * @returns {Agent} 创建的 Agent 实例
 */
export function createAgent(config) {
    const { Agent, botConfig, queryTemplate, plugins } = config;
    const agent = new Agent(botConfig, queryTemplate);
    if (Array.isArray(plugins)) {
        for (const pluginConfig of plugins) {
            const pluginClass = pluginConfig[0];
            const pluginParams = pluginConfig[1];
            const plugin = new pluginClass(pluginParams);
            agent.addPlugin(plugin);
        }
    }
    return agent;
}