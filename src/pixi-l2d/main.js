// run this to tell git not to track this file
// git update-index --skip-worktree test/playground/index.ts

import { Application, Ticker, Color } from "pixi.js";
import { FocusController, Live2DModel, MotionPriority } from "pixi-live2d-display";

const modelURL = "/Resources/mikoto/mikoto.model.json";
// const modelURL = "/Resources/Mao/Mao.model3.json";

const MISAKA_MOTIONS = {
    'akimbo': 0,
    'raise_one_hand': 1
}

const MISAKA_EXPRESSIONS = {
    'no_expression': 0,
    'smile': 1,
    'frown': 2,
    'doubtful': 3,
    'smile_with_eyes_closed': 4,
    'shocked': 5,
    'blush': 6,
};

const MOTION_DICT     = MISAKA_MOTIONS;
const EXPERSSION_DICT = MISAKA_EXPRESSIONS;

function launchMotion(model, motionName) {
    if (motionName in MOTION_DICT) {
        model.motion('tap', MOTION_DICT[motionName], MotionPriority.FORCE);
    }
}

function setExpression(model, expressionName) {
    if (expressionName in EXPERSSION_DICT) {
        model.expression(EXPERSSION_DICT[expressionName]);
    }
}

export default async function pixi_l2d_Setup() {
    Live2DModel.registerTicker(Ticker);
    const app = new Application({
        resizeTo: window,
    });

    

    app.view.setAttribute("id", "main-canvas");
    document.body.appendChild(app.view);
    
    console.log(app.view.width, app.view.height);

    window.app = app;

    app.renderer.backgroundAlpha = 0;

    const model = await Live2DModel.from(modelURL);
    window.model = model;

    const scale = app.view.height / model.height;
    
    model.anchor.set(0.5, 0.5);
    model.scale.set(scale, scale);
    model.x = app.view.width / 2;
    model.y = app.view.height / 2;

    app.stage.addChild(model); // add model to stage

    // Mouse Focus Is Banned
    let focusController = new FocusController();
    focusController.focus = () => {};
    focusController.update = () => {};
    model.internalModel.focusController = focusController;

    window.addEventListener('resize', () => {

        // resize canvas
        app.view.style.position = 'absolute';
        app.view.width = app.view.clientWidth;
        app.view.height = app.view.clientHeight;
        app.renderer.resize(app.view.clientWidth, app.view.clientHeight);

        // reset position and scale of model
        const scale = app.view.height / model.height;
        model.anchor.set(0.5, 0.5);
        model.scale.set(scale, scale);

        console.log('resize', app.view.width, app.view.height);
        model.anchor.set(0.5, 0.5);
        model.x = app.view.width / 2;
        model.y = app.view.height / 2;
        console.log('model pos', model.x, model.y)
    });

    let trigger = document.getElementById('l2dEventTrigger');
    if (trigger) {
        trigger.addEventListener('launchMotion', (e) => {
            launchMotion(model, e.motionName);
        });

        trigger.addEventListener('setExpression', (e) => {
            setExpression(model, e.expressionName);
        });
    }

    /* lip sync */
    function lipSyncLoop() {
        let ele = document.getElementById('lipSyncVal');
        if (ele) {
            let value = Number(ele.innerHTML);
            try {
                // Cubism 2: coreModel.setParamFloat
                model.internalModel.coreModel.setParamFloat("PARAM_MOUTH_OPEN_Y", value);
            } catch(e) {
                // model.internalModel.coreModel.setParameterValueById('ParamMouthUp', 1);
                model.internalModel.coreModel.setParameterValueById('ParamA', value, 1.0);
            }
        }

        app.view.width = app.view.offsetWidth;
        app.view.height = app.view.offsetHeight;

        requestAnimationFrame(lipSyncLoop);
    }

    lipSyncLoop();

}
