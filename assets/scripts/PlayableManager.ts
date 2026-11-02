import { _decorator, Component, Node, Animation, dragonBones, director, find } from 'cc';
import { AudioController } from './AudioController';
import { HeroController } from './HeroController';
import { EnemiesManager } from './EnemiesManager';
import { PlayableSDKAdapter } from './PlayableSDKAdapter';

const { ccclass, property } = _decorator;

export enum GameState {
    IDLE = 'IDLE',
    PLAYING = 'PLAYING',
    WON = 'WON',
    LOST = 'LOST',
}

/** Интерфейс для взаимодействия с UI без прямого циклического импорта UIController */
interface IUIController {
    showDefeatScreen(): void;
    showVictoryScreen(): void;
}

/** Интерфейс для взаимодействия со StartOverlay без прямого циклического импорта OverlayManager */
interface IOverlayManager {
    overlay: Node | null;
    node: Node;
    enabled: boolean;
}

@ccclass('PlayableManager')
export class PlayableManager extends Component {
    @property({
        type: Node,
        tooltip: 'Корневой узел игрового мира (персонажи, препятствия и т.д.)',
    })
    public gameRoot: Node = null;

    @property({ type: AudioController, tooltip: 'Ссылка на AudioController' })
    public audioController: AudioController | null = null;

    @property({ type: Component, tooltip: 'Ссылка на UIController' })
    public uiController: Component | null = null;

    @property({ type: PlayableSDKAdapter, tooltip: 'Ссылка на PlayableSDKAdapter' })
    public playableSDKAdapter: PlayableSDKAdapter | null = null;

    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ type: EnemiesManager, tooltip: 'Ссылка на EnemiesManager' })
    public enemiesManager: EnemiesManager | null = null;

    public isGameStarted: boolean = false;
    public gameState: GameState = GameState.IDLE;

    /** Статический флаг: был ли запрошен retry перед перезагрузкой сцены */
    private static _isRetryPending: boolean = false;

    /** Статический ad-wide флаг: гарантирует, что game_end вызывается ровно один раз за всю жизнь креатива */
    private static _hasGlobalGameEnded: boolean = false;

    private _isReloading: boolean = false;
    private _animations: Animation[] = [];
    private _dragonBones: dragonBones.ArmatureDisplay[] = [];

    protected onLoad(): void {
        this.gameState = GameState.IDLE;
        this._isReloading = false;

        if (!this.gameRoot) {
            this.gameRoot = this.node;
        }

        this._resolveReferences();
        this._subscribeToGameplayEvents();
    }

    start(): void {
        // Проверяем, произошла ли загрузка сцены в результате Retry
        if (PlayableManager._isRetryPending) {
            PlayableManager._isRetryPending = false;
            this._handlePostRetryStart();
        } else {
            this.pauseGame();
        }
    }

    /**
     * Поиск ссылок, если они не заданы вручную в Inspector
     */
    private _resolveReferences(): void {
        const scene = this.node.scene;

        if (!this.audioController) {
            this.audioController = scene ? scene.getComponentInChildren(AudioController) : null;
        }

        if (!this.uiController) {
            this.uiController = (scene ? scene.getComponentInChildren('UIController') : null) as Component | null;
        }

        if (!this.playableSDKAdapter) {
            this.playableSDKAdapter = scene ? scene.getComponentInChildren(PlayableSDKAdapter) : null;
        }

        if (!this.hero) {
            this.hero = find('Canvas/GameRoot/Hero')?.getComponent(HeroController)
                || (scene ? scene.getComponentInChildren(HeroController) : null);
        }

        if (!this.enemiesManager) {
            this.enemiesManager = find('Canvas/GameRoot/goblins')?.getComponent(EnemiesManager)
                || (scene ? scene.getComponentInChildren(EnemiesManager) : null);
        }
    }

    /**
     * Подписка PlayableManager на события победы и поражения
     */
    private _subscribeToGameplayEvents(): void {
        if (this.hero) {
            this.hero.onDefeat = () => {
                this.handleDefeat();
            };
        }

        if (this.enemiesManager) {
            this.enemiesManager.onVictory = () => {
                this.handleVictory();
            };
        }
    }

    /**
     * Обработка поражения героя
     */
    public handleDefeat(): void {
        if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
            return;
        }
        this.gameState = GameState.LOST;

        this._notifySdkGameEnd();

        if (this.uiController) {
            const ui = this.uiController as unknown as IUIController;
            if (typeof ui.showDefeatScreen === 'function') {
                ui.showDefeatScreen();
            }
        }
    }

    /**
     * Обработка победы героя
     */
    public handleVictory(): void {
        if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
            return;
        }
        this.gameState = GameState.WON;

        this._notifySdkGameEnd();

        if (this.uiController) {
            const ui = this.uiController as unknown as IUIController;
            if (typeof ui.showVictoryScreen === 'function') {
                ui.showVictoryScreen();
            }
        }
    }

    /**
     * Оповещение PlayableSDKAdapter о конце игры с ad-wide защитой
     */
    private _notifySdkGameEnd(): void {
        if (PlayableManager._hasGlobalGameEnded) {
            return;
        }
        PlayableManager._hasGlobalGameEnded = true;

        if (this.playableSDKAdapter) {
            this.playableSDKAdapter.gameEnd();
        }
    }

    /**
     * Перезапуск игры после поражения
     */
    public retryGame(): void {
        if (this._isReloading) {
            return;
        }

        const sceneName = this._getSceneName();
        if (!sceneName) {
            console.warn('[PlayableManager] retryGame: Failed to determine scene name.');
            return;
        }

        this._isReloading = true;
        PlayableManager._isRetryPending = true;

        director.loadScene(sceneName, (err) => {
            if (err) {
                console.error(`[PlayableManager] Failed to reload scene "${sceneName}":`, err);
                this._isReloading = false;
                PlayableManager._isRetryPending = false;
            }
        });
    }

    /**
     * Автоматический старт и пропуск StartOverlay после Retry
     */
    private _handlePostRetryStart(): void {
        const overlayManager = this.node.scene?.getComponentInChildren('OverlayManager') as unknown as IOverlayManager | null;
        if (overlayManager) {
            const overlayNode = overlayManager.overlay || overlayManager.node;
            if (overlayNode && overlayNode.isValid) {
                overlayNode.active = false;
            }
            overlayManager.enabled = false;
        }

        this.startGame();
    }

    private _getSceneName(): string {
        const currentScene = director.getScene();
        if (currentScene && currentScene.name) {
            return currentScene.name;
        }
        return 'Playable';
    }

    public pauseGame(): void {
        this.isGameStarted = false;

        if (this.gameRoot) {
            this._animations = this.gameRoot.getComponentsInChildren(Animation);
            for (const anim of this._animations) {
                anim.pause();
            }

            this._dragonBones = this.gameRoot.getComponentsInChildren(dragonBones.ArmatureDisplay);
            for (const db of this._dragonBones) {
                db.timeScale = 0;
            }

            this._setGameComponentsEnabled(this.gameRoot, false);
        }
    }

    public startGame(): void {
        if (this.isGameStarted) {
            return;
        }
        this.isGameStarted = true;
        this.gameState = GameState.PLAYING;

        if (this.audioController) {
            this.audioController.unlockAudio();
        }

        if (this.gameRoot) {
            this._setGameComponentsEnabled(this.gameRoot, true);

            for (const anim of this._animations) {
                anim.resume();
            }

            for (const db of this._dragonBones) {
                db.timeScale = 1;
            }
        }
    }

    private _setGameComponentsEnabled(node: Node, enabled: boolean) {
        const components = node.getComponentsInChildren(Component);
        for (const comp of components) {
            // Защита: никогда не отключаем сам PlayableManager и AudioController
            if (comp === this || comp instanceof PlayableManager || comp instanceof AudioController) {
                continue;
            }

            // Исключаем рендереры, трансформации и камеры
            if (
                comp instanceof dragonBones.ArmatureDisplay ||
                comp instanceof Animation ||
                comp.name.includes('Renderer') ||
                comp.name.includes('Display') ||
                comp.name.includes('Sprite') ||
                comp.name.includes('Label') ||
                comp.name.includes('Camera') ||
                comp.name.includes('Transform')
            ) {
                continue;
            }

            comp.enabled = enabled;
        }
    }

    update(deltaTime: number): void {
        if (!this.isGameStarted) {
            return;
        }
    }
}
