import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('PlayableSDKAdapter')
export class PlayableSDKAdapter extends Component {
    /**
     * Вызывает переход по рекламе / установку приложения
     */
    public download(): void {
        if (typeof PlayableSDK !== 'undefined' && typeof PlayableSDK.download === 'function') {
            PlayableSDK.download();
        } else {
            console.log('[PlayableSDK Preview] download() invoked (SDK unavailable in editor preview)');
        }
    }

    /**
     * Оповещает рекламную сеть о завершении игры (победа или поражение)
     */
    public gameEnd(): void {
        if (typeof PlayableSDK !== 'undefined' && typeof PlayableSDK.game_end === 'function') {
            PlayableSDK.game_end();
        } else {
            console.log('[PlayableSDK Preview] game_end() invoked (SDK unavailable in editor preview)');
        }
    }
}
