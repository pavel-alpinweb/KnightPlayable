
import { _decorator, Component, Node } from 'cc';
import { EnemyController } from './EnemyController';
const { ccclass, property } = _decorator;

@ccclass('EnemiesManager')
export class EnemiesManager extends Component {
    /** Callback при победе (когда все враги уничтожены) */
    public onVictory: (() => void) | null = null;

    private _remainingEnemiesCount: number = 0;

    protected onLoad(): void {
        this._initEnemies();
    }

    private _initEnemies(): void {
        const enemies = this.node.getComponentsInChildren(EnemyController);
        this._remainingEnemiesCount = enemies.length;
    }

    /**
     * Вызывается, когда враг уничтожен
     */
    public onEnemyDied(enemy?: EnemyController): void {
        this._remainingEnemiesCount = Math.max(0, this._remainingEnemiesCount - 1);

        if (this._remainingEnemiesCount === 0) {
            if (this.onVictory) {
                this.onVictory();
            }
        }
    }

    /**
     * Возвращает текущее количество оставшихся врагов
     */
    public get remainingCount(): number {
        return this._remainingEnemiesCount;
    }
}
