# Architecture of "Silicon VTuber Core"
本文是 Silicon VTuber Core 前端核心技术文档。

## 1. 文件结构
| 路径 | 内容 |
|-----|------|
| ./Agent | AI 角色框架 (基于 Bot 和 plugins) |
| ./Bot | 负责从不同平台调用LLM (目前支持 GLM、Coze、Ollama，可扩展) |
| ./plugins | Agent 的插件，为 Agent 提供更多附加功能，如 Live2D 展示等 |

## 2. 详细文档
关于Agent的内容，请参阅./Agent/README.md
关于Bot的内容，请参阅./Bot/README.md
关于plugins的内容，请参阅./plugins/README.md