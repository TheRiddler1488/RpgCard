import { _decorator, Component, Vec3, tween, easing, Tween, Node, director } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('TutorialHand')
export class TutorialHand extends Component {
    @property({ tooltip: 'Начальная точка (над центральной фигурой внизу)' })
    startPos: Vec3 = new Vec3(0, -380, 0);

    @property({ tooltip: 'Конечная точка (центр игрового поля)' })
    endPos: Vec3 = new Vec3(0, 50, 0);

    private readonly scaleIdle: Vec3 = new Vec3(1, 1, 1);
    private readonly scalePressed: Vec3 = new Vec3(0.85, 0.85, 1);
    private readonly scaleHidden: Vec3 = new Vec3(0, 0, 1);

    private handTween: Tween<any> = null;
    private isHidden: boolean = false;
    private canvasNode: Node = null;

    protected onLoad() {
        this.canvasNode = director.getScene()?.getChildByName('Canvas');
        if (this.canvasNode) {
            this.canvasNode.on(Node.EventType.TOUCH_START, this.hide, this, true);
        }
    }

    protected start() {
        this.playSwipeLoop();
    }

    protected onDestroy() {
        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.hide, this, true);
        }
    }

    private playSwipeLoop() {
        if (this.isHidden) return;

        this.node.setPosition(this.startPos);
        this.node.setScale(this.scaleIdle);

        this.handTween = tween(this.node)
            .repeatForever(tween().set({ position: this.startPos, scale: this.scaleIdle }).to(0.2, { scale: this.scalePressed }, { easing: easing.quadOut }).to(0.7, { position: this.endPos }, { easing: easing.sineInOut }).to(0.15, { scale: this.scaleIdle }, { easing: easing.quadIn }).to(0.15, { scale: this.scaleHidden }).delay(0.3))
            .start();
    }

    public hide() {
        if (this.isHidden) return;
        this.isHidden = true;

        if (this.canvasNode && this.canvasNode.isValid) {
            this.canvasNode.off(Node.EventType.TOUCH_START, this.hide, this, true);
        }

        if (this.handTween) {
            this.handTween.stop();
            this.handTween = null;
        }
        this.node.active = false;

        if (GlobalEvents) GlobalEvents.emit(EventID.GAME_STARTED);
    }
}
