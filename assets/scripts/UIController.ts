import { _decorator, Component, Node, view, UITransform, Vec3, tween, Tween, Widget, UIOpacity } from 'cc';
import { AudioController } from './AudioController';
import { PlayableManager } from './PlayableManager';
import { PlayableSDKAdapter } from './PlayableSDKAdapter';

const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {
    @property({ type: Node, tooltip: 'Нода окна поражения (DefeatScreen)' })
    public defeatScreen: Node | null = null;

    @property({ type: Node, tooltip: 'Нода окна победы (VictoryScreen)' })
    public victoryScreen: Node | null = null;

    @property({ type: PlayableManager, tooltip: 'Ссылка на PlayableManager' })
    public playableManager: PlayableManager | null = null;

    @property({ type: PlayableSDKAdapter, tooltip: 'Ссылка на PlayableSDKAdapter' })
    public playableSDKAdapter: PlayableSDKAdapter | null = null;

    @property({ type: AudioController, tooltip: 'Ссылка на AudioController' })
    public audioController: AudioController | null = null;

    @property({ tooltip: 'Отступ от краев экрана в процентах (0.9 = 90% доступного экрана)' })
    public screenPaddingFactor: number = 0.9;

    @property({ tooltip: 'Длительность падения окна поражения в секундах' })
    public defeatAnimationDuration: number = 0.6;

    @property({ tooltip: 'Длительность выпрыгивания окна победы в секундах' })
    public victoryAnimationDuration: number = 0.65;

    private _defeatContainer: Node | null = null;
    private _victoryContainer: Node | null = null;
    private _defeatOpacity: UIOpacity | null = null;
    private _victoryOpacity: UIOpacity | null = null;
    private _defeatDesignSize: { width: number; height: number } = { width: 600, height: 900 };
    private _victoryDesignSize: { width: number; height: number } = { width: 600, height: 900 };

    private _defeatTween: Tween<Node> | null = null;
    private _victoryTween: Tween<Node> | null = null;

    protected onLoad(): void {
        // Поиск нод окон
        if (!this.defeatScreen) {
            this.defeatScreen = this.node.getChildByName('DefeatScreen');
        }

        if (!this.victoryScreen) {
            this.victoryScreen = this.node.getChildByName('VictoryScreen');
        }

        // Находим контейнеры содержимого модалок
        this._defeatContainer = this.defeatScreen?.getChildByName('Container') || this.defeatScreen;
        this._victoryContainer = this.victoryScreen?.getChildByName('Container') || this.victoryScreen;

        // Отключаем Widget на контейнерах, чтобы движок не сбрасывал позицию обратно в центр
        if (this._defeatContainer) {
            const widget = this._defeatContainer.getComponent(Widget);
            if (widget) {
                widget.enabled = false;
            }
            this._defeatOpacity = this._defeatContainer.getComponent(UIOpacity) || this._defeatContainer.addComponent(UIOpacity);
        }

        if (this._victoryContainer) {
            const widget = this._victoryContainer.getComponent(Widget);
            if (widget) {
                widget.enabled = false;
            }
            this._victoryOpacity = this._victoryContainer.getComponent(UIOpacity) || this._victoryContainer.addComponent(UIOpacity);
        }

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

        // Поиск менеджеров при отсутствии явной привязки в Inspector
        const scene = this.node.scene || this.node.parent;

        if (!this.audioController) {
            this.audioController = scene ? scene.getComponentInChildren(AudioController) : null;
        }

        if (!this.playableManager) {
            this.playableManager = scene ? scene.getComponentInChildren(PlayableManager) : null;
        }

        if (!this.playableSDKAdapter) {
            this.playableSDKAdapter = scene ? scene.getComponentInChildren(PlayableSDKAdapter) : null;
        }

        // Слушаем изменение размеров и ориентации экрана
        view.on('canvas-resize', this.updateModalsScale, this);
        this.updateModalsScale();
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.updateModalsScale, this);
        if (this._defeatTween) {
            this._defeatTween.stop();
            this._defeatTween = null;
        }
        if (this._victoryTween) {
            this._victoryTween.stop();
            this._victoryTween = null;
        }
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

        const finalScale = Math.min(1.0, scaleX, scaleY);
        container.setScale(new Vec3(finalScale, finalScale, 1));
    }

    /**
     * Показывает окно поражения с анимацией падения сверху с ударом и отскоком
     */
    public showDefeatScreen(): void {
        this.updateModalsScale();

        if (this.audioController) {
            this.audioController.playDefeat();
        }

        if (this._defeatTween) {
            this._defeatTween.stop();
            this._defeatTween = null;
        }

        const container = this._defeatContainer;
        if (!container) {
            if (this.defeatScreen) {
                this.defeatScreen.active = true;
            }
            return;
        }

        const widget = container.getComponent(Widget);
        if (widget) {
            widget.enabled = false;
        }

        const visibleSize = view.getVisibleSize();
        const startY = visibleSize.height * 1.2;
        const targetPos = new Vec3(0, 0, 0);

        if (this._defeatOpacity) {
            this._defeatOpacity.opacity = 0;
        }
        container.setPosition(new Vec3(0, startY, 0));

        if (this.defeatScreen) {
            this.defeatScreen.active = true;
        }

        if (this._defeatOpacity) {
            tween(this._defeatOpacity)
                .to(0.08, { opacity: 255 })
                .start();
        }

        this._defeatTween = tween(container)
            .to(this.defeatAnimationDuration, { position: targetPos }, { easing: 'bounceOut' })
            .call(() => {
                this._defeatTween = null;
            })
            .start();
    }

    /**
     * Скрывает окно поражения
     */
    public hideDefeatScreen(): void {
        if (this._defeatTween) {
            this._defeatTween.stop();
            this._defeatTween = null;
        }
        if (this.defeatScreen) {
            this.defeatScreen.active = false;
        }
        if (this._defeatContainer) {
            this._defeatContainer.setPosition(new Vec3(0, 0, 0));
        }
    }

    /**
     * Показывает окно победы с анимацией выпрыгивания снизу с радостным подскоком
     */
    public showVictoryScreen(): void {
        this.updateModalsScale();

        if (this.audioController) {
            this.audioController.playSuccess();
        }

        if (this._victoryTween) {
            this._victoryTween.stop();
            this._victoryTween = null;
        }

        const container = this._victoryContainer;
        if (!container) {
            if (this.victoryScreen) {
                this.victoryScreen.active = true;
            }
            return;
        }

        const widget = container.getComponent(Widget);
        if (widget) {
            widget.enabled = false;
        }

        const visibleSize = view.getVisibleSize();
        const startY = -visibleSize.height * 0.9;
        const baseScale = container.scale.x;

        if (this._victoryOpacity) {
            this._victoryOpacity.opacity = 0;
        }
        container.setPosition(new Vec3(0, startY, 0));
        container.setScale(new Vec3(baseScale * 0.7, baseScale * 1.3, 1));

        if (this.victoryScreen) {
            this.victoryScreen.active = true;
        }

        if (this._victoryOpacity) {
            tween(this._victoryOpacity)
                .to(0.06, { opacity: 255 })
                .start();
        }

        const overshootY = 50;
        const dipY = -15;

        this._victoryTween = tween(container)
            .to(
                0.28,
                {
                    position: new Vec3(0, overshootY, 0),
                    scale: new Vec3(baseScale * 1.12, baseScale * 1.08, 1),
                },
                { easing: 'cubicOut' }
            )
            .to(
                0.14,
                {
                    position: new Vec3(0, dipY, 0),
                    scale: new Vec3(baseScale * 0.96, baseScale * 1.04, 1),
                },
                { easing: 'quadInOut' }
            )
            .to(
                0.13,
                {
                    position: new Vec3(0, 0, 0),
                    scale: new Vec3(baseScale, baseScale, 1),
                },
                { easing: 'backOut' }
            )
            .call(() => {
                this._victoryTween = null;
            })
            .start();
    }

    /**
     * Скрывает окно победы
     */
    public hideVictoryScreen(): void {
        if (this._victoryTween) {
            this._victoryTween.stop();
            this._victoryTween = null;
        }
        if (this.victoryScreen) {
            this.victoryScreen.active = false;
        }
        if (this._victoryContainer) {
            this._victoryContainer.setPosition(new Vec3(0, 0, 0));
        }
    }

    // ==========================================
    // UI Button Handlers
    // ==========================================

    /**
     * Button Click Event: Retry
     */
    public onRetryClicked(): void {
        if (this.playableManager) {
            this.playableManager.retryGame();
        } else {
            console.warn('[UIController] PlayableManager reference missing on retry.');
        }
    }

    /**
     * Button Click Event: Upgrade (CTA)
     */
    public onUpgradeClicked(): void {
        if (this.playableSDKAdapter) {
            this.playableSDKAdapter.download();
        } else {
            console.warn('[UIController] PlayableSDKAdapter reference missing on upgrade.');
        }
    }

    /**
     * Button Click Event: Next (CTA)
     */
    public onNextClicked(): void {
        if (this.playableSDKAdapter) {
            this.playableSDKAdapter.download();
        } else {
            console.warn('[UIController] PlayableSDKAdapter reference missing on next.');
        }
    }
}
