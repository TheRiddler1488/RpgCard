import { _decorator, Component, Camera, input, Input, EventTouch, Vec3, Vec2, find } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('PathSign')
export class PathSign extends Component {
    @property public pathTarget: string = 'boss';
    @property(Camera) public mainCamera: Camera = null;
    @property public clickRadius: number = 150;

    @property public activation3DDistance: number = 100;

    private readonly _screenPos: Vec3 = new Vec3();
    private _isActive: boolean = true;

    protected onLoad() {
        if (!this.mainCamera) {
            const camNode = find('Main Camera');
            if (camNode) this.mainCamera = camNode.getComponent(Camera);
        }

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    protected onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private onTouchStart(event: EventTouch) {
        if (!this.mainCamera || !this.node.activeInHierarchy || !this._isActive) return;

        const dist3D = Vec3.distance(this.node.worldPosition, this.mainCamera.node.worldPosition);
        if (dist3D > this.activation3DDistance) {
            return;
        }

        const touchPos: Vec2 = event.getLocation();
        this.mainCamera.worldToScreen(this.node.worldPosition, this._screenPos);

        const dx = this._screenPos.x - touchPos.x;
        const dy = this._screenPos.y - touchPos.y;
        const distance2D = Math.sqrt(dx * dx + dy * dy);

        if (distance2D <= this.clickRadius) {
            this.onClick();
        }
    }

    private onClick() {
        this._isActive = false;
        if (GlobalEvents) GlobalEvents.emit(EventID.PATH_CHOSEN, this.pathTarget);
        if (this.node.parent) this.node.parent.active = false;
    }
}
