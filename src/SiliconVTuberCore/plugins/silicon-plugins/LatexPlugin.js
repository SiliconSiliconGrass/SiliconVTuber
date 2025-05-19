import AbstractPlugin from "../AbstractPlugin";
import { render } from "katex";

/**
 * LaTeX 插件
 * 显示LaTeX
 * @param {HTMLDivElement} latexSourceArea
 * @param {HTMLDivElement} latexRenderArea
 */
export default class LatexPlugin extends AbstractPlugin {
    constructor({latexSourceArea, latexRenderArea}) {
        super();
        this.latexSource = latexSourceArea;
        this.latexRender = latexRenderArea
    }

    setup(agent) {
        if (this.agent) {
            console.warn('This plugin is already initialized! Do not call setup() again!');
            return;
        }
        this.agent = agent;
        agent.addEventListener('latex_update', (e) => {
            let latex = e.detail.latex;
            if (this.latexSource) {
                this.latexSource.innerHTML = latex;
            }

            if (this.latexRender) {
                // this.latexRender.innerHTML = renderrenToString(latex);
                render(latex, this.latexRender, {throwOnError: false});
            }
        })
    }

    async queryToLLM(agent, userInput) {
        return '';
    }
}
