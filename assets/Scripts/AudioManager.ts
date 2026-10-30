import { _decorator, Component, AudioSource, AudioClip } from 'cc';
import { GlobalEvents, EventID } from './EventBus';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;
    public static get instance() {
        return this._instance;
    }

    @property(AudioSource) bgmSource: AudioSource = null;
    @property(AudioSource) sfxSource: AudioSource = null;
    @property(AudioSource) walkSource: AudioSource = null;

    @property(AudioClip) bgmMusic: AudioClip = null;
    @property(AudioClip) ctaClip: AudioClip = null;
    @property(AudioClip) putClip: AudioClip = null;
    @property(AudioClip) popClip: AudioClip = null;
    @property(AudioClip) walkClip: AudioClip = null;

    protected onLoad() {
        if (!AudioManager._instance) {
            AudioManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        if (this.bgmSource && this.bgmMusic) {
            this.bgmSource.clip = this.bgmMusic;
            this.bgmSource.loop = true;
            this.bgmSource.volume = 0.05;
            this.bgmSource.playOnAwake = false;
        }

        if (this.walkSource && this.walkClip) {
            this.walkSource.clip = this.walkClip;
            this.walkSource.loop = true;
            this.walkSource.volume = 0.8;
            this.walkSource.playOnAwake = false;
        }

        GlobalEvents.on(EventID.GAME_STARTED, this.playBGM, this);
    }

    protected onDestroy() {
        GlobalEvents.targetOff(this);
    }

    public playBGM() {
        if (!this.bgmSource || this.bgmSource.playing) return;
        this.bgmSource.play();
    }

    public stopBGM() {
        if (this.bgmSource) this.bgmSource.stop();
    }

    private playSFX(clip: AudioClip, volume: number = 1.0) {
        if (clip && this.sfxSource) {
            this.sfxSource.playOneShot(clip, volume);
        }
    }

    public playPutSound() {
        this.playSFX(this.putClip, 1.0);
    }
    public playPopSound() {
        this.playSFX(this.popClip, 0.8);
    }

    public playWalkSound() {
        if (this.walkSource && !this.walkSource.playing) {
            this.walkSource.play();
        }
    }

    public stopWalkSound() {
        if (this.walkSource && this.walkSource.playing) {
            this.walkSource.stop();
        }
    }

    public playCtaSound() {
        if (this.bgmSource && this.bgmSource.playing) {
            this.bgmSource.volume = 0.01;
        }
        this.stopWalkSound();
        this.playSFX(this.ctaClip, 1.0);
    }
}
