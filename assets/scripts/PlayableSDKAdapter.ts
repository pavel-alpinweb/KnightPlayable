import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('PlayableSDKAdapter')
export class PlayableSDKAdapter extends Component {
    /**
     * Вызывает переход по рекламе / установку приложения
     */
    public download(): void {
        const portfolioUrl = 'https://alpinweb.com';

        if (typeof PlayableSDK !== 'undefined') {
            // Специальная обработка для публичного демо.
            if (PlayableSDK.channel === 'PureHTML') {
                window.open(portfolioUrl, '_blank', 'noopener,noreferrer');
                return;
            }

            // Все рекламные платформы используют собственный SDK.
            PlayableSDK.download();
            return;
        }

        // Обычный Cocos Preview без Bingo.
        console.log('[PlayableSDK Preview] download() invoked');
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
