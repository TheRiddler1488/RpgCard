import { _decorator, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LootItemData')
export class LootItemData {
    @property({ tooltip: "'weapon' для мечей, 'support' для баффов" })
    public type: string = 'weapon';

    @property({ tooltip: 'Бонус к урону или защите' })
    public bonus: number = 20;

    @property({ type: SpriteFrame, tooltip: 'Картинка предмета' })
    public image: SpriteFrame = null;
}
