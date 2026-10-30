import { _decorator, Component, Node, ProgressBar, Sprite, Color, tween, Vec3, Camera, Tween, SpriteFrame, find } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
import { Waypoint } from './Waypoint';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

@ccclass('EnemyEntity')
export class EnemyEntity extends Component {
    @property public maxHp: number = 100;
    @property public attackDamage: number = 15;

    @property(ProgressBar) public hpBar: ProgressBar = null;
    @property(Sprite) public spriteRenderer: Sprite = null;

    @property({
        type: SpriteFrame,
        tooltip: 'Спрайт врага в спокойном состоянии'
    })
    public idleSprite: SpriteFrame = null;

    @property({
        type: SpriteFrame,
        tooltip: 'Спрайт врага во время замаха/атаки'
    })
    public attackSprite: SpriteFrame = null;

    @property(Camera) public mainCamera: Camera = null;
    @property public spawnDistance: number = 120;

    private _currentHp: number = 0;
    private readonly _dirToCam = new Vec3();
    private _isAlive: boolean = true;
    private _hasAppeared: boolean = false;

    private readonly _flashColor = new Color(255, 0, 0, 255);
    private readonly _defaultColor = new Color(255, 255, 255, 255);
    private readonly _normalScale = new Vec3(1, 1, 1);
    private readonly _attackScale = new Vec3(1.3, 1.3, 1);
    private readonly _idleUp = new Vec3(0, 0.3, 0);
    private readonly _idleDown = new Vec3(0, -0.3, 0);

    private _idleTween: Tween<Node> = null;

    protected onLoad() {
        this._currentHp = this.maxHp;

        if (!this.mainCamera) {
            const camNode = find('Main Camera');
            if (camNode) this.mainCamera = camNode.getComponent(Camera);
        }

        if (this.idleSprite && this.spriteRenderer) {
            this.spriteRenderer.spriteFrame = this.idleSprite;
        }

        GlobalEvents.on(EventID.PLAYER_ATTACKED, this.takeDamage, this);
        GlobalEvents.on(EventID.ENEMY_TURN_START, this.onEnemyTurn, this);
        this.updateUI();
    }

    protected start() {
        this.node.scale = new Vec3(0, 0, 0);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    protected update() {
        if (this._hasAppeared || !this.mainCamera) return;
        const dist = Vec3.distance(this.node.worldPosition, this.mainCamera.node.worldPosition);
        if (dist <= this.spawnDistance) {
            this._hasAppeared = true;
            this.playSpawnAnimation();
        }
    }

    private playSpawnAnimation() {
        tween(this.node)
            .to(0.4, { scale: this._normalScale }, { easing: 'backOut' })
            .call(() => {
                this.startIdleAnimation();
            })
            .start();
    }

    private startIdleAnimation() {
        this._idleTween = tween(this.node).by(1.0, { position: this._idleUp }, { easing: 'sineInOut' }).by(1.0, { position: this._idleDown }, { easing: 'sineInOut' }).union().repeatForever().start();
    }

    private takeDamage(damage: number) {
        if (!this._isAlive || !this._hasAppeared || !this.mainCamera) return;

        const enemyPos = this.node.worldPosition;
        const camPos = this.mainCamera.node.worldPosition;

        this._dirToCam.set(enemyPos.x - camPos.x, 0, enemyPos.z - camPos.z);
        const dist = this._dirToCam.length();
        this._dirToCam.normalize();

        const camFwd = this.mainCamera.node.forward;
        const camForward2D = new Vec3(camFwd.x, 0, camFwd.z).normalize();

        const dot = Vec3.dot(camForward2D, this._dirToCam);
        const wp = this.getComponent(Waypoint);
        const combatDist = wp ? wp.stopOffset + 80 : 200;

        if (dot < 0.7 || dist > combatDist) {
            return;
        }

        if (AudioManager.instance) AudioManager.instance.playPopSound();

        this._currentHp -= damage;
        GlobalEvents.emit(EventID.ENEMY_DAMAGED, damage, this.node.worldPosition);
        this.flashRed();
        this.updateUI();

        if (this._currentHp <= 0) {
            this._currentHp = 0;
            this.die();
        } else {
            this.scheduleOnce(() => {
                if (GlobalEvents) GlobalEvents.emit(EventID.ENEMY_TURN_START);
            }, 0.5);
        }
    }

    private onEnemyTurn() {
        if (!this._isAlive || !this.mainCamera) return;

        const enemyPos = this.node.worldPosition;
        const camPos = this.mainCamera.node.worldPosition;

        this._dirToCam.set(enemyPos.x - camPos.x, 0, enemyPos.z - camPos.z);
        const dist = this._dirToCam.length();
        this._dirToCam.normalize();

        const camFwd = this.mainCamera.node.forward;
        const camForward2D = new Vec3(camFwd.x, 0, camFwd.z).normalize();

        const dot = Vec3.dot(camForward2D, this._dirToCam);
        const wp = this.getComponent(Waypoint);
        const combatDist = wp ? wp.stopOffset + 80 : 200;

        if (dot < 0.7 || dist > combatDist) {
            return;
        }

        if (this._idleTween) this._idleTween.stop();

        if (this.attackSprite && this.spriteRenderer) {
            this.spriteRenderer.spriteFrame = this.attackSprite;
        }

        tween(this.node)
            .to(0.15, { scale: this._attackScale }, { easing: 'quadIn' })
            .call(() => {
                if (GlobalEvents) GlobalEvents.emit(EventID.ENEMY_ATTACKED, this.attackDamage);
            })
            .to(0.2, { scale: this._normalScale }, { easing: 'quadOut' })
            .call(() => {
                if (this.idleSprite && this.spriteRenderer) {
                    this.spriteRenderer.spriteFrame = this.idleSprite;
                }

                if (GlobalEvents) GlobalEvents.emit(EventID.PLAYER_TURN_START);
                this.startIdleAnimation();
            })
            .start();
    }

    private flashRed() {
        if (!this.spriteRenderer) return;
        tween(this.spriteRenderer).to(0.1, { color: this._flashColor }).to(0.1, { color: this._defaultColor }).start();
    }

    private updateUI() {
        if (this.hpBar) this.hpBar.progress = this._currentHp / this.maxHp;
    }

    private die() {
        this._isAlive = false;
        GlobalEvents.emit(EventID.ENEMY_DIED);
        tween(this.node)
            .to(0.2, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}
