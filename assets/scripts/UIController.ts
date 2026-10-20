import { _decorator, Component, Node, find } from 'cc';
import { HeroController } from './HeroController';
const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {
    @property({ type: Node, tooltip: 'Нода окна поражения (DefeatScreen)' })
    public defeatScreen: Node | null = null;

    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    protected onLoad(): void {
        // Если нода DefeatScreen не назначена в инспекторе, ищем её в дочерних узлах
        if (!this.defeatScreen) {
            this.defeatScreen = this.node.getChildByName('DefeatScreen');
        }

        // По умолчанию окно поражения скрыто
        if (this.defeatScreen) {
            this.defeatScreen.active = false;
        }

        // Если ссылка на героя не назначена, пробуем найти на сцене
        if (!this.hero) {
            this.hero = find('Canvas/GameRoot/Hero')?.getComponent(HeroController)
                || this.node.scene.getComponentInChildren(HeroController);
        }

        // Подписываемся на событие поражения
        if (this.hero) {
            this.hero.onDefeat = () => {
                this.showDefeatScreen();
            };
        }
    }

    /**
     * Показывает окно поражения
     */
    public showDefeatScreen(): void {
        if (this.defeatScreen) {
            this.defeatScreen.active = true;
        }
    }

    /**
     * Скрывает окно поражения
     */
    public hideDefeatScreen(): void {
        if (this.defeatScreen) {
            this.defeatScreen.active = false;
        }
    }
}
