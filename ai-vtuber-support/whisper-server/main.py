# whisper server main
import os
from flask import Flask, request, jsonify, make_response
from whisper import load_model, transcribe
from flask_cors import CORS
import json
import base64

app = Flask(__name__)


# 设置 CORS，允许所有来源的跨域请求
CORS(app, resources={
    "/upload": {  # 匹配所有/api/开头的路由
        "origins": ["http://localhost:8080"],  # 允许的域名
        "methods": ["GET", "POST", "PUT", "DELETE"],  # 允许的方法
        "allow_headers": ["Content-Type", "Authorization"],  # 允许的请求头
    }
})

# 加载 Whisper 模型，这里使用的是小模型 'base'，你可以根据需要选择其他模型
model = load_model("small")

print('ready!')

@app.route('/upload', methods=['POST'])
def upload_file():


    base64Data = json.loads(request.data.decode('utf-8'))['base64Data']
    binData = base64.b64decode(base64Data)

    temp_file_path = './temp_files/temp.wav'

    with open(temp_file_path, 'wb') as f:
        f.write(binData)

    '''
    'segments': [
        {'id': 0, 'seek': 0, 'start': 0.0, 'end': 11.0, 'text': '我刚才什么都没说,但是这个识别系统自己识别了', 'tokens': [50364, 1654, 49160, 18888, 10440, 7182, 10062, 8090, 11, 11189, 15368, 5233, 228, 18453, 25368, 10115, 253, 17645, 5233, 228, 18453, 2289, 50914], 'temperature': 0.0, 'avg_logprob': -0.24239826202392578, 'compression_ratio': 0.8767123287671232, 'no_speech_prob': 0.1974787563085556}
    ]
    '''

    # Whisper 处理音频文件
    result = model.transcribe(temp_file_path, language="zh")
    # 获取转录文本
    text = ''
    if result["text"] == '':
        text = ''
    else:
        segments = result["segments"]
        app.logger.info(segments)
        for segment in segments:
            # 过滤误识别的文本
            if segment["no_speech_prob"] < 0.25 and segment["avg_logprob"] > -1.0:
                text += segment["text"]

    app.logger.info(f"Raw Result: {result["text"]}, Filtered Result: {text}, no_speech_probs: {[segment["no_speech_prob"] for segment in result["segments"]]}")

    # # [DEBUG]
    # new_file_path = f'./history/result-{text}.wav'
    # os.rename(temp_file_path, new_file_path)

    return jsonify({'transcription': text}), 200

if __name__ == '__main__':
    app.run(port=8081, debug=True)
