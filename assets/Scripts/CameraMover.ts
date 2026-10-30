import { _decorator, Component, Vec3, tween } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
import { Waypoint } from './Waypoint';
const { ccclass } = _decorator;

@ccclass('CameraMover')
export class CameraMover extends Component {
    private readonly _targetPos: Vec3 = new Vec3();
    private readonly _targetRot: Vec3 = new Vec3();
    private readonly _forwardVec: Vec3 = new Vec3();
    private readonly _dirToTarget: Vec3 = new Vec3();
    private readonly _offsetVec: Vec3 = new Vec3();

    protected onLoad() {
        GlobalEvents.on(EventID.MOVE_CAMERA, this.executeMoveForward, this);
        GlobalEvents.on(EventID.TURN_AND_MOVE, this.turnAndMove, this);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    private executeMoveForward() {
        let nearestDist = Infinity;
        let targetPos = new Vec3();
        let found = false;
        let stopOffset = 100;

        const camPos = this.node.worldPosition;
        Vec3.copy(this._forwardVec, this.node.forward);

        for (const wp of Waypoint.all) {
            if (!wp.node.activeInHierarchy) continue;

            Vec3.subtract(this._dirToTarget, wp.node.worldPosition, camPos);
            const distance = this._dirToTarget.length();

            this._dirToTarget.normalize();

            const dot = Vec3.dot(this._forwardVec, this._dirToTarget);

            if (dot > 0.5 && distance < nearestDist) {
                nearestDist = distance;
                targetPos.set(wp.node.worldPosition);
                stopOffset = wp.stopOffset;
                found = true;
            }
        }

        if (found) {
            const originalY = this.node.position.y;

            this._targetPos.set(targetPos);

            Vec3.multiplyScalar(this._offsetVec, this._forwardVec, stopOffset);
            this._targetPos.subtract(this._offsetVec);

            this._targetPos.y = originalY;

            tween(this.node)
                .to(1.5, { position: this._targetPos }, { easing: 'sineInOut' })
                .call(() => {
                    if (GlobalEvents) GlobalEvents.emit(EventID.CAMERA_STOPPED);
                })
                .start();
        } else {
            console.warn('Впереди нет активных целей!');
        }
    }

    private turnAndMove(target: string) {
        this._targetRot.set(this.node.eulerAngles);

        if (target === 'boss') {
            this._targetRot.y -= 90;
        } else {
            this._targetRot.y += 90;
        }

        tween(this.node)
            .to(0.5, { eulerAngles: this._targetRot }, { easing: 'sineInOut' })
            .call(() => {
                this.executeMoveForward();
            })
            .start();
    }
}
