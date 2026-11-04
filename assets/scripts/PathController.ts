import { _decorator, Component, Node, Vec3, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PathController')
export class PathController extends Component {
    @property({ tooltip: 'Скорость перемещения героя в единицах в секунду' })
    public speed: number = 300;

    private _currentTween: Tween<Node> | null = null;
    private _isMoving: boolean = false;
    private _onPointReachedCallback: ((node: Node) => void) | null = null;
    private _onCompleteCallback: (() => void) | null = null;

    public get isMoving(): boolean {
        return this._isMoving;
    }

    /**
     * Запускает последовательное перемещение героя по переданному маршруту
     * @param path Массив целевых нод
     * @param onComplete Вызывается при достижении конечной точки
     * @param onPointReached Вызывается при прохождении каждой промежуточной ноды
     * @param faceCallback Вызывается перед каждым сегментом для поворота персонажа (targetLocalX)
     */
    public followPath(
        path: Node[],
        onComplete?: () => void,
        onPointReached?: (node: Node) => void,
        faceCallback?: (targetLocalX: number) => void
    ): void {
        this.stop();

        if (!path || path.length === 0 || this.speed <= 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this._isMoving = true;
        this._onCompleteCallback = onComplete || null;
        this._onPointReachedCallback = onPointReached || null;

        const parentNode = this.node.parent;
        let chain = tween(this.node);
        const tempLocalPos = new Vec3();
        let lastPos = this.node.position.clone();

        for (let i = 0; i < path.length; i++) {
            const targetNode = path[i];
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            // Переводим мировую позицию ноды в локальные координаты родителя героя
            if (parentNode) {
                parentNode.inverseTransformPoint(tempLocalPos, targetNode.worldPosition);
            } else {
                tempLocalPos.set(targetNode.worldPosition);
            }

            const segmentTargetPos = tempLocalPos.clone();
            const distance = Vec3.distance(lastPos, segmentTargetPos);

            // Если позиции совпадают, пропускаем перемещение, но вызываем callback
            if (distance < 0.001) {
                chain = chain.call(() => {
                    if (this._onPointReachedCallback) {
                        this._onPointReachedCallback(targetNode);
                    }
                });
                continue;
            }

            const duration = distance / this.speed;

            // Перед началом движения к точке разворачиваем персонажа
            chain = chain.call(() => {
                if (faceCallback) {
                    faceCallback(segmentTargetPos.x);
                }
            });

            // Линейное движение к целевой точке
            chain = chain.to(duration, { position: segmentTargetPos }, { easing: 'linear' });

            // По прибытию на точку
            chain = chain.call(() => {
                if (this._onPointReachedCallback) {
                    this._onPointReachedCallback(targetNode);
                }
            });

            lastPos = segmentTargetPos;
        }

        // Завершение всего маршрута
        chain = chain.call(() => {
            this._isMoving = false;
            this._currentTween = null;
            const completeCb = this._onCompleteCallback;
            this._onCompleteCallback = null;
            this._onPointReachedCallback = null;

            if (completeCb) {
                completeCb();
            }
        });

        this._currentTween = chain;
        this._currentTween.start();
    }

    /**
     * Принудительно останавливает текущее движение и отменяет коллбэки
     */
    public stop(): void {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
        this._isMoving = false;
        this._onCompleteCallback = null;
        this._onPointReachedCallback = null;
    }

    protected onDestroy(): void {
        this.stop();
    }
}
