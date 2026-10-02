import {
    _decorator,
    Component,
    Node,
    view
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ResponsiveGameLayout')
export class ResponsiveGameLayout extends Component {

    @property(Node)
    gameRoot: Node = null!;

    @property(Node)
    portraitLayout: Node = null!;

    @property(Node)
    landscapeLayout: Node = null!;

    start() {
        this.updateLayout();

        view.on(
            'canvas-resize',
            this.updateLayout,
            this
        );
    }

    private updateLayout() {
        const size = view.getVisibleSize();

        const isPortrait = size.height > size.width;

        const targetLayout = isPortrait
            ? this.portraitLayout
            : this.landscapeLayout;

        this.gameRoot.setPosition(targetLayout.position);
        this.gameRoot.setScale(targetLayout.scale);
    }

    onDestroy() {
        view.off(
            'canvas-resize',
            this.updateLayout,
            this
        );
    }
}
