import { _decorator, Component, Node, input, Input, EventTouch, Vec3, tween, SpriteFrame, Sprite } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
import { LootItemData } from './LootItemData';
const { ccclass, property } = _decorator;

@ccclass('DraggableLootCard')
export class DraggableLootCard extends Component {
    @property({ type: [LootItemData] })
    public possibleLoots: LootItemData[] = [];

    @property(Sprite)
    public cardIconSprite: Sprite = null;

    @property public swipeThreshold: number = 150;

    private _currentType: string = 'weapon';
    private _currentBonus: number = 0;
    private _currentImage: SpriteFrame = null;

    private readonly _startPos: Vec3 = new Vec3();
    private readonly _currentPos: Vec3 = new Vec3();
    private readonly _currentRot: Vec3 = new Vec3();

    protected onLoad() {
        this._startPos.set(this.node.position);
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    protected onEnable() {
        this.generateRandomLoot();
    }

    private generateRandomLoot() {
        if (this.possibleLoots.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.possibleLoots.length);
        const selectedLoot = this.possibleLoots[randomIndex];

        this._currentType = selectedLoot.type;
        this._currentBonus = selectedLoot.bonus;
        this._currentImage = selectedLoot.image;

        if (this.cardIconSprite && this._currentImage) {
            this.cardIconSprite.spriteFrame = this._currentImage;
        }
    }

    private onTouchStart(event: EventTouch) {
        tween(this.node).stop();
        this._currentPos.set(this.node.position);
    }

    private onTouchMove(event: EventTouch) {
        const delta = event.getUIDelta();
        this._currentPos.x += delta.x;
        this._currentPos.y += delta.y;
        this.node.setPosition(this._currentPos);

        const diffX = this._currentPos.x - this._startPos.x;
        this._currentRot.z = -diffX * 0.05;
        this.node.eulerAngles = this._currentRot;
    }

    private onTouchEnd() {
        const diffX = this._currentPos.x - this._startPos.x;

        if (diffX > this.swipeThreshold) {
            this.acceptLoot();
        } else if (diffX < -this.swipeThreshold) {
            this.rejectLoot();
        } else {
            this._currentRot.set(0, 0, 0);
            tween(this.node).to(0.3, { position: this._startPos, eulerAngles: this._currentRot }, { easing: 'backOut' }).start();
        }
    }

    private acceptLoot() {
        if (GlobalEvents) GlobalEvents.emit(EventID.LOOT_ACCEPTED, this._currentType, this._currentBonus, this._currentImage);
        this.closeScreen();
    }

    private rejectLoot() {
        if (GlobalEvents) GlobalEvents.emit(EventID.LOOT_REJECTED);
        this.closeScreen();
    }

    private closeScreen() {
        this._currentRot.set(0, 0, 0);
        this.node.setPosition(this._startPos);
        this.node.eulerAngles = this._currentRot;
        if (this.node.parent) this.node.parent.active = false;
    }
}
