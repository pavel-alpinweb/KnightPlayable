import { _decorator, Component, dragonBones, Node } from 'cc';
import {HeroController} from "./HeroController";
const { ccclass, property, requireComponent } = _decorator;

@ccclass('EnemyController')
@requireComponent(dragonBones.ArmatureDisplay)
export class EnemyController extends Component {
    @property({ type: HeroController, tooltip: 'Ссылка на HeroController' })
    public hero: HeroController | null = null;

    @property({ tooltip: 'Имя анимации покоя (idle)' })
    public idleAnimationName: string = 'idle';

    @property({ tooltip: 'Скорость анимации idle (1.0 = нормальная скорость)' })
    public idleTimeScale: number = 1.0;

    private _armatureDisplay!: dragonBones.ArmatureDisplay;

    protected onLoad(): void {
        this._armatureDisplay = this.getComponent(dragonBones.ArmatureDisplay)!;
        this._armatureDisplay.animationCacheMode = dragonBones.ArmatureDisplay.AnimationCacheMode.REALTIME;

        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private onClick(): void {
        if (this.hero) {
            this.hero.moveToEnemy(this.node);
        }
    }

    start(): void {
        this.playIdle();
    }

    /**
     * Воспроизводит idle анимацию с заданной скоростью
     */
    public playIdle(): void {
        this._armatureDisplay.timeScale = this.idleTimeScale;

        const animState = this._armatureDisplay.playAnimation(this.idleAnimationName, 0);
        if (animState) {
            animState.timeScale = this.idleTimeScale;
        }
    }

    /**
     * Обновляет скорость idle анимации во время выполнения
     */
    public setIdleTimeScale(scale: number): void {
        this.idleTimeScale = scale;
        this._armatureDisplay.timeScale = scale;

        const armature = this._armatureDisplay.armature();
        const animState = armature?.animation.getState(this.idleAnimationName);
        if (animState) {
            animState.timeScale = scale;
        }
    }
}
