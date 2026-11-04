import { _decorator, Component, AudioClip, AudioSource, clamp01 } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('AudioController')
@requireComponent(AudioSource)
export class AudioController extends Component {
    // --- Audio Clips ---
    @property({ type: AudioClip, tooltip: 'Удар мечом героя' })
    public swordClip: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Удар дробящим оружием противника' })
    public whumpClip: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Повышение уровня героя' })
    public powerUpClip: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Звук победы' })
    public successClip: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Звук поражения' })
    public defeatClip: AudioClip | null = null;

    // --- Volume Settings ---
    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Общая громкость эффектов (0..1)' })
    public masterVolume: number = 1.0;

    @property({ tooltip: 'Включены ли звуковые эффекты' })
    public soundEnabled: boolean = true;

    // --- Per-effect Volume Scales ---
    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Индивидуальная громкость удара мечом' })
    public swordVolume: number = 1.0;

    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Индивидуальная громкость удара врага' })
    public whumpVolume: number = 1.0;

    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Индивидуальная громкость повышения уровня' })
    public powerUpVolume: number = 1.0;

    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Индивидуальная громкость победы' })
    public successVolume: number = 1.0;

    @property({ range: [0, 1, 0.05], slide: true, tooltip: 'Индивидуальная громкость поражения' })
    public defeatVolume: number = 1.0;

    // --- Cooldowns (ms) ---
    private readonly _swordCooldownMs: number = 100;
    private readonly _whumpCooldownMs: number = 120;
    private readonly _powerUpCooldownMs: number = 300;

    // --- Timestamps & Flags ---
    private _lastSwordTime: number = 0;
    private _lastWhumpTime: number = 0;
    private _lastPowerUpTime: number = 0;
    private _hasPlayedSuccess: boolean = false;
    private _hasPlayedDefeat: boolean = false;

    /** Флаг разблокировки WebAudio / Autoplay после первого взаимодействия */
    private _isAudioUnlocked: boolean = false;

    private _audioSource: AudioSource | null = null;

    protected onLoad(): void {
        this._audioSource = this.getComponent(AudioSource);
        if (this._audioSource) {
            // Гарантируем отсутствие автозапуска и зацикливания
            this._audioSource.playOnAwake = false;
            this._audioSource.loop = false;
        }
    }

    /**
     * Разблокирует воспроизведение звука при первом пользовательском взаимодействии.
     * До вызова этого метода звуки блокируются согласно требованиям мобильных браузеров.
     */
    public unlockAudio(): void {
        this._isAudioUnlocked = true;
    }

    /**
     * Включение / отключение звука (например, кнопка Mute).
     */
    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
    }

    /**
     * Установка общей громкости (0..1).
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = clamp01(volume);
    }

    /**
     * Воспроизводит удар мечом героя (cooldown: 100 мс).
     */
    public playSword(): void {
        const now = performance.now();
        if (now - this._lastSwordTime < this._swordCooldownMs) {
            return;
        }
        this._lastSwordTime = now;
        this._playSound(this.swordClip, this.swordVolume);
    }

    /**
     * Воспроизводит удар врага (cooldown: 120 мс).
     */
    public playWhump(): void {
        const now = performance.now();
        if (now - this._lastWhumpTime < this._whumpCooldownMs) {
            return;
        }
        this._lastWhumpTime = now;
        this._playSound(this.whumpClip, this.whumpVolume);
    }

    /**
     * Воспроизводит звук повышения уровня (cooldown: 300 мс).
     */
    public playPowerUp(): void {
        const now = performance.now();
        if (now - this._lastPowerUpTime < this._powerUpCooldownMs) {
            return;
        }
        this._lastPowerUpTime = now;
        this._playSound(this.powerUpClip, this.powerUpVolume);
    }

    /**
     * Воспроизводит звук победы (защита от повторного вызова).
     */
    public playSuccess(): void {
        if (this._hasPlayedSuccess) {
            return;
        }
        this._hasPlayedSuccess = true;
        this._playSound(this.successClip, this.successVolume);
    }

    /**
     * Воспроизводит звук поражения (защита от повторного вызова).
     */
    public playDefeat(): void {
        if (this._hasPlayedDefeat) {
            return;
        }
        this._hasPlayedDefeat = true;
        this._playSound(this.defeatClip, this.defeatVolume);
    }

    /**
     * Единый приватный метод воспроизведения через AudioSource.playOneShot.
     */
    private _playSound(clip: AudioClip | null, volumeScale: number = 1.0): void {
        if (!this.soundEnabled || !this._isAudioUnlocked) {
            return;
        }

        if (!clip || !this._audioSource) {
            return;
        }

        const effectiveVolume = clamp01(this.masterVolume * volumeScale);
        if (effectiveVolume <= 0) {
            return;
        }

        this._audioSource.playOneShot(clip, effectiveVolume);
    }
}
