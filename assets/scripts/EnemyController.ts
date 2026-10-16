import { _decorator, Component, dragonBones, Node, Label } from 'cc';
import { HeroController } from './HeroController';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {
    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ type: dragonBones.ArmatureDisplay, tooltip: 'Ссылка на ArmatureDisplay (если не задано, ищется в дочерних нодах)' })
    public armatureDisplay: dragonBones.ArmatureDisplay | null = null;

    @property({ type: Label, tooltip: 'Ссылка на Label уровня/силы (если не задано, ищется в дочерних нодах)' })
    public powerLabel: Label | null = null;

    @property({ tooltip: 'Сила / уровень противника' })
    public power: number = 5;

    @property({ tooltip: 'Имя анимации покоя (idle)' })
    public idleAnimationName: string = 'idle';

    @property({ tooltip: 'Скорость анимации idle (1.0 = нормальная скорость)' })
    public idleTimeScale: number = 1.0;

    protected onLoad(): void {
        if (!this.armatureDisplay) {
            this.armatureDisplay = this.getComponentInChildren(dragonBones.ArmatureDisplay);
        }

        if (this.armatureDisplay) {
            this.armatureDisplay.animationCacheMode = dragonBones.ArmatureDisplay.AnimationCacheMode.REALTIME;
        }

        if (!this.powerLabel) {
            this.powerLabel = this.getComponentInChildren(Label);
        }

        this.setPower(this.power);
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    /**
     * Задает силу противника и обновляет Label
     */
    public setPower(value: number): void {
        this.power = value;
        if (this.powerLabel) {
            this.powerLabel.string = `${this.power}`;
        }
    }

    private onClick(): void {
        if (this.hero) {
            this.hero.moveToEnemy(this);
        }
    }

    start(): void {
        this.playIdle();
    }

    /**
     * Воспроизводит idle анимацию с заданной скоростью
     */
    public playIdle(): void {
        if (!this.armatureDisplay) {
            return;
        }

        this.armatureDisplay.timeScale = this.idleTimeScale;

        const animState = this.armatureDisplay.playAnimation(this.idleAnimationName, 0);
        if (animState) {
            animState.timeScale = this.idleTimeScale;
        }
    }

    /**
     * Обновляет скорость idle анимации во время выполнения
     */
    public setIdleTimeScale(scale: number): void {
        this.idleTimeScale = scale;
        if (!this.armatureDisplay) {
            return;
        }

        this.armatureDisplay.timeScale = scale;

        const armature = this.armatureDisplay.armature();
        const animState = armature?.animation.getState(this.idleAnimationName);
        if (animState) {
            animState.timeScale = scale;
        }
    }

    /**
     * Уничтожает противника
     */
    public die(): void {
        this.node.destroy();
    }
}
