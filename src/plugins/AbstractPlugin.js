export default class AbstractPlugin {
    constructor() {
        // do nothing
    }

    setup(agent) {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}