# whisper server main
import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import translate

app = Flask(__name__)

# 设置 CORS，允许所有来源的跨域请求
CORS(app, resources={
    "/translate": {
        "origins": ["http://localhost:8080"],  # 允许的域名
        "methods": ["GET", "POST", "PUT", "DELETE"],  # 允许的方法
        "allow_headers": ["Content-Type", "Authorization"],  # 允许的请求头
    }
})

@app.route('/translate', methods=['POST'])
def translateAPI():
    app.logger.info(request.data.decode('utf-8'))
    params = json.loads(request.data.decode('utf-8'))
    from_lang = params['from_lang']
    to_lang = params['to_lang']
    text = params['text']

    result = translate.Translator(from_lang="JA", to_lang="ZH").translate(text)

    app.logger.info(f'translate [{from_lang}]"{text}" -> [{to_lang}]"{result}"')

    return jsonify({'result': result}), 200

if __name__ == '__main__':
    app.run(port=8083, debug=True)
