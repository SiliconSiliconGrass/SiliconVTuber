#!/bin/bash

# 设置错误处理：任何命令失败立即退出脚本
set -e

# 颜色定义
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
NC='\033[0m' # 重置颜色

# 定义错误处理函数
handle_error() {
    echo -e "${RED}Error: $1 failed with exit code $?${NC}" >&2
    exit 1
}

# 初始说明
echo -e "${BLUE}\n========================================${NC}"
echo -e "${BLUE}       MacOS 项目安装脚本                ${NC}"
echo -e "${BLUE}========================================${NC}"
echo "此脚本将执行以下步骤："
echo "1. 安装前端依赖 (cd frontend && npm install)"
echo "2. 克隆 GPT-SoVITS 仓库到 backend/GPT-SoVITS"
echo "3. 设置 GPT-SoVITS 环境（需要用户输入参数）"
echo "   创建conda环境并运行install.sh脚本"
echo "4. 拷贝API文件到 GPT-SoVITS 目录"
echo "   从 backend/GPT-SoVITS-silicon-api/ 拷贝 api_silicon.py"
echo -e "${YELLOW}\n注意：如果任何步骤失败，脚本将立即退出！${NC}"
echo -e "${YELLOW}\n请阅读以上说明，准备好后按Enter键开始安装...${NC}"

# 等待用户按Enter键确认
read -p "按Enter键继续，或按Ctrl+C取消..." </dev/tty

echo -e "\n开始执行..."
echo -e "${BLUE}========================================${NC}\n"

# 步骤1: 安装前端依赖
echo -e "${BLUE}Step 1: 安装前端依赖...${NC}"
(
    cd frontend || handle_error "进入 frontend 目录失败"
    echo "正在执行 npm install"
    npm install || handle_error "npm install 失败"
    echo -e "${GREEN}前端依赖安装成功！${NC}"
)

# 步骤2: 克隆 GPT-SoVITS 仓库
echo -e "${BLUE}\nStep 2: 克隆 GPT-SoVITS 仓库...${NC}"
(
    cd backend || handle_error "进入 backend 目录失败"
    
    # 检查目录是否为空
    if [ -d "GPT-SoVITS" ]; then
        if [ "$(ls -A GPT-SoVITS)" ]; then
            echo "GPT-SoVITS 目录不为空，跳过克隆"
        else
            echo "GPT-SoVITS 目录为空，执行克隆"
            git clone https://github.com/RVC-Boss/GPT-SoVITS.git || handle_error "git clone 失败"
        fi
    else
        echo "克隆仓库: https://github.com/RVC-Boss/GPT-SoVITS.git"
        git clone https://github.com/RVC-Boss/GPT-SoVITS.git || handle_error "git clone 失败"
    fi
    
    echo -e "${GREEN}GPT-SoVITS 克隆完成！${NC}"
)

# 步骤3: 安装 GPT-SoVITS
echo -e "${BLUE}\nStep 3: 设置 GPT-SoVITS 环境...${NC}"
(
    cd backend/GPT-SoVITS || handle_error "进入 GPT-SoVITS 目录失败"
    
    # 用户提示
    echo -e "${YELLOW}需要为 GPT-SoVITS 安装提供一些参数："
    echo "1. 设备类型:"
    echo "   - MPS: Apple Silicon 优化模式 (建议 M1/M2/M3 用户使用)"
    echo "   - CPU: 通用 CPU 模式 (默认值)"
    echo "2. 安装源:"
    echo "   - HF: HuggingFace 源"
    echo "   - HF-Mirror: HuggingFace 镜像源"
    echo "   - ModelScope: 阿里云模型源 (默认值)"
    echo "3. 额外选项:"
    echo "   - --download-uvr5: 额外安装 UVR5 模型 (可选)"
    echo -e "${NC}"
    echo -e "${YELLOW}若无特殊要求，建议直接回车使用默认值！${NC}"
    
    # 获取用户输入 (带默认值)
    read -rp "请输入设备类型 [MPS|CPU] (默认 CPU): " DEVICE
    DEVICE=${DEVICE:-CPU}
    
    read -rp "请输入安装源 [HF|HF-Mirror|ModelScope] (默认 ModelScope): " SOURCE
    SOURCE=${SOURCE:-ModelScope}
    
    read -rp "是否安装 UVR5? [y/N] (默认 no): " DOWNLOAD_UVR5
    if [[ $DOWNLOAD_UVR5 =~ ^[Yy]$ ]]; then
        UVR5_FLAG="--download-uvr5"
    else
        UVR5_FLAG=""
    fi
    
    # 创建 conda 环境
    echo "正在创建 conda 环境..."
    if ! conda create -n GPTSoVits python=3.10 -y; then
        echo -e "${YELLOW}警告: Conda 环境创建失败或已存在，继续执行...${NC}"
    fi
    
    # 激活 conda 环境
    echo "正在激活 conda 环境..."
    eval "$(conda shell.bash hook)"
    conda activate GPTSoVits || handle_error "激活 conda 环境失败"
    
    # 运行安装脚本
    echo "执行安装命令: bash install.sh --device $DEVICE --source $SOURCE $UVR5_FLAG"
    bash install.sh --device "$DEVICE" --source "$SOURCE" $UVR5_FLAG || handle_error "install.sh 执行失败"
    
    echo -e "${GREEN}GPT-SoVITS 设置完成！${NC}"
)

# 步骤4: 拷贝 API 文件
echo -e "${BLUE}\nStep 4: 拷贝 API 文件...${NC}"
SRC="backend/GPT-SoVITS-silicon-api/api_silicon.py"
DEST="backend/GPT-SoVITS/"

if [ ! -f "$SRC" ]; then
    handle_error "源文件 $SRC 不存在"
fi

if [ ! -d "$DEST" ]; then
    handle_error "目标目录 $DEST 不存在"
fi

echo "正在拷贝文件: $SRC -> $DEST"
cp "$SRC" "$DEST" || handle_error "文件拷贝失败"
echo -e "${GREEN}API 文件拷贝成功！${NC}"

# 全部完成
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}          安装成功完成！               ${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo "后续步骤:"
echo "1. 启动前端: cd frontend && npm run dev"
echo "2. 启动后端 API"
echo "3. 使用前记得激活 conda 环境:"
echo "   conda activate GPTSoVits"
echo -e "\n${GREEN}项目准备就绪，祝您使用愉快！${NC}\n"