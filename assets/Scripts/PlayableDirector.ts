import { _decorator, Component, Node, Camera } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
const { ccclass, property } = _decorator;

enum GameState {
    IDLE,
    COMBAT,
    LOOTING,
    CHOOSING_PATH,
    END
}

@ccclass('PlayableDirector')
export class PlayableDirector extends Component {
    @property(Camera)
    public mainCamera: Camera = null;

    @property(Node)
    public lootScreen: Node = null;

    private _currentState: GameState = GameState.IDLE;
    private _killCount: number = 0;

    protected onLoad() {
        GlobalEvents.on(EventID.ENEMY_DIED, this.onEnemyDied, this);
        GlobalEvents.on(EventID.PATH_CHOSEN, this.onPathChosen, this);
        GlobalEvents.on(EventID.LOOT_ACCEPTED, this.onLootResolved, this);
        GlobalEvents.on(EventID.LOOT_REJECTED, this.onLootResolved, this);
        GlobalEvents.on(EventID.GAME_STARTED, this.startMovingToNextEnemy, this);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    protected start() {
        if (this.lootScreen) this.lootScreen.active = false;
    }

    private startMovingToNextEnemy() {
        this._currentState = GameState.IDLE;
        GlobalEvents.emit(EventID.MOVE_CAMERA);
    }

    private onEnemyDied() {
        this._killCount++;
        this._currentState = GameState.LOOTING;

        if (this.lootScreen) {
            this.lootScreen.active = true;
        } else {
            this.startMovingToNextEnemy();
        }
    }

    private onLootResolved() {
        this._currentState = GameState.CHOOSING_PATH;

        GlobalEvents.emit(EventID.MOVE_CAMERA);
    }

    private onPathChosen(path: string) {
        GlobalEvents.emit(EventID.TURN_AND_MOVE, path);
    }
}
