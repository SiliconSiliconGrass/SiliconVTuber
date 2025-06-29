@echo off
setlocal enabledelayedexpansion

:: 颜色定义
for /f "delims=#" %%a in ('"prompt #$E# & for %%b in (1) do rem"') do set "ESC=%%a"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "NC=%ESC%[0m"

:: 错误处理函数
:error
    echo %RED%Error: %1 failed with error code !errorlevel!%NC%
    exit /b 1

:: 主程序
echo %BLUE%========================================%NC%
echo %BLUE%      Windows 项目安装脚本              %NC%
echo %BLUE%========================================%NC%
echo 此脚本将执行以下步骤：
echo 1. 安装前端依赖 (cd frontend && npm install)
echo 2. 克隆 GPT-SoVITS 仓库到 backend\GPT-SoVITS
echo 3. 设置 GPT-SoVITS 环境（需要用户输入参数）
echo    创建conda环境并运行install.ps1脚本
echo 4. 拷贝API文件到 GPT-SoVITS 目录
echo    从 backend\GPT-SoVITS-silicon-api\ 拷贝 api_silicon.py
echo %YELLOW%
echo 注意：
echo   - 如果任何步骤失败，脚本将立即退出！
echo   - 请确保已安装以下依赖：
echo       - Git
echo       - Node.js
echo       - Miniconda/Anaconda
echo       - PowerShell 7+
echo       - Git需配置为可在命令行使用
echo       - Conda需初始化（即conda命令在PATH中）%NC%
echo %YELLOW%请阅读以上说明，准备好后按Enter键开始安装...%NC%

:: 等待用户按Enter键确认
set /p DUMMY="按Enter键继续，或按Ctrl+C取消..."

echo.
echo 开始执行...
echo %BLUE%========================================%NC%
echo.

:: 步骤1: 安装前端依赖
echo %BLUE%Step 1: 安装前端依赖...%NC%
cd frontend
if !errorlevel! neq 0 (
    call :error "进入 frontend 目录"
)
echo 正在执行 npm install...
npm install
if !errorlevel! neq 0 (
    call :error "npm install"
)
echo %GREEN%前端依赖安装成功！%NC%
cd..

:: 步骤2: 克隆 GPT-SoVITS 仓库
echo.
echo %BLUE%Step 2: 克隆 GPT-SoVITS 仓库...%NC%
cd backend
if !errorlevel! neq 0 (
    call :error "进入 backend 目录"
)

:: 检查目录是否为空
if exist GPT-SoVITS\ (
    dir GPT-SoVITS /b >nul 2>&1
    if !errorlevel! equ 0 (
        echo GPT-SoVITS 目录不为空，跳过克隆
    ) else (
        echo GPT-SoVITS 目录为空，执行克隆
        git clone https://github.com/RVC-Boss/GPT-SoVITS.git
        if !errorlevel! neq 0 (
            call :error "git clone"
        )
    )
) else (
    echo 克隆仓库: https://github.com/RVC-Boss/GPT-SoVITS.git
    git clone https://github.com/RVC-Boss/GPT-SoVITS.git
    if !errorlevel! neq 0 (
        call :error "git clone"
    )
)

echo %GREEN%GPT-SoVITS 克隆完成！%NC%
cd..

:: 步骤3: 安装 GPT-SoVITS
echo.
echo %BLUE%Step 3: 设置 GPT-SoVITS 环境...%NC%
cd backend\GPT-SoVITS
if !errorlevel! neq 0 (
    call :error "进入 GPT-SoVITS 目录"
)

:: 用户提示
echo %YELLOW%需要为 GPT-SoVITS 安装提供一些参数：
echo 1. 设备类型:
echo    - CU126: NVIDIA GPU (CUDA 12.6)
echo    - CU128: NVIDIA GPU (CUDA 12.8)
echo    - CPU: 通用 CPU 模式 (默认值)
echo 2. 安装源:
echo    - HF: HuggingFace 源
echo    - HF-Mirror: HuggingFace 镜像源
echo    - ModelScope: 阿里云模型源 (默认值)
echo 3. 额外选项:
echo    - --DownloadUVR5: 额外安装 UVR5 模型 (可选)
echo.
echo 若无特殊要求，建议直接回车使用默认值！%NC%
echo.

:: 检查 PowerShell 7+ 是否安装
echo 检查 PowerShell 7+ 可用性...
pwsh --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%错误: 未检测到 PowerShell 7+%NC%
    echo %YELLOW%请从 Microsoft Store 或以下链接安装:
    echo https://aka.ms/powershell-release?tag=stable%NC%
    exit /b 1
)
echo %GREEN%检测到 PowerShell 7+%NC%

:: 获取用户输入 (带默认值)
set "DEVICE=CPU"
set "SOURCE=ModelScope"
set "DOWNLOAD_UVR5="

set /p "DEVICE_IN=请输入设备类型 [CU126|CU128|CPU] (默认 CPU): "
if not "!DEVICE_IN!"=="" set "DEVICE=!DEVICE_IN!"

set /p "SOURCE_IN=请输入安装源 [HF|HF-Mirror|ModelScope] (默认 ModelScope): "
if not "!SOURCE_IN!"=="" set "SOURCE=!SOURCE_IN!"

set /p "DOWNLOAD_UVR5_IN=是否安装 UVR5? [y/N] (默认 no): "
if /i "!DOWNLOAD_UVR5_IN!"=="y" set "DOWNLOAD_UVR5=--DownloadUVR5"

:: 创建 conda 环境
echo 正在创建 conda 环境...
call conda create -n GPTSoVits python=3.10 -y
if !errorlevel! neq 0 (
    echo %YELLOW%警告: Conda 环境创建失败或已存在，继续执行...%NC%
)

:: 激活 conda 环境
echo 正在激活 conda 环境...
call conda activate GPTSoVits
if !errorlevel! neq 0 (
    call :error "激活 conda 环境"
)

:: 运行安装脚本 - 使用 PowerShell 7+
echo 执行安装命令: pwsh -F install.ps1 --Device %DEVICE% --Source %SOURCE% %DOWNLOAD_UVR5%
pwsh -F install.ps1 --Device %DEVICE% --Source %SOURCE% %DOWNLOAD_UVR5%
if !errorlevel! neq 0 (
    call :error "install.ps1 执行失败"
)

echo %GREEN%GPT-SoVITS 设置完成！%NC%
cd..\..

:: 步骤4: 拷贝 API 文件
echo.
echo %BLUE%Step 4: 拷贝 API 文件...%NC%
set "SRC=backend\GPT-SoVITS-silicon-api\api_silicon.py"
set "DEST=backend\GPT-SoVITS\"

if not exist "%SRC%" (
    call :error "源文件 %SRC% 不存在"
)

if not exist "%DEST%" (
    call :error "目标目录 %DEST% 不存在"
)

echo 正在拷贝文件: %SRC% ^> %DEST%
copy /y "%SRC%" "%DEST%" >nul
if !errorlevel! neq 0 (
    call :error "文件拷贝"
)
echo %GREEN%API 文件拷贝成功！%NC%

:: 全部完成
echo.
echo %GREEN%========================================%NC%
echo %GREEN%          安装成功完成！              %NC%
echo %GREEN%========================================%NC%
echo.
echo 后续步骤:
echo 1. 启动前端: cd frontend && npm run dev
echo 2. 启动后端 API 服务:
echo    cd backend\GPT-SoVITS
echo    conda activate GPTSoVits
echo    python api_silicon.py
echo.
echo %GREEN%项目准备就绪，祝您使用愉快！%NC%
echo.

endlocal