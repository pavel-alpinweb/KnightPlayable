import { _decorator, Component, Node, Sprite, tween, Vec3, Tween, UIOpacity } from 'cc';
import { PlayableManager } from './PlayableManager';
const { ccclass, property } = _decorator;

@ccclass('OverlayManager')
export class OverlayManager extends Component {
    @property({ type: Sprite })
    public icon: Sprite = null;

    @property({ type: Node })
    public overlay: Node = null;

    @property({
        type: PlayableManager,
        tooltip: 'Ссылка на PlayableManager для запуска игры',
    })
    public playableManager: PlayableManager = null;

    private _swayTween: Tween<Node> | null = null;
    private _isDismissed: boolean = false;

    start() {
        this.startIconSway();
        this._setupInput();
    }

    private _setupInput() {
        const targetNode = this.overlay || this.node;
        targetNode.on(Node.EventType.TOUCH_END, this._onOverlayTapped, this);
    }

    private _onOverlayTapped() {
        if (this._isDismissed) {
            return;
        }
        this._isDismissed = true;

        // Отписываемся от событий клика
        const targetNode = this.overlay || this.node;
        targetNode.off(Node.EventType.TOUCH_END, this._onOverlayTapped, this);

        // Останавливаем анимацию покачивания иконки
        if (this._swayTween) {
            this._swayTween.stop();
            this._swayTween = null;
        }

        // Запускаем игру
        if (this.playableManager) {
            this.playableManager.startGame();
        }

        // Скрываем оверлей (плавно с фейдом или сразу выключаем ноду)
        this._hideOverlay();
    }

    private _hideOverlay() {
        const targetNode = this.overlay || this.node;

        // Получаем или добавляем UIOpacity для плавного растворения
        let uiOpacity = targetNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = targetNode.addComponent(UIOpacity);
        }

        tween(uiOpacity)
            .to(0.25, { opacity: 0 }, { easing: 'fade' })
            .call(() => {
                targetNode.active = false;
            })
            .start();
    }

    private startIconSway() {
        if (!this.icon) {
            return;
        }

        const iconNode = this.icon.node;
        const initialPos = iconNode.position.clone();

        // Смещение вверх на 20 пикселей от начальной позиции
        const targetPos = new Vec3(initialPos.x, initialPos.y + 20, initialPos.z);

        this._swayTween = tween(iconNode)
            .to(0.7, { position: targetPos }, { easing: 'sineInOut' })
            .to(0.7, { position: initialPos }, { easing: 'sineInOut' })
            .union()
            .repeatForever();

        this._swayTween.start();
    }

    protected onDestroy() {
        const targetNode = this.overlay || this.node;
        if (targetNode && targetNode.isValid) {
            targetNode.off(Node.EventType.TOUCH_END, this._onOverlayTapped, this);
        }

        if (this._swayTween) {
            this._swayTween.stop();
            this._swayTween = null;
        }
    }

    update(deltaTime: number) {

    }
}
