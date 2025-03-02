export default class AbstractBot extends EventTarget {
    /**
     * Abstract Bot Class
     */
    constructor() {
        super();
        this.messages = [];
    }

    appendContext(text, role = 'user') {
        this.messages.push({
            role: role,
            content: text,
            content_type: "text"
        });
    }
    
    async setup() {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    async respondTo(message) {
        /**
         * To send a chat message to coze bot, and return its response
         * @param message [string]
         */
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    async respondToContext(messages) {
        /**
         * To send recorded history messages to coze bot, and return its response
         * @param messages recorded history messages (Array<Object>)
         */
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}