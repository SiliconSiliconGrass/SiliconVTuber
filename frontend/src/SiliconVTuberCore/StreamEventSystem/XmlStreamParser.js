class XmlStreamParser{
    constructor(eventParserDict){
        this._eventParserDict = eventParserDict;
        this._buffer = '';
        this._currentParser = null;
        this._currentTagName = '';
        // 移除 _depth 计数器
    }

    onReceiveDelta(delta) {
        this._buffer += delta;
        let cursor = 0;

        while (cursor < this._buffer.length) {
            if (!this._currentParser) {
                // 寻找开始标签起始位置
                const ltIndex = this._buffer.indexOf('<', cursor);
                if (ltIndex === -1) break;

                // 跳过注释和特殊标签
                if (this._buffer.startsWith('<!--', ltIndex) || 
                    this._buffer.startsWith('<?', ltIndex)) {
                    cursor = ltIndex + 1;
                    continue;
                }

                // 解析开始标签
                const gtIndex = this._buffer.indexOf('>', ltIndex);
                if (gtIndex === -1) break;

                const tagContent = this._buffer.slice(ltIndex + 1, gtIndex);
                // 使用正则表达式 \s+ 分割：
                // - \s 匹配任何空白字符（空格、制表符、换行符等）
                // - + 表示匹配一个或多个前面的字符
                // 最终将标签内容按空白符分割为 [标签名, 属性1, 属性2...]
                const [tagName, ...attrs] = tagContent.split(/\s+/);
                
                // 解析属性
                const params = {};
                for (const attr of attrs) {
                    const eqIndex = attr.indexOf('=');
                    if (eqIndex > 0) {
                        const key = attr.slice(0, eqIndex);
                        // 使用正则表达式去除属性值两端的引号：
                        // - ^['"] 匹配开头的单引号或双引号
                        // | 表示逻辑或
                        // ['"]$ 匹配结尾的单引号或双引号
                        const value = attr.slice(eqIndex + 1).replace(/^['"]|['"]$/g, '');
                        params[key] = value;
                    }
                }

                // 初始化解析器
                const ParserClass = this._eventParserDict[tagName];
                if (ParserClass) {
                    this._currentParser = new ParserClass(params);
                    this._currentTagName = tagName;
                    cursor = gtIndex + 1;
                    
                    // 立即发送空内容以支持自闭合标签
                    if (this._buffer.startsWith(`</${tagName}>`, gtIndex + 1)) {
                        this._currentParser.parseDeltaMessageOfEvent('');
                        this._currentParser = null;
                    }
                } else {
                    cursor = gtIndex + 1;
                }
            } else {
                // 流式处理标签内容（简化结束标签检测）
                const endTag = `</${this._currentTagName}>`;
                const endTagIndex = this._buffer.indexOf(endTag, cursor);
                
                if (endTagIndex !== -1) {
                    const content = this._buffer.slice(cursor, endTagIndex);
                    this._currentParser.parseDeltaMessageOfEvent(content);
                    this._currentParser = null;
                    cursor = endTagIndex + endTag.length;
                } else {
                    // 计算需要保留的缓冲区长度（结束标签长度-1）
                    const retainLength = endTag.length - 1;
                    const contentEnd = Math.max(cursor, this._buffer.length - retainLength);
                    
                    // 当没有新内容需要处理时退出循环
                    if (contentEnd <= cursor) {
                        break; // 新增退出条件防止死循环
                    }
                    
                    // 发送安全内容区域
                    const safeContent = this._buffer.slice(cursor, contentEnd);
                    this._currentParser.parseDeltaMessageOfEvent(safeContent);
                    
                    cursor = contentEnd;
                }
            }
        }
        
        this._buffer = this._buffer.slice(cursor);
    }
}

export default XmlStreamParser;