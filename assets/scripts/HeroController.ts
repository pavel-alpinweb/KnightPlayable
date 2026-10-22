import { _decorator, Component, dragonBones, Tween, tween, Node, Vec3, Label } from 'cc';
import type { WeaponController } from './WeaponController';
import type { EnemyController } from './EnemyController';
import { PathController } from './PathController';
import { RouteController } from './RouteController';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('HeroController')
@requireComponent(PathController)
export class HeroController extends Component {
    @property({ type: dragonBones.ArmatureDisplay, tooltip: 'Ссылка на ArmatureDisplay (если не задано, ищется в дочерних нодах)' })
    public armatureDisplay: dragonBones.ArmatureDisplay | null = null;

    @property({ type: PathController, tooltip: 'Ссылка на PathController (если не задано, берется с этой же ноды)' })
    public pathController: PathController | null = null;

    @property({ type: RouteController, tooltip: 'Ссылка на RouteController сцены' })
    public routeController: RouteController | null = null;

    @property({ type: Label, tooltip: 'Ссылка на Label уровня/силы (если не задано, ищется в дочерних нодах)' })
    public powerLabel: Label | null = null;

    @property({ tooltip: 'Начальный уровень / сила героя' })
    public initialPower: number = 10;

    @property({ tooltip: 'Имя анимации покоя (idle)' })
    public idleAnimationName: string = 'idle';

    @property({ tooltip: 'Скорость анимации idle (1.0 = нормальная скорость)' })
    public idleTimeScale: number = 1.0;

    @property({ tooltip: 'Имя анимации ходьбы (walking)' })
    public walkAnimationName: string = 'walking';

    @property({ tooltip: 'Скорость анимации ходьбы (1.0 = нормальная скорость)' })
    public walkTimeScale: number = 1.0;

    @property({ tooltip: 'Имя анимации атаки (attack)' })
    public attackAnimationName: string = 'attack';

    @property({ tooltip: 'Скорость анимации атаки (1.0 = нормальная скорость)' })
    public attackTimeScale: number = 1.0;

    @property({ tooltip: 'Задержка до контакта удара в секундах (момент опускания меча на врага)' })
    public attackHitDelay: number = 0.25;

    @property({ tooltip: 'Имя анимации гибели (die)' })
    public dieAnimationName: string = 'die';

    @property({ tooltip: 'Скорость анимации гибели (1.0 = нормальная скорость)' })
    public dieTimeScale: number = 1.0;

    @property({ tooltip: 'Время перемещения к противнику в секундах' })
    public moveDuration: number = 2.0;

    @property({ tooltip: 'Дистанция остановки перед противником по X (положительное значение оставит отступ)' })
    public stopDistance: number = 0;

    @property({ tooltip: 'Смотрит ли персонаж вправо по умолчанию (при положительном scale.x)' })
    public isFacingRightDefault: boolean = true;

    /** Callback при поражении героя (вызывается после завершения анимации смерти) */
    public onDefeat: (() => void) | null = () => {
        console.log('Player Defeated! Show Fail Screen / CTA');
    };

    private _power: number = 0;
    private _moveTween: Tween<Node> | null = null;

    protected onLoad(): void {
        if (!this.pathController) {
            this.pathController = this.getComponent(PathController);
        }

        if (!this.routeController) {
            const root = this.node.parent || this.node.scene;
            this.routeController = root.getComponentInChildren(RouteController);
        }

        if (!this.armatureDisplay) {
            this.armatureDisplay = this.getComponentInChildren(dragonBones.ArmatureDisplay);
        }

        if (this.armatureDisplay) {
            this.armatureDisplay.animationCacheMode = dragonBones.ArmatureDisplay.AnimationCacheMode.REALTIME;
        }

        if (!this.powerLabel) {
            this.powerLabel = this.getComponentInChildren(Label);
        }

        this.setPower(this.initialPower);
        this.setWeaponVisible(false);
    }

    start(): void {
        this.playIdle();
    }

    /**
     * Устанавливает текущую силу героя и обновляет Label
     */
    public setPower(value: number): void {
        this._power = value;
        if (this.powerLabel) {
            this.powerLabel.string = `${this._power}`;
        }
    }

    /**
     * Изменяет текущую силу героя на дельту
     */
    public addPower(delta: number): void {
        this.setPower(this._power + delta);
    }

    /**
     * Управляет отображением меча в DragonBones слоте 'sword'
     * @param visible true — показать меч, false — скрыть
     */
    public setWeaponVisible(visible: boolean): void {
        if (!this.armatureDisplay) {
            return;
        }

        const armature = this.armatureDisplay.armature();
        if (!armature) {
            return;
        }

        const slot = armature.getSlot('sword');
        if (slot) {
            // В DragonBones displayIndex = -1 скрывает отображение слота, >= 0 отображает соответствующий display
            slot.displayIndex = visible ? 0 : -1;
        }
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
     * Воспроизводит walking анимацию с заданной скоростью
     */
    public playWalk(): void {
        if (!this.armatureDisplay) {
            return;
        }

        this.armatureDisplay.timeScale = this.walkTimeScale;

        const animState = this.armatureDisplay.playAnimation(this.walkAnimationName, 0);
        if (animState) {
            animState.timeScale = this.walkTimeScale;
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
     * Разворачивает графику персонажа по горизонтали (не затрагивая UI/Label)
     * @param flip true — отразить по горизонтали, false — исходное направление
     */
    public setFlipX(flip: boolean): void {
        const targetNode = this.armatureDisplay ? this.armatureDisplay.node : this.node;
        const currentScale = targetNode.scale;
        const absX = Math.abs(currentScale.x);
        const targetX = flip ? -absX : absX;

        if (currentScale.x !== targetX) {
            targetNode.setScale(targetX, currentScale.y, currentScale.z);
        }
    }

    /**
     * Разворачивает персонажа лицом в направлении цели по оси X
     */
    public faceTowards(targetLocalX: number): void {
        const dx = targetLocalX - this.node.position.x;
        if (Math.abs(dx) < 0.001) {
            return;
        }

        const movingRight = dx > 0;
        // Если персонаж изначально смотрит вправо:
        // движение влево -> flipX = true, движение вправо -> flipX = false
        const flip = this.isFacingRightDefault ? !movingRight : movingRight;
        this.setFlipX(flip);
    }

    /**
     * Перемещает персонажа к указанному противнику и инициирует бой
     */
    public moveToEnemy(enemy: EnemyController | Node): void {
        if (!enemy) {
            return;
        }

        const enemyController = enemy instanceof Node ? enemy.getComponent('EnemyController') as EnemyController | null : enemy;
        if (!enemyController) {
            return;
        }

        if (this._moveTween) {
            this._moveTween.stop();
            this._moveTween = null;
        }

        if (this.pathController && this.routeController) {
            const route = this.routeController.getRouteToEnemy(enemyController);
            if (route.length === 0) {
                return;
            }

            this.playWalk();

            this.pathController.followPath(
                route,
                () => {
                    this.playIdle();
                },
                (reachedNode: Node) => {
                    if (this.routeController) {
                        const index = this.routeController.getWaypointIndex(reachedNode);
                        if (index >= 0) {
                            this.routeController.setLastPassedWaypointIndex(index);
                        }
                    }
                },
                (targetLocalX: number) => {
                    this.faceTowards(targetLocalX);
                }
            );
            return;
        }

        // Запасной fallback на прямолинейное движение, если RouteController не настроен
        this.playWalk();
        const enemyNode = enemyController.node;
        const targetLocalPos = new Vec3();
        if (this.node.parent) {
            this.node.parent.inverseTransformPoint(targetLocalPos, enemyNode.worldPosition);
        } else {
            targetLocalPos.set(enemyNode.worldPosition);
        }

        this.faceTowards(targetLocalPos.x);

        if (this.stopDistance > 0) {
            const directionX = this.node.position.x < targetLocalPos.x ? -1 : 1;
            targetLocalPos.x += directionX * this.stopDistance;
        }

        this._moveTween = tween(this.node)
            .to(this.moveDuration, { position: targetLocalPos })
            .call(() => {
                this._moveTween = null;
                this.playIdle();
            })
            .start();
    }

    /**
     * Поражение / гибель героя с анимацией die
     * @param onComplete callback по окончании анимации смерти
     */
    public die(onComplete?: () => void): void {
        // Скрываем плашку уровня/силы при гибели
        if (this.powerLabel) {
            this.powerLabel.node.active = false;
        }

        if (!this.armatureDisplay) {
            if (onComplete) onComplete();
            return;
        }

        const onDieComplete = () => {
            this.armatureDisplay?.removeEventListener(dragonBones.EventObject.COMPLETE, onDieComplete, this);
            if (onComplete) {
                onComplete();
            }
        };

        this.armatureDisplay.timeScale = this.dieTimeScale;
        this.armatureDisplay.addEventListener(dragonBones.EventObject.COMPLETE, onDieComplete, this);

        const animState = this.armatureDisplay.playAnimation(this.dieAnimationName, 1);
        if (!animState) {
            onDieComplete();
        } else {
            animState.timeScale = this.dieTimeScale;
        }
    }

    /**
     * Перемещает персонажа к указанному оружию и экипирует его
     */
    public moveToWeapon(weapon: WeaponController | Node): void {
        if (!weapon) {
            return;
        }

        const weaponNode = weapon instanceof Node ? weapon : weapon.node;
        const weaponController = weapon instanceof Node ? weapon.getComponent('WeaponController') as WeaponController | null : weapon;

        if (this._moveTween) {
            this._moveTween.stop();
            this._moveTween = null;
        }

        this.playWalk();

        const targetLocalPos = new Vec3();
        if (this.node.parent) {
            this.node.parent.inverseTransformPoint(targetLocalPos, weaponNode.worldPosition);
        } else {
            targetLocalPos.set(weaponNode.worldPosition);
        }

        this.faceTowards(targetLocalPos.x);

        if (this.stopDistance > 0) {
            const directionX = this.node.position.x < targetLocalPos.x ? -1 : 1;
            targetLocalPos.x += directionX * this.stopDistance;
        }

        this._moveTween = tween(this.node)
            .to(this.moveDuration, { position: targetLocalPos })
            .call(() => {
                this._moveTween = null;
                this.playIdle();

                if (weaponController) {
                    this.addPower(weaponController.power);
                    weaponController.removeWeapon();
                } else {
                    weaponNode.destroy();
                }

                this.setWeaponVisible(true);
            })
            .start();
    }
}
