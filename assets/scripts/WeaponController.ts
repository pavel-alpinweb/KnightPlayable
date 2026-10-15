import { _decorator, Component, Node } from 'cc';
import { HeroController } from './HeroController';
const { ccclass, property } = _decorator;

@ccclass('WeaponController')
export class WeaponController extends Component {
    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private onClick(): void {
        if (this.hero) {
            this.hero.moveToWeapon(this);
        }
    }

    /**
     * Удаляет ноду оружия со сцены
     */
    public removeWepon(): void {
        this.node.destroy();
    }
}
