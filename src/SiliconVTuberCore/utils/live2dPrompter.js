/**
 * Add the l2d motion and expression to the LLM Prompt.
 * @param {string} prompt {} 
 */
export function live2dPrompter(prompt, {motionDict, expressionDict}, language = 'zh'){
    const motions = motionDict;
    const expressions = expressionDict;
    if (language === 'zh'){
        prompt += '\n' + '在对话过程中，你可以改变表情或者做动作。若要这样，在文字之间插入以半角中括号包裹的标签。动作或表情必须从以下中选择。（不要自己瞎编！！！！！！）'+ '\n'
        prompt += '\n' + '可用的动作: ' + Object.keys(motions).join(', ') + '\n' + '可用的表情: ' + Object.keys(expressions).join(', ');
    }else if (language === 'jp'){
        prompt += '\n' + '会話中に表情を変えたり、アクションを行ったりすることができます。その場合は、半角の角括弧で囲まれたタグをテキストの間に挿入してください。アクションや表情は以下から選択してください。（勝手に作り出さないでください！！！！！！）' + '\n';
        prompt += '\n' + '利用可能なアクション: ' + Object.keys(motions).join(', ') + '\n' + '利用可能な表情: ' + Object.keys(expressions).join(', ');
    }else{
        throw new Error('Language not supported');
    }

    

    return prompt;
}