import { _decorator, Component, tween, Vec3 } from 'cc';
import { AudioManager } from './AudioManager';
import { GlobalEvents, EventID } from './EventBus';

const { ccclass } = _decorator;

@ccclass('CtaScreen')
export class CtaScreen extends Component {
    private readonly hiddenScale: Vec3 = new Vec3(0, 0, 0);
    private readonly normalScale: Vec3 = new Vec3(1, 1, 1);

    protected onLoad() {
        console.log('✅ CtaScreen ЗАГРУЖЕН НА СЦЕНУ!');
        this.node.active = false;

        GlobalEvents.on(EventID.PLAYER_DIED, this.show, this);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    public show() {
        console.log('🎬 Сигнал получен! Включаем CTA');
        this.node.active = true;
        this.node.setScale(this.hiddenScale);

        if (AudioManager.instance) {
            AudioManager.instance.playCtaSound();
        }

        tween(this.node).to(0.4, { scale: this.normalScale }, { easing: 'backOut' }).start();
    }
}
