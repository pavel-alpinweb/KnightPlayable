import { _decorator, Component, Node, Label, Sprite, tween, Vec3, Tween, isValid } from 'cc';
import { HeroController } from './HeroController';
import { PlayableManager } from './PlayableManager';
const { ccclass, property } = _decorator;

@ccclass('WeaponController')
export class WeaponController extends Component {
    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ type: Sprite, tooltip: 'Ссылка на Sprite оружия (если не задан, ищется в дочерних нодах)' })
    public weaponSprite: Sprite | null = null;

    @property({ type: Label, tooltip: 'Ссылка на Label бонуса силы (если не задан, ищется в дочерних нодах)' })
    public powerLabel: Label | null = null;

    @property({ tooltip: 'Бонус силы, даваемый оружием' })
    public power: number = 5;

    @property({ tooltip: 'Показывать ли знак плюс перед значением (например, +5)' })
    public showPlusSign: boolean = true;

    @property({ tooltip: 'Смещение спрайта оружия вверх/вниз при парении' })
    public floatDistance: number = 15;

    @property({ tooltip: 'Время движения в одну сторону (секунды)' })
    public floatDuration: number = 0.8;

    private _floatTween: Tween<Node> | null = null;
    private _initialSpritePos: Vec3 = new Vec3();

    protected onLoad(): void {
        if (!this.weaponSprite) {
            this.weaponSprite = this.getComponentInChildren(Sprite);
        }

        if (this.weaponSprite && this.weaponSprite.node) {
            this._initialSpritePos.set(this.weaponSprite.node.position);
        }

        if (!this.powerLabel) {
            this.powerLabel = this.getComponentInChildren(Label);
        }

        this.updatePowerLabel();
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onEnable(): void {
        const playableManager = this.node.scene?.getComponentInChildren(PlayableManager);
        if (!playableManager || playableManager.isGameStarted) {
            this.startFloatingTween();
        }
    }

    protected onDisable(): void {
        this.stopFloatingTween(false);
    }

    protected onDestroy(): void {
        this.stopFloatingTween(false);
        if (isValid(this.node)) {
            this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
        }
    }

    /**
     * Запускает твин покачивания спрайта оружия вверх и вниз
     */
    public startFloatingTween(): void {
        if (!this.weaponSprite || !isValid(this.weaponSprite.node) || this._floatTween) {
            return;
        }

        const spriteNode = this.weaponSprite.node;
        this._initialSpritePos.set(spriteNode.position);

        const targetPos = new Vec3(
            this._initialSpritePos.x,
            this._initialSpritePos.y + this.floatDistance,
            this._initialSpritePos.z
        );

        this._floatTween = tween(spriteNode)
            .to(this.floatDuration, { position: targetPos }, { easing: 'sineInOut' })
            .to(this.floatDuration, { position: this._initialSpritePos }, { easing: 'sineInOut' })
            .union()
            .repeatForever();

        this._floatTween.start();
    }

    /**
     * Останавливает твин и опционально возвращает спрайт в исходную позицию
     */
    public stopFloatingTween(resetPosition: boolean = true): void {
        if (this._floatTween) {
            this._floatTween.stop();
            this._floatTween = null;
        }

        if (resetPosition && this.weaponSprite && isValid(this.weaponSprite) && isValid(this.weaponSprite.node)) {
            this.weaponSprite.node.setPosition(this._initialSpritePos);
        }
    }

    /**
     * Задает силу оружия и обновляет текст
     */
    public setPower(value: number): void {
        this.power = value;
        this.updatePowerLabel();
    }

    private updatePowerLabel(): void {
        if (this.powerLabel && isValid(this.powerLabel)) {
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
        this.stopFloatingTween(false);
        if (isValid(this.node)) {
            this.node.destroy();
        }
    }
}
