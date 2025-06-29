# SiliconVTuber
基于 Live2D 和 GPT-SoVITS 的 AI 虚拟主播/虚拟桌宠。

---

## 1. 安装
### 1.1 自动安装
执行自动安装脚本前，请确定您已安装 Anaconda 和 Node.js ( >= 20.0.0 )

#### Windows
    (WARNING: Windows 版本自动安装脚本仍在测试中)
``` bat
.\setup.bat
```

#### Mac
``` sh
bash setup.sh
```

若自动安装脚本出现问题，请尝试手动安装。

### 1.2 手动安装
#### Windows
1. 安装前端依赖
``` bat
cd frontend
npm install
```

2. 获取 GPT-SoVITS 仓库
``` bat
cd backend
git clone https://github.com/RVC-Boss/GPT-SoVITS.git
```

3. 安装 GPT-SoVITS
( 详见 GPT-SoVITS 仓库中的 ```README.md``` )
``` bat
cd backend/GPT-SoVITS
conda create -n GPTSoVits python=3.10
conda activate GPTSoVits
pwsh -F install.ps1 --Device <CU126|CU128|CPU> --Source <HF|HF-Mirror|ModelScope> [--DownloadUVR5]
```

4. 拷贝 api-silicon.py 到 GPT-SoVITS 目录
``` bat
cd backend
copy /Y GPT-SoVITS-silicon-api\api-silicon.py GPT-SoVITS\api-silicon.py
```

#### Mac
1. 安装前端依赖
``` sh
cd frontend
npm install
```

2. 获取 GPT-SoVITS 仓库
``` sh
cd backend
git clone https://github.com/RVC-Boss/GPT-SoVITS.git
```

3. 安装 GPT-SoVITS
( 详见 GPT-SoVITS 仓库中的 ```README.md``` )
``` sh
cd backend/GPT-SoVITS
conda create -n GPTSoVits python=3.10
conda activate GPTSoVits
bash install.sh --device <MPS|CPU> --source <HF|HF-Mirror|ModelScope> [--download-uvr5]
```

4. 拷贝 api-silicon.py 到 GPT-SoVITS 目录
``` sh
cd backend
cp GPT-SoVITS-silicon-api/api-silicon.py GPT-SoVITS/api-silicon.py
```


---

## 2. 运行调试
### 2.1 后端启动

#### GPT-SoVITS
``` sh
cd backend/GPT-SoVITS
conda activate GPTSoVits
python api_silicon.py
```

(按需启动其他后端支持)

### 2.2 前端启动
启动前端之前, 请在```frontend/src/tokens/tokens.token.js```中正确配置大模型访问令牌
例如:
``` javascript
// file "tokens.token.js" at "frontend/src/tokens"
export default {
    glm: '95d5d******.hDK1******',
    coze: 'pat_AUQw******'
}
```
Demo 中可能需要使用 glm 的 token


``` sh
cd frontend
npm run serve
```

( 或者使用 ```npm run build``` 打包前端，然后使用nginx部署在```127.0.0.1:8080``` )