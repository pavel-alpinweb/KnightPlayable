import { _decorator, Component, Node } from 'cc';
import { EnemyController } from './EnemyController';
const { ccclass, property } = _decorator;

@ccclass('RouteController')
export class RouteController extends Component {
    @property({ type: [Node], tooltip: 'Упорядоченный список точек маршрута (Waypoints)' })
    public waypoints: Node[] = [];

    /** Индекс последней успешно достигнутой точки маршрута (-1, если герой еще в стартовой позиции) */
    private _lastPassedWaypointIndex: number = -1;

    /**
     * Возвращает массив нод маршрута к выбранному противнику.
     * Включает промежуточные вейпоинты и завершается attackPoint противника.
     */
    public getRouteToEnemy(enemy: EnemyController): Node[] {
        if (!enemy) {
            return [];
        }

        const attackPoint = enemy.attackPoint || enemy.node;
        const targetIndex = enemy.routeIndex;
        const route: Node[] = [];

        // Добавляем все непройденные вейпоинты вплоть до targetIndex врага
        const startIndex = Math.max(0, this._lastPassedWaypointIndex + 1);
        const endIndex = Math.min(targetIndex, this.waypoints.length - 1);

        for (let i = startIndex; i <= endIndex; i++) {
            const wp = this.waypoints[i];
            if (wp && wp.isValid) {
                route.push(wp);
            }
        }

        // Финальной точкой маршрута всегда является attackPoint выбранного противника
        if (attackPoint && attackPoint.isValid) {
            route.push(attackPoint);
        }

        return route;
    }

    /**
     * Фиксирует индекс пройденной точки, чтобы герой не возвращался назад
     */
    public setLastPassedWaypointIndex(index: number): void {
        if (index > this._lastPassedWaypointIndex) {
            this._lastPassedWaypointIndex = index;
        }
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
        this._lastPassedWaypointIndex = -1;
    }
}
