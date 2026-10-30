import { _decorator, Component, Node, input, Input, EventTouch, tween, Vec3, Tween, Sprite, SpriteFrame, UIOpacity, ProgressBar } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('WeaponHandsUI')
export class WeaponHandsUI extends Component {
    @property({ type: Node }) public leftBobContainer: Node = null;
    @property({ type: Node }) public rightBobContainer: Node = null;
    @property({ type: Node }) public rightAttackPivot: Node = null;

    @property({ type: Sprite }) public rightWeaponSprite: Sprite = null;
    @property({ type: Sprite }) public leftSupportSprite: Sprite = null;

    @property({ type: UIOpacity }) public damageOverlay: UIOpacity = null;

    @property({ type: ProgressBar, tooltip: 'UI полоска здоровья игрока' })
    public hpBar: ProgressBar = null;

    public currentDamage: number = 35;
    @property public maxHp: number = 100;
    @property public bobSpeed: number = 15;
    @property public bobHeight: number = 15;

    private _currentHp: number = 100;
    private _isMoving: boolean = false;
    private _isPlayerTurn: boolean = false;
    private _isGameOver: boolean = false;
    private _bobTime: number = 0;

    private _leftOriginalY: number = 0;
    private _rightOriginalY: number = 0;
    private readonly _rightAttackPos = new Vec3(-50, 50, 0);
    private readonly _zeroPos = new Vec3(0, 0, 0);

    protected onLoad() {
        this._currentHp = this.maxHp;
        this.updateHpUI();

        if (this.leftBobContainer) this._leftOriginalY = this.leftBobContainer.position.y;
        if (this.rightBobContainer) this._rightOriginalY = this.rightBobContainer.position.y;

        input.on(Input.EventType.TOUCH_START, this.onScreenTap, this);

        GlobalEvents.on(EventID.MOVE_CAMERA, this.startWalking, this);
        GlobalEvents.on(EventID.TURN_AND_MOVE, this.startWalking, this);
        GlobalEvents.on(EventID.CAMERA_STOPPED, this.stopWalking, this);
        GlobalEvents.on(EventID.ENEMY_DIED, this.onEnemyDied, this);
        GlobalEvents.on(EventID.LOOT_ACCEPTED, this.onLootAccepted, this);

        GlobalEvents.on(EventID.PLAYER_TURN_START, this.enablePlayerTurn, this);
        GlobalEvents.on(EventID.ENEMY_ATTACKED, this.takeDamage, this);
        GlobalEvents.on(EventID.PLAYER_DIED, this.onPlayerDied, this);
    }

    protected onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onScreenTap, this);
        GlobalEvents.targetOff(this);
    }

    private startWalking() {
        this._isMoving = true;
        this._isPlayerTurn = false;
        if (AudioManager.instance) AudioManager.instance.playWalkSound();
    }

    private stopWalking() {
        this._isMoving = false;
        this._bobTime = 0;

        if (AudioManager.instance) AudioManager.instance.stopWalkSound();

        if (this.leftBobContainer)
            tween(this.leftBobContainer)
                .to(0.2, {
                    position: new Vec3(this.leftBobContainer.position.x, this._leftOriginalY, 0)
                })
                .start();
        if (this.rightBobContainer)
            tween(this.rightBobContainer)
                .to(0.2, {
                    position: new Vec3(this.rightBobContainer.position.x, this._rightOriginalY, 0)
                })
                .start();

        this.enablePlayerTurn();
    }

    private enablePlayerTurn() {
        this._isPlayerTurn = true;
    }

    private onEnemyDied() {
        this._isPlayerTurn = false;
    }

    private onPlayerDied() {
        this._isGameOver = true;
        this._isPlayerTurn = false;
    }

    private onScreenTap(event: EventTouch) {
        if (this._isGameOver || !this._isPlayerTurn || !this.rightAttackPivot) return;

        this._isPlayerTurn = false;
        this.animateRightHand();
        GlobalEvents.emit(EventID.PLAYER_ATTACKED, this.currentDamage);
    }

    private animateRightHand() {
        Tween.stopAllByTarget(this.rightAttackPivot);
        tween(this.rightAttackPivot).to(0.08, { position: this._rightAttackPos }).to(0.1, { position: this._zeroPos }).start();
    }

    private takeDamage(damage: number) {
        if (this._currentHp <= 0) return;

        this._currentHp -= damage;
        if (this._currentHp < 0) this._currentHp = 0;

        this.updateHpUI();

        if (AudioManager.instance) AudioManager.instance.playPutSound();

        if (this.damageOverlay) {
            this.damageOverlay.opacity = 150;
            tween(this.damageOverlay).to(0.2, { opacity: 0 }).start();
        }

        if (this._currentHp <= 0) {
            console.log('☠️ Здоровье 0! Отправляем PLAYER_DIED');
            if (GlobalEvents) GlobalEvents.emit(EventID.PLAYER_DIED);
        }
    }

    private updateHpUI() {
        if (this.hpBar) {
            this.hpBar.progress = this._currentHp / this.maxHp;
        }
    }

    private onLootAccepted(itemType: string, bonus: number, newImage: SpriteFrame) {
        if (itemType === 'weapon') {
            this.currentDamage += bonus;
            if (newImage && this.rightWeaponSprite) this.rightWeaponSprite.spriteFrame = newImage;
        } else if (itemType === 'support') {
            this._currentHp += bonus;
            if (this._currentHp > this.maxHp) this._currentHp = this.maxHp;
            this.updateHpUI();

            if (newImage && this.leftSupportSprite) {
                this.leftSupportSprite.spriteFrame = newImage;
                this.leftSupportSprite.node.active = true;
            }
        }
    }

    protected update(dt: number) {
        if (!this._isMoving || !this.leftBobContainer || !this.rightBobContainer) return;
        this._bobTime += dt * this.bobSpeed;
        const offsetLeftY = Math.sin(this._bobTime) * this.bobHeight;
        this.leftBobContainer.setPosition(this.leftBobContainer.position.x, this._leftOriginalY + offsetLeftY, 0);
        const offsetRightY = Math.cos(this._bobTime) * this.bobHeight;
        this.rightBobContainer.setPosition(this.rightBobContainer.position.x, this._rightOriginalY + offsetRightY, 0);
    }
}
