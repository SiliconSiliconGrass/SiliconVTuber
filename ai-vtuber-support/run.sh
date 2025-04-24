cmd1="cd whisper-server; conda activate base; python main.py"
cmd2="cd memory-manager; conda activate base; python main.py"
cmd3="cd GPT-SoVITS; conda activate gptsovits; python api.py -sm \"n\""

#!/bin/bash

# 打开第1个Terminal窗口并执行命令(Whisper Server)
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/indexerror/Documents/MyStuff/Projects/VueProjects/ai-vtuber-vue/ai-vtuber-support/whisper-server; conda activate base; python main.py"
end tell
EOF

# 打开第2个Terminal窗口并执行命令(Memory Manager)
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/indexerror/Documents/MyStuff/Projects/VueProjects/ai-vtuber-vue/ai-vtuber-support/memory-manager; conda activate base; python main.py"
end tell
EOF

# 打开第3个Terminal窗口并执行命令(GPT-SoVITS)
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/indexerror/Documents/MyStuff/Projects/VueProjects/ai-vtuber-vue/ai-vtuber-support/GPT-SoVITS; conda activate gptsovits; python api.py -sm \"n\""
end tell
EOF

# 打开第4个Terminal窗口并执行命令(Translator)
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/indexerror/Documents/MyStuff/Projects/VueProjects/ai-vtuber-vue/ai-vtuber-support/translator; conda activate base; python main.py"
end tell
EOF

exit