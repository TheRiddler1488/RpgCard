import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Waypoint')
export class Waypoint extends Component {
    @property({
        tooltip: 'На каком расстоянии остановиться перед объектом (чтобы не въехать камерой в текстуру)'
    })
    public stopOffset: number = 100;

    public static all: Waypoint[] = [];

    protected onLoad() {
        Waypoint.all.push(this);
    }

    protected onDestroy() {
        const index = Waypoint.all.indexOf(this);
        if (index > -1) Waypoint.all.splice(index, 1);
    }
}
