import { _decorator, Component, Node, instantiate, Prefab, Vec3, Label, tween, UIOpacity } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('DamageTextPool')
export class DamageTextPool extends Component {
    @property(Prefab) damageTextPrefab: Prefab = null;
    @property poolSize: number = 5;

    private _pool: Node[] = [];
    private readonly _upVector: Vec3 = new Vec3(0, 100, 0);

    protected onLoad() {
        for (let i = 0; i < this.poolSize; i++) {
            const node = instantiate(this.damageTextPrefab);
            node.active = false;
            this.node.addChild(node);
            this._pool.push(node);
        }
        GlobalEvents.on(EventID.ENEMY_DAMAGED, this.showDamage, this);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    private showDamage(amount: number, worldPos: Vec3) {
        const node = this._pool.find((n) => !n.active);
        if (!node) return;

        node.active = true;

        node.setPosition(0, 50, 0);

        const label = node.getComponent(Label);
        if (label) label.string = amount.toString();

        const uiOpacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        uiOpacity.opacity = 255;

        tween(node).by(0.5, { position: this._upVector }).start();

        tween(uiOpacity)
            .to(0.5, { opacity: 0 })
            .call(() => {
                node.active = false;
                node.setPosition(0, 0, 0);
            })
            .start();
    }
}
