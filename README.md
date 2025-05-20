# ai-vtuber-vue
基于Vue和Live2D的AI虚拟主播/虚拟桌宠。

## 1. 安装
```
npm install
```

## 2. 运行调试
```
npm run serve
electron .
```

## 3. 文件结构
- ### Live2D资源与支持
| 路径 | 内容 |
|-------|-------|
| public/L2D | Live2D Cubism SDK 官方分发代码 (请自行去Live2D官网获取) |
| public/Resources | Live2D 模型文件 |

- ### 后端代码
| 路径 | 内容 |
|-------|-------|
| ai-vtuber-support/BilibiliWatcher | bilibili 直播间弹幕监视器 |
| ai-vtuber-support/GPT-SoVITS | GPT-SoVITS 语音合成 (请自行去github获取代码) |

- ### 前端代码
| 路径 | 内容 |
|-------|-------|
| src/App.vue | 示例入口 |
| src/Demo | 示例样板 |
| src/SiliconVTuberCore | 前端核心代码 |
| src/components/AudioRecognition.vue | 麦克风录音组件 |
| src/tokens/tokens.token.js | 存储 LLM token (请自行获取) |

## 4. 项目文档
| 文档路径 | 文档内容 |
|-------|-------|
| src/ARCHITECTURE.md | 前端架构 |
| src/plugins/README.md | 插件教程 |