export default class AbstractPlugin {
    constructor() {
        // do nothing
    }

    setup(agent) {
        /**
         * Attach this plugin to an agent (set non-blocking)
         */
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    async queryToLLM(agent, userInput) {
        /**
         * Get extra prompt text for LLM (Blocking)
         * (returns a string, which will be appended to the end of prompt)
         */
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}