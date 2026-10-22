import { _decorator, Component, Node } from 'cc';
import { EnemyController } from './EnemyController';
const { ccclass, property } = _decorator;

@ccclass('RouteController')
export class RouteController extends Component {
    @property({ type: [Node], tooltip: 'Упорядоченный список точек маршрута (Waypoints)' })
    public waypoints: Node[] = [];

    /** Индекс текущей контрольной точки маршрута (-1, если герой еще в стартовой позиции перед первым вейпоинтом) */
    private _currentWaypointIndex: number = -1;

    /**
     * Возвращает массив нод маршрута к выбранному противнику в любом направлении (вперед или назад).
     * Включает промежуточные вейпоинты и завершается attackPoint выбранного противника.
     */
    public getRouteToEnemy(enemy: EnemyController): Node[] {
        if (!enemy || this.waypoints.length === 0) {
            return [];
        }

        const attackPoint = enemy.attackPoint || enemy.node;
        const targetIndex = Math.max(0, Math.min(enemy.routeIndex, this.waypoints.length - 1));
        const route: Node[] = [];

        if (this._currentWaypointIndex === -1) {
            // Герой еще не дошел ни до одной точки — идет от начала (0) до targetIndex
            for (let i = 0; i <= targetIndex; i++) {
                const wp = this.waypoints[i];
                if (wp && wp.isValid) {
                    route.push(wp);
                }
            }
        } else if (this._currentWaypointIndex < targetIndex) {
            // Движение вперед: от следующей точки после текущей до targetIndex
            for (let i = this._currentWaypointIndex + 1; i <= targetIndex; i++) {
                const wp = this.waypoints[i];
                if (wp && wp.isValid) {
                    route.push(wp);
                }
            }
        } else if (this._currentWaypointIndex > targetIndex) {
            // Движение назад (возврат): идем в обратном порядке от текущей/предыдущей точки до targetIndex
            for (let i = this._currentWaypointIndex; i >= targetIndex; i--) {
                const wp = this.waypoints[i];
                if (wp && wp.isValid) {
                    route.push(wp);
                }
            }
        }

        // Финальной точкой всегда является attackPoint выбранного противника
        if (attackPoint && attackPoint.isValid) {
            route.push(attackPoint);
        }

        return route;
    }

    /**
     * Фиксирует индекс достигнутой точки маршрута (работает в обоих направлениях)
     */
    public setCurrentWaypointIndex(index: number): void {
        this._currentWaypointIndex = index;
    }

    /**
     * Находит индекс переданной ноды в массиве waypoints
     */
    public getWaypointIndex(node: Node): number {
        return this.waypoints.indexOf(node);
    }

    /**
     * Сброс прогресса маршрута (например, при перезапуске уровня)
     */
    public resetRoute(): void {
        this._currentWaypointIndex = -1;
    }
}
