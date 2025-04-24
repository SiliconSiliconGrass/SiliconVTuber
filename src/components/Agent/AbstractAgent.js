export default class AbstractAgent extends EventTarget {
    /**
     * Abstract Base Class For Agent
     */
    constructor() {
        super();
    }

    async respondToContext(messages) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    appendContext(text, role = 'user') {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}