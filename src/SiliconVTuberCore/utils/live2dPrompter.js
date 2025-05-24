/**
 * Add the l2d motion and expression to the LLM Prompt.
 * @param {string} prompt {} 
 */
export function live2dPrompter(prompt, {motionDict, expressionDict}){
    var motions = motionDict;
    var expressions = expressionDict;

    prompt += '\n' + '在对话过程中，你可以改变表情或者做动作。若要这样，在文字之间插入以半角中括号包裹的标签。动作或表情必须从以下中选择。（不要自己瞎编！！！！！！）'+ '\n'
    prompt += '\n' + '可用的动作: ' + Object.keys(motions).join(', ') + '\n' + '可用的表情: ' + Object.keys(expressions).join(', ');

    return prompt;
}