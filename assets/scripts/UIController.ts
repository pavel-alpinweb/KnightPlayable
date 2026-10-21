import { _decorator, Component, Node, find } from 'cc';
import { HeroController } from './HeroController';
import { EnemiesManager } from './EnemiesManager';
const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {
    @property({ type: Node, tooltip: 'Нода окна поражения (DefeatScreen)' })
    public defeatScreen: Node | null = null;

    @property({ type: Node, tooltip: 'Нода окна победы (VictoryScreen)' })
    public victoryScreen: Node | null = null;

    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ type: EnemiesManager, tooltip: 'Ссылка на EnemiesManager' })
    public enemiesManager: EnemiesManager | null = null;

    protected onLoad(): void {
        // Поиск и скрытие нод окон по умолчанию
        if (!this.defeatScreen) {
            this.defeatScreen = this.node.getChildByName('DefeatScreen');
        }

        // По умолчанию окно поражения скрыто
        if (this.defeatScreen) {
            this.defeatScreen.active = false;
        }

        if (!this.victoryScreen) {
            this.victoryScreen = this.node.getChildByName('VictoryScreen');
        }

        if (this.victoryScreen) {
            this.victoryScreen.active = false;
        }

        // Поиск HeroController и подписка на поражение
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

        // Поиск EnemiesManager и подписка на победу
        if (!this.enemiesManager) {
            this.enemiesManager = find('Canvas/GameRoot/goblins')?.getComponent(EnemiesManager)
                || this.node.scene.getComponentInChildren(EnemiesManager);
        }

        if (this.enemiesManager) {
            this.enemiesManager.onVictory = () => {
                this.showVictoryScreen();
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

    /**
     * Показывает окно победы
     */
    public showVictoryScreen(): void {
        if (this.victoryScreen) {
            this.victoryScreen.active = true;
        }
    }

    /**
     * Скрывает окно победы
     */
    public hideVictoryScreen(): void {
        if (this.victoryScreen) {
            this.victoryScreen.active = false;
        }
    }
}
