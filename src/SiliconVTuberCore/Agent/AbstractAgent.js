export default class AbstractAgent extends EventTarget {
    /**
     * Abstract Base Class For Agent
     */
    constructor() {
        super();
        this.plugins = [];
    }

    async respondToContext(messages) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    appendContext(text, role = 'user') {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    /**
     * 挂载插件
     * @param {VTuberPlugin} plugin 插件对象（需提供setup方法）
     */
    addPlugin(plugin) {
        plugin.setup(this);
        if (!Array.isArray(this.plugins)) this.plugins = [];
        this.plugins.push(plugin);
    }
}