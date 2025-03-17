export default class AbstractPlugin {
    constructor() {
        // do nothing
    }

    /**
     * Attach this plugin to an agent (set non-blocking)
     * @param {Agent} agent parent agent
     */
    setup(agent) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }

    /**
     * Get extra prompt text for LLM (Blocking)
     * (returns a string, which will be appended to the end of prompt)
     * @param {Agent} agent parent agent
     * @param {String} userInput user's latest input
     */
    async queryToLLM(agent, userInput) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}