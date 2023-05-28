/**
 * @file 播放器
 */
import debounce from "lodash/fp/debounce";
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { MediaSourceProfile } from "@/domains/tv/services";
import { EpisodeResolutionTypes } from "@/domains/tv/constants";

enum Events {
  /** 改变播放地址（切换剧集或分辨率） */
  UrlChange,
  /** 调整进度 */
  CurrentTimeChange,
  /** 分辨率改变 */
  ResolutionChange,
  /** 音量改变 */
  VolumeChange,
  /** 宽高改变 */
  SizeChange,
  /** 预加载 */
  Preload,
  Ready,
  Loaded,
  /** 播放源加载完成 */
  SourceLoaded,
  /** 准备播放 */
  CanPlay,
  /** 开始播放 */
  Play,
  /** 播放进度改变 */
  Progress,
  /** 暂停 */
  Pause,
  /** 快要结束，这时可以提取加载下一集剧集信息 */
  BeforeEnded,
  /** 播放结束 */
  End,
}
type TheTypesOfEvents = {
  [Events.UrlChange]: MediaSourceProfile;
  [Events.CurrentTimeChange]: { currentTime: number };
  [Events.ResolutionChange]: {
    type: EpisodeResolutionTypes;
    text: string;
  };
  [Events.VolumeChange]: { volume: number };
  [Events.SizeChange]: { width: number; height: number };
  [Events.Ready]: void;
  // EpisodeProfile
  [Events.SourceLoaded]: Partial<{
    width: number;
    height: number;
    url: string;
    currentTime: number;
  }>;
  [Events.Loaded]: void;
  [Events.CanPlay]: void;
  [Events.Play]: void;
  [Events.Pause]: { currentTime: number; duration: number };
  [Events.Progress]: {
    currentTime: number;
    duration: number;
    progress: number;
  };
  [Events.Preload]: { url: string };
  [Events.BeforeEnded]: void;
  [Events.End]: {
    current_time: number;
    duration: number;
  };
};

export class PlayerCore extends BaseDomain<TheTypesOfEvents> {
  /** 视频信息 */
  metadata: MediaSourceProfile | null = null;
  static Events = Events;

  private _timer: null | number = null;
  private _playing = false;
  get playing() {
    return this._playing;
  }
  private _ended = false;
  private _duration = 0;
  private _currentTime = 0;
  get currentTime() {
    return this._currentTime;
  }
  private _target_current_time = 0;
  private _progress = 0;
  private _passPoint = false;
  private _size: { width: number; height: number } = { width: 0, height: 0 };
  private _abstractNode: {
    play: () => void;
    pause: () => void;
    changeCurrentTime: (v: number) => void;
    changeVolume: (v: number) => void;
  } | null = null;

  constructor() {
    super();
  }

  bindAbstractNode(node: PlayerCore["_abstractNode"]) {
    this._abstractNode = node;
  }
  /** 开始播放 */
  async play() {
    if (this._abstractNode === null) {
      return;
    }
    if (this.playing) {
      return;
    }
    this._abstractNode.play();
  }
  /** 暂停播放 */
  async pause() {
    if (this._abstractNode === null) {
      return;
    }
    this._abstractNode.pause();
  }
  /** 改变音量 */
  setVolume(v: number) {
    if (this._abstractNode === null) {
      return;
    }
    this._abstractNode.changeVolume(v);
  }
  /** 改变当前进度 */
  setCurrentTime(currentTime: number = 0) {
    if (this._abstractNode === null) {
      return;
    }
    this._currentTime = currentTime;
    this._abstractNode.changeCurrentTime(currentTime);
  }
  setSize(size: { width: number; height: number }) {
    if (
      this._size.width !== 0 &&
      this._size.width === size.width &&
      this._size.height !== 0 &&
      this._size.height === size.height
    ) {
      return;
    }
    this._size = size;
    this.emit(Events.SizeChange, size);
  }
  setResolution(values: { type: EpisodeResolutionTypes; text: string }) {
    this.emit(Events.ResolutionChange, values);
  }
  loadSource(video: MediaSourceProfile) {
    this.metadata = video;
    this._canPlay = false;
    this.emit(Events.UrlChange, video);
  }
  preloadSource(url: string) {
    this.emit(Events.Preload, { url });
  }
  emitTimeUpdate({ currentTime, duration }: { currentTime: number; duration: number }) {
    this._currentTime = currentTime;
    if (typeof duration === "number" && !Number.isNaN(duration)) {
      this._duration = duration;
    }
    const progress = Math.floor((currentTime / this._duration) * 100);
    this._progress = progress;
    this.emit(Events.Progress, {
      currentTime: this._currentTime,
      duration: this._duration,
      progress: this._progress,
    });
    // console.log("[DOMAIN]Player - time update", progress);
    if (currentTime + 10 >= this._duration) {
      if (this._passPoint) {
        return;
      }
      this.emit(Events.BeforeEnded);
      this._passPoint = true;
      return;
    }
    this._passPoint = false;
  }
  /** 视频播放结束 */
  end() {
    this._playing = false;
    this._ended = true;
    this.emit(Events.End, {
      current_time: this._currentTime,
      duration: this._duration,
    });
  }

  _canPlay = false;
  setCanPlay() {
    if (this._canPlay) {
      return;
    }
    this._canPlay = true;
    this.emit(Events.CanPlay);
  }

  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onLoaded(handler: Handler<TheTypesOfEvents[Events.Loaded]>) {
    return this.on(Events.Loaded, handler);
  }
  onProgress(handler: Handler<TheTypesOfEvents[Events.Progress]>) {
    return this.on(Events.Progress, handler);
  }
  onCanPlay(handler: Handler<TheTypesOfEvents[Events.CanPlay]>) {
    return this.on(Events.CanPlay, handler);
  }
  onUrlChange(handler: Handler<TheTypesOfEvents[Events.UrlChange]>) {
    return this.on(Events.UrlChange, handler);
  }
  onPreload(handler: Handler<TheTypesOfEvents[Events.Preload]>) {
    return this.on(Events.Preload, handler);
  }
  onBeforeEnded(handler: Handler<TheTypesOfEvents[Events.BeforeEnded]>) {
    return this.on(Events.BeforeEnded, handler);
  }
  onSizeChange(handler: Handler<TheTypesOfEvents[Events.SizeChange]>) {
    return this.on(Events.SizeChange, handler);
  }
  onVolumeChange(handler: Handler<TheTypesOfEvents[Events.VolumeChange]>) {
    return this.on(Events.VolumeChange, handler);
  }
  onPause(handler: Handler<TheTypesOfEvents[Events.Pause]>) {
    return this.on(Events.Pause, handler);
  }
  onResolutionChange(handler: Handler<TheTypesOfEvents[Events.ResolutionChange]>) {
    return this.on(Events.ResolutionChange, handler);
  }
  onPlay(handler: Handler<TheTypesOfEvents[Events.Play]>) {
    return this.on(Events.Play, handler);
  }
  onSourceLoaded(handler: Handler<TheTypesOfEvents[Events.SourceLoaded]>) {
    return this.on(Events.SourceLoaded, handler);
  }
  onCurrentTimeChange(handler: Handler<TheTypesOfEvents[Events.CurrentTimeChange]>) {
    return this.on(Events.CurrentTimeChange, handler);
  }
  onEnd(handler: Handler<TheTypesOfEvents[Events.End]>) {
    return this.on(Events.End, handler);
  }
}
