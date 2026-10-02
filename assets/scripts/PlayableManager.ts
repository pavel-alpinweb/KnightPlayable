import { _decorator, Component, Node, Animation, dragonBones } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayableManager')
export class PlayableManager extends Component {
    @property({
        type: Node,
        tooltip: 'Корневой узел игрового мира (персонажи, препятствия и т.д.)',
    })
    public gameRoot: Node = null;

    public isGameStarted: boolean = false;

    private _animations: Animation[] = [];
    private _dragonBones: dragonBones.ArmatureDisplay[] = [];

    start() {
        this.pauseGame();
    }

    public pauseGame() {
        this.isGameStarted = false;

        if (this.gameRoot) {
            // Остановка стандартных cc.Animation
            this._animations = this.gameRoot.getComponentsInChildren(Animation);
            for (const anim of this._animations) {
                anim.pause();
            }

            // Остановка анимаций DragonBones (персонаж остаётся видимым в позе idle)
            this._dragonBones = this.gameRoot.getComponentsInChildren(dragonBones.ArmatureDisplay);
            for (const db of this._dragonBones) {
                db.timeScale = 0;
            }

            // Отключаем компоненты игровой логики, не затрагивая рендереры
            this._setGameComponentsEnabled(this.gameRoot, false);
        }
    }

    public startGame() {
        if (this.isGameStarted) {
            return;
        }
        this.isGameStarted = true;

        if (this.gameRoot) {
            // Включаем компоненты логики
            this._setGameComponentsEnabled(this.gameRoot, true);

            // Возобновляем стандартные анимации
            for (const anim of this._animations) {
                anim.resume();
            }

            // Возобновляем DragonBones анимации
            for (const db of this._dragonBones) {
                db.timeScale = 1;
            }
        }
    }

    private _setGameComponentsEnabled(node: Node, enabled: boolean) {
        const components = node.getComponentsInChildren(Component);
        for (const comp of components) {
            if (comp === this) {
                continue;
            }

            // Исключаем все рендереры (DragonBones, Spine, Sprite, Label, Mesh и т.д.),
            // чтобы графика оставалась видна на сцене
            if (
                comp instanceof dragonBones.ArmatureDisplay ||
                comp instanceof Animation ||
                comp.name.includes('Renderer') ||
                comp.name.includes('Display') ||
                comp.name.includes('Sprite') ||
                comp.name.includes('Label') ||
                comp.name.includes('Camera') ||
                comp.name.includes('Transform')
            ) {
                continue;
            }

            comp.enabled = enabled;
        }
    }

    update(deltaTime: number) {
        if (!this.isGameStarted) {
            return;
        }
    }
}
