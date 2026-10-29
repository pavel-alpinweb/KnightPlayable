import { _decorator, Component, Node, Vec3, Vec2, math, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow2D')
export class CameraFollow2D extends Component {
    @property({
        type: Node,
        tooltip: 'Узел игрового мира, который двигаем и зумим (Game Root)',
    })
    public gameRoot: Node = null!;

    @property({
        type: Node,
        tooltip: 'Персонаж, за которым следуем',
    })
    public target: Node = null!;

    @property({
        group: { name: 'Portrait', id: '1' },
        tooltip: 'Зум в портретной ориентации (высота > ширины)',
    })
    public portraitZoom: number = 1.0;

    @property({
        group: { name: 'Portrait', id: '1' },
        tooltip: 'Смещение фокуса в портрете',
    })
    public portraitOffset: Vec3 = new Vec3(0, -150, 0);

    @property({
        group: { name: 'Landscape', id: '2' },
        tooltip: 'Зум в альбомной ориентации (ширина > высоты). Обычно 0.5 - 0.7',
    })
    public landscapeZoom: number = 0.55;

    @property({
        group: { name: 'Landscape', id: '2' },
        tooltip: 'Смещение фокуса в альбоме (по вертикали обычно ближе к 0)',
    })
    public landscapeOffset: Vec3 = new Vec3(0, -30, 0);

    @property({
        tooltip: 'Размер мертвой зоны (X = ширина, Y = высота)',
    })
    public deadzone: Vec2 = new Vec2(300, 200);

    @property({
        tooltip: 'Коэффициент сглаживания движения (0 = мгновенно, > 0 плавное следование)',
    })
    public smoothSpeed: number = 5.0;

    @property({
        group: { name: 'Shake', id: '3' },
        tooltip: 'Сила тряски камеры по умолчанию (в пикселях)',
    })
    public defaultShakeIntensity: number = 12;

    @property({
        group: { name: 'Shake', id: '3' },
        tooltip: 'Длительность тряски камеры по умолчанию (в секундах)',
    })
    public defaultShakeDuration: number = 0.2;

    private _desiredPos: Vec3 = new Vec3();
    private _isInitialized: boolean = false;
    private _lastIsPortrait: boolean | null = null;
    private _currentZoom: number = 1.0;
    private _currentOffset: Vec3 = new Vec3();

    private _shakeDuration: number = 0;
    private _shakeTimer: number = 0;
    private _shakeIntensity: number = 0;

    start() {
        this.resetToTarget();
        view.on('canvas-resize', this._onScreenResize, this);
    }

    onDestroy() {
        view.off('canvas-resize', this._onScreenResize, this);
    }

    private _onScreenResize() {
        const isPortrait = this.getIsPortrait();
        if (this._lastIsPortrait !== isPortrait) {
            this._lastIsPortrait = isPortrait;
            // Пересчитываем масштаб и стартовую позицию ТОЛЬКО при смене ориентации
            this.resetToTarget();
        }
    }

    public getIsPortrait(): boolean {
        const size = view.getVisibleSize();
        return size.height > size.width;
    }

    /**
     * Запускает тряску камеры с постепенным затуханием
     * @param intensity Сила смещения (если не передана, берется defaultShakeIntensity)
     * @param duration Длительность в секундах (если не передана, берется defaultShakeDuration)
     */
    public shake(intensity: number = this.defaultShakeIntensity, duration: number = this.defaultShakeDuration): void {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }

    /**
     * Вызывается при старте игры или смене ориентации экрана.
     * Применяет масштаб (zoom) и выставляет gameRoot в стартовое положение (startOffset).
     */
    public resetToTarget() {
        if (!this.target || !this.gameRoot) {
            return;
        }

        this._lastIsPortrait = this.getIsPortrait();
        this._currentZoom = this._lastIsPortrait ? this.portraitZoom : this.landscapeZoom;
        const offset = this._lastIsPortrait ? this.portraitOffset : this.landscapeOffset;
        this._currentOffset.set(offset);

        // 1. Зум выставляется ОДИН РАЗ, а не каждый кадр
        this.gameRoot.setScale(this._currentZoom, this._currentZoom, 1);

        // 2. Стартовая позиция рассчитывается по startOffset
        const targetPos = this.target.position;
        const initialX = this._currentOffset.x - targetPos.x * this._currentZoom;
        const initialY = this._currentOffset.y - targetPos.y * this._currentZoom;

        this._desiredPos.set(initialX, initialY, this.gameRoot.position.z);
        this.gameRoot.setPosition(this._desiredPos);
        this._isInitialized = true;
    }

    lateUpdate(deltaTime: number) {
        if (!this.target || !this.gameRoot || !this._isInitialized) {
            return;
        }

        // Проверяем поворот экрана (на случай если событие resize пришло с задержкой)
        const isPortrait = this.getIsPortrait();
        if (this._lastIsPortrait !== isPortrait) {
            this._onScreenResize();
            return;
        }

        // Текущее положение персонажа на экране (в координатах Canvas)
        const targetPos = this.target.position;
        const screenX = this._desiredPos.x + targetPos.x * this._currentZoom;
        const screenY = this._desiredPos.y + targetPos.y * this._currentZoom;

        const halfWidth = this.deadzone.x * 0.5;
        const halfHeight = this.deadzone.y * 0.5;

        // Зона deadzone центрируется относительно стартового фокуса
        const deltaX = screenX - this._currentOffset.x;
        const deltaY = screenY - this._currentOffset.y;

        // Если персонаж выходит за границы deadzone — смещаем фокус камеры
        if (deltaX > halfWidth) {
            this._desiredPos.x -= deltaX - halfWidth;
        } else if (deltaX < -halfWidth) {
            this._desiredPos.x -= deltaX + halfWidth;
        }

        if (deltaY > halfHeight) {
            this._desiredPos.y -= deltaY - halfHeight;
        } else if (deltaY < -halfHeight) {
            this._desiredPos.y -= deltaY + halfHeight;
        }

        const currentPos = this.gameRoot.position;

        // Двигаем игровой мир
        let targetX = this._desiredPos.x;
        let targetY = this._desiredPos.y;

        if (this.smoothSpeed > 0) {
            const t = Math.min(1.0, deltaTime * this.smoothSpeed);
            targetX = math.lerp(currentPos.x, this._desiredPos.x, t);
            targetY = math.lerp(currentPos.y, this._desiredPos.y, t);
        }

        // Рассчитываем затухающее смещение тряски
        let offsetX = 0;
        let offsetY = 0;
        if (this._shakeTimer > 0) {
            this._shakeTimer -= deltaTime;
            const progress = Math.max(0, this._shakeTimer / this._shakeDuration);
            const currentIntensity = this._shakeIntensity * progress;
            offsetX = (Math.random() * 2 - 1) * currentIntensity;
            offsetY = (Math.random() * 2 - 1) * currentIntensity;
        }

        this.gameRoot.setPosition(targetX + offsetX, targetY + offsetY, currentPos.z);
    }
}
