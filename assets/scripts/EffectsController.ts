import { _decorator, Component, Node, Prefab, instantiate, ParticleSystem2D, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffectsController')
export class EffectsController extends Component {
    @property({ type: Prefab, tooltip: 'Префаб эффекта гибели врага (ParticleSystem2D)' })
    public enemyDeathPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: 'Префаб эффекта повышения уровня героя (ParticleSystem2D)' })
    public levelUpPrefab: Prefab | null = null;

    @property({ type: Node, tooltip: 'Контейнер для создаваемых эффектов (если не задан, используется эта нода)' })
    public effectsContainer: Node | null = null;

    protected onLoad(): void {
        if (!this.effectsContainer) {
            this.effectsContainer = this.node;
        }
    }

    /**
     * Воспроизводит эффект гибели врага в мировых координатах
     */
    public playEnemyDeath(position: Vec3): void {
        this._spawnEffect(this.enemyDeathPrefab, position);
    }

    /**
     * Воспроизводит эффект повышения уровня героя в мировых координатах
     */
    public playLevelUp(position: Vec3): void {
        this._spawnEffect(this.levelUpPrefab, position);
    }

    /**
     * Вспомогательный метод инстанцирования и запуска ParticleSystem2D
     */
    private _spawnEffect(prefab: Prefab | null, worldPos: Vec3): void {
        if (!prefab) {
            console.warn('[EffectsController] Prefab reference is missing!');
            return;
        }

        const container = this.effectsContainer && this.effectsContainer.isValid ? this.effectsContainer : this.node;
        if (!container || !container.isValid) {
            console.warn('[EffectsController] Effects container node is invalid or missing!');
            return;
        }

        const effectNode = instantiate(prefab);
        if (!effectNode) {
            return;
        }

        container.addChild(effectNode);
        effectNode.setWorldPosition(worldPos);

        const particle = effectNode.getComponent(ParticleSystem2D) || effectNode.getComponentInChildren(ParticleSystem2D);
        if (particle) {
            particle.resetSystem();
        } else {
            console.warn('[EffectsController] ParticleSystem2D component was not found in prefab instance:', prefab.name);
        }
    }
}
