import { _decorator, Component, Node, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WaypointController')
export class WaypointController extends Component {
    @property({ type: Sprite, tooltip: 'Ссылка на компонент Sprite (если не задан, берется с текущей ноды)' })
    public sprite: Sprite | null = null;

    @property({ type: Color, tooltip: 'Цвет неактивной точки (по умолчанию белый)' })
    public inactiveColor: Color = new Color(255, 255, 255, 255);

    @property({ type: Color, tooltip: 'Цвет точки предстоящего маршрута (желтый)' })
    public pendingColor: Color = new Color(255, 235, 59, 255);

    @property({ type: Color, tooltip: 'Цвет пройденной точки (зеленый)' })
    public completedColor: Color = new Color(76, 175, 80, 255);

    protected onLoad(): void {
        if (!this.sprite) {
            this.sprite = this.getComponent(Sprite);
        }
    }

    start(): void {
        this.setInactive();
    }

    /**
     * Переводит точку в неактивное визуальное состояние
     */
    public setInactive(): void {
        this._applyColor(this.inactiveColor);
    }

    /**
     * Переводит точку в состояние предстоящего прохождения
     */
    public setPending(): void {
        this._applyColor(this.pendingColor);
    }

    /**
     * Переводит точку в состояние пройденной
     */
    public setCompleted(): void {
        this._applyColor(this.completedColor);
    }

    private _applyColor(color: Color): void {
        if (!this.sprite) {
            this.sprite = this.getComponent(Sprite);
        }

        if (this.sprite) {
            this.sprite.color = color;
        }
    }
}
