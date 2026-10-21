import { _decorator, Component, Node, find, view, UITransform, Vec3 } from 'cc';
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

    @property({ tooltip: 'Отступ от краев экрана в процентах (0.9 = 90% доступного экрана)' })
    public screenPaddingFactor: number = 0.9;

    private _defeatContainer: Node | null = null;
    private _victoryContainer: Node | null = null;
    private _defeatDesignSize: { width: number; height: number } = { width: 600, height: 900 };
    private _victoryDesignSize: { width: number; height: number } = { width: 600, height: 900 };

    protected onLoad(): void {
        // Поиск нод окон
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

        // Находим контейнеры содержимого модалок
        this._defeatContainer = this.defeatScreen?.getChildByName('Container') || this.defeatScreen;
        this._victoryContainer = this.victoryScreen?.getChildByName('Container') || this.victoryScreen;

        // Запоминаем проектные размеры контейнеров
        if (this._defeatContainer) {
            const transform = this._defeatContainer.getComponent(UITransform);
            if (transform && transform.contentSize.width > 0) {
                this._defeatDesignSize = { width: transform.contentSize.width, height: transform.contentSize.height };
            }
        }

        if (this._victoryContainer) {
            const transform = this._victoryContainer.getComponent(UITransform);
            if (transform && transform.contentSize.width > 0) {
                this._victoryDesignSize = { width: transform.contentSize.width, height: transform.contentSize.height };
            }
        }

        // По умолчанию окна скрыты
        if (this.defeatScreen) {
            this.defeatScreen.active = false;
        }
        if (this.victoryScreen) {
            this.victoryScreen.active = false;
        }

        // Поиск HeroController и подписка на поражение
        if (!this.hero) {
            this.hero = find('Canvas/GameRoot/Hero')?.getComponent(HeroController)
                || this.node.scene.getComponentInChildren(HeroController);
        }
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

        // Слушаем изменение размеров и ориентации экрана
        view.on('canvas-resize', this.updateModalsScale, this);
        this.updateModalsScale();
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.updateModalsScale, this);
    }

    /**
     * Пересчитывает масштаб окон под текущий размер экрана
     */
    public updateModalsScale(): void {
        const visibleSize = view.getVisibleSize();

        this._scaleContainer(this._defeatContainer, this._defeatDesignSize, visibleSize);
        this._scaleContainer(this._victoryContainer, this._victoryDesignSize, visibleSize);
    }

    private _scaleContainer(
        container: Node | null,
        designSize: { width: number; height: number },
        visibleSize: { width: number; height: number }
    ): void {
        if (!container) {
            return;
        }

        const maxAvailableWidth = visibleSize.width * this.screenPaddingFactor;
        const maxAvailableHeight = visibleSize.height * this.screenPaddingFactor;

        const scaleX = maxAvailableWidth / designSize.width;
        const scaleY = maxAvailableHeight / designSize.height;

        // Вписываем в экран с сохранением пропорций, не увеличивая больше 1.0
        const finalScale = Math.min(1.0, scaleX, scaleY);

        container.setScale(new Vec3(finalScale, finalScale, 1));
    }

    /**
     * Показывает окно поражения
     */
    public showDefeatScreen(): void {
        this.updateModalsScale();
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
        this.updateModalsScale();
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
