import { _decorator, Component, Node, Label } from 'cc';
import { HeroController } from './HeroController';
const { ccclass, property } = _decorator;

@ccclass('WeaponController')
export class WeaponController extends Component {
    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ type: Label, tooltip: 'Ссылка на Label бонуса силы (если не задан, ищется в дочерних нодах)' })
    public powerLabel: Label | null = null;

    @property({ tooltip: 'Бонус силы, даваемый оружием' })
    public power: number = 5;

    @property({ tooltip: 'Показывать ли знак плюс перед значением (например, +5)' })
    public showPlusSign: boolean = true;

    protected onLoad(): void {
        if (!this.powerLabel) {
            this.powerLabel = this.getComponentInChildren(Label);
        }

        this.updatePowerLabel();
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    /**
     * Задает силу оружия и обновляет текст
     */
    public setPower(value: number): void {
        this.power = value;
        this.updatePowerLabel();
    }

    private updatePowerLabel(): void {
        if (this.powerLabel) {
            const prefix = this.showPlusSign && this.power > 0 ? '+' : '';
            this.powerLabel.string = `${prefix}${this.power}`;
        }
    }

    private onClick(): void {
        if (this.hero) {
            this.hero.moveToWeapon(this);
        }
    }

    /**
     * Удаляет ноду оружия со сцены
     */
    public removeWeapon(): void {
        this.node.destroy();
    }
}
