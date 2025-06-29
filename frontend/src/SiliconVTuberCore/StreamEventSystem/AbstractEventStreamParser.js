class AbstractEventStreamParser {
    constructor(params) {
        if (new.target === AbstractEventStreamParser) {
            throw new TypeError("Cannot construct AbstractEventStreamParser instances directly");
        }
        this._params = params;
    }

    parseDeltaMessageOfEvent(deltaMessage) {
        throw new Error("Method 'parseDeltaMessageOfEvent()' must be implemented.");
    }
}

export default AbstractEventStreamParser;