// TODO

/**
 * 字幕控制
 * @param element 字幕对应的DOM元素
 */
export default class SubtitleHandler {
    constructor(element) {
        this.element = element;
        this.text = '';
        this.timeoutId = null;
    }

    step(self) {
        // if (this.text.length > 10000) {
        //     this.element.innerHTML += this.text;
        //     this.text = ''
        // }
        if (this.text  !== '') {
            this.element.innerHTML += this.text[0];
            this.text = this.text.slice(1);
        }

        if (this.text  !== '') {
            let sleepTime = 50;
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => this.step(self), sleepTime);
        } else {
            this.timeoutId = null;
        }
    }

    add(text) {
        this.text += text;
        if (!this.timeoutId) {
            this.timeoutId = setTimeout(() => this.step(this), 1);
        }
    }

    clear() {
        this.text = '';
        this.element.innerHTML = '';
    }
}