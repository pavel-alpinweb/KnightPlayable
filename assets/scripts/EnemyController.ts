import { _decorator, Component, dragonBones, Node, Label } from 'cc';
import { HeroController } from './HeroController';
import type { EnemiesManager } from './EnemiesManager';
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

    @property({ tooltip: 'Имя анимации гибели (die)' })
    public dieAnimationName: string = 'die';

    @property({ tooltip: 'Скорость анимации гибели (1.0 = нормальная скорость)' })
    public dieTimeScale: number = 1.0;

    @property({ tooltip: 'Имя анимации атаки (attack)' })
    public attackAnimationName: string = 'attack';

    @property({ tooltip: 'Скорость анимации атаки (1.0 = нормальная скорость)' })
    public attackTimeScale: number = 1.0;

    @property({ tooltip: 'Задержка до контакта удара в секундах (момент удара по герою)' })
    public attackHitDelay: number = 0.25;

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
     * Воспроизводит анимацию гибели 1 раз и по окончании удаляет ноду
     * @param onComplete callback по завершению анимации (перед destroy)
     */
    public die(onComplete?: () => void): void {
        // Отключаем тач-события, чтобы по умирающему врагу нельзя было кликать
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);

        // Скрываем плашку уровня/силы при гибели
        if (this.powerLabel) {
            this.powerLabel.node.active = false;
        }

        // Получаем EnemiesManager заранее до удаления ноды из иерархии
        const enemiesManager = this.node.parent?.getComponent('EnemiesManager') as EnemiesManager | null
            || this.node.scene.getComponentInChildren('EnemiesManager') as EnemiesManager | null;

        if (!this.armatureDisplay) {
            if (enemiesManager) {
                enemiesManager.onEnemyDied(this);
            }
            if (onComplete) onComplete();
            this.node.destroy();
            return;
        }

        const onAnimComplete = () => {
            this.armatureDisplay?.removeEventListener(dragonBones.EventObject.COMPLETE, onAnimComplete, this);

            // Вызываем onEnemyDied только после завершения анимации гибели
            if (enemiesManager) {
                enemiesManager.onEnemyDied(this);
            }

            if (onComplete) {
                onComplete();
            }
            this.node.destroy();
        };

        this.armatureDisplay.timeScale = this.dieTimeScale;
        this.armatureDisplay.addEventListener(dragonBones.EventObject.COMPLETE, onAnimComplete, this);

        const animState = this.armatureDisplay.playAnimation(this.dieAnimationName, 1);
        if (!animState) {
            // Если анимация с таким именем отсутствует в armature, завершаем сразу
            onAnimComplete();
        } else {
            animState.timeScale = this.dieTimeScale;
        }
    }

    /**
     * Воспроизводит attack анимацию один раз и возвращается в idle
     * @param onComplete вызывается по окончании анимации атаки
     */
    public playAttack(onComplete?: () => void): void {
        if (!this.armatureDisplay) {
            if (onComplete) onComplete();
            return;
        }

        const onAttackComplete = () => {
            this.armatureDisplay?.removeEventListener(dragonBones.EventObject.COMPLETE, onAttackComplete, this);
            this.playIdle();
            if (onComplete) {
                onComplete();
            }
        };

        this.armatureDisplay.timeScale = this.attackTimeScale;
        this.armatureDisplay.addEventListener(dragonBones.EventObject.COMPLETE, onAttackComplete, this);

        const animState = this.armatureDisplay.playAnimation(this.attackAnimationName, 1);
        if (!animState) {
            onAttackComplete();
        } else {
            animState.timeScale = this.attackTimeScale;
        }
    }
}
