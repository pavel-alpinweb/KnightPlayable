import { _decorator, Component, dragonBones } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('EnemyController')
@requireComponent(dragonBones.ArmatureDisplay)
export class EnemyController extends Component {
    @property({ tooltip: 'Имя анимации покоя (idle)' })
    public idleAnimationName: string = 'idle';

    @property({ tooltip: 'Скорость анимации idle (1.0 = нормальная скорость)' })
    public idleTimeScale: number = 1.0;

    private _armatureDisplay!: dragonBones.ArmatureDisplay;

    protected onLoad(): void {
        this._armatureDisplay = this.getComponent(dragonBones.ArmatureDisplay)!;
        this._armatureDisplay.animationCacheMode = dragonBones.ArmatureDisplay.AnimationCacheMode.REALTIME;
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
