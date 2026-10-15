import { _decorator, Component, dragonBones, Tween, tween, Node, Vec3 } from 'cc';
import type { WeaponController } from './WeaponController';
const { ccclass, property, requireComponent } = _decorator;


@ccclass('HeroController')
@requireComponent(dragonBones.ArmatureDisplay)
export class HeroController extends Component {
    @property({ tooltip: 'Имя анимации покоя (idle)' })
    public idleAnimationName: string = 'idle';

    @property({ tooltip: 'Скорость анимации idle (1.0 = нормальная скорость)' })
    public idleTimeScale: number = 1.0;

    @property({ tooltip: 'Имя анимации ходьбы (walking)' })
    public walkAnimationName: string = 'walking';

    @property({ tooltip: 'Скорость анимации ходьбы (1.0 = нормальная скорость)' })
    public walkTimeScale: number = 1.0;

    @property({ tooltip: 'Время перемещения к противнику в секундах' })
    public moveDuration: number = 2.0;

    @property({ tooltip: 'Дистанция остановки перед противником по X (положительное значение оставит отступ)' })
    public stopDistance: number = 0;

    @property({ tooltip: 'Смотрит ли персонаж вправо по умолчанию (при положительном scale.x)' })
    public isFacingRightDefault: boolean = true;

    private _armatureDisplay!: dragonBones.ArmatureDisplay;
    private _moveTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this._armatureDisplay = this.getComponent(dragonBones.ArmatureDisplay)!;
        this._armatureDisplay.animationCacheMode = dragonBones.ArmatureDisplay.AnimationCacheMode.REALTIME;
        this.setWeaponVisible(false);
    }

    start(): void {
        this.playIdle();
    }

    /**
     * Управляет отображением меча в DragonBones слоте 'sword'
     * @param visible true — показать меч, false — скрыть
     */
    public setWeaponVisible(visible: boolean): void {
        const armature = this._armatureDisplay.armature();
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
        this._armatureDisplay.timeScale = this.idleTimeScale;

        const animState = this._armatureDisplay.playAnimation(this.idleAnimationName, 0);
        if (animState) {
            animState.timeScale = this.idleTimeScale;
        }
    }

    /**
     * Воспроизводит walking анимацию с заданной скоростью
     */
    public playWalk(): void {
        this._armatureDisplay.timeScale = this.walkTimeScale;

        const animState = this._armatureDisplay.playAnimation(this.walkAnimationName, 0);
        if (animState) {
            animState.timeScale = this.walkTimeScale;
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

    /**
     * Разворачивает персонажа по горизонтали
     * @param flip true — отразить по горизонтали, false — исходное направление
     */
    public setFlipX(flip: boolean): void {
        const currentScale = this.node.scale;
        const absX = Math.abs(currentScale.x);
        const targetX = flip ? -absX : absX;

        if (currentScale.x !== targetX) {
            this.node.setScale(targetX, currentScale.y, currentScale.z);
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
     * Перемещает персонажа к указанной ноде противника
     */
    public moveToEnemy(enemyNode: Node): void {
        if (!enemyNode) {
            return;
        }

        if (this._moveTween) {
            this._moveTween.stop();
            this._moveTween = null;
        }

        this.playWalk();

        // Переводим мировую позицию противника в локальные координаты родителя персонажа
        const targetLocalPos = new Vec3();
        if (this.node.parent) {
            this.node.parent.inverseTransformPoint(targetLocalPos, enemyNode.worldPosition);
        } else {
            targetLocalPos.set(enemyNode.worldPosition);
        }

        // Разворачиваем лицом к противнику
        this.faceTowards(targetLocalPos.x);

        // Учитываем дистанцию остановки (если персонаж слева от врага — останавливаемся левее)
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

                if (weaponController && typeof weaponController.removeWepon === 'function') {
                    weaponController.removeWepon();
                } else {
                    weaponNode.destroy();
                }

                this.setWeaponVisible(true);
            })
            .start();
    }
}
