export default class AbstractTranslator {
    constructor() {
        // do nothing
    }

    /**
     * 
     * @param {string} text 需要翻译的内容
     * @param {Object} config 配置与其他信息，如翻译语言等 (可选)
     */
    async translate(text) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}