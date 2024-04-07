/**
 * @file 电影
 */
import { Handler, BaseDomain } from "@/domains/base";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { MediaSourceFileCore } from "@/domains/source";
import { HttpClientCore } from "@/domains/http_client";
import { RequestCoreV2 } from "@/domains/request/v2";
import { MediaTypes } from "@/constants";
import { Result } from "@/types";

import {
  CurMediaSource,
  fetchMediaPlayingEpisode,
  fetchMediaPlayingEpisodeProcess,
  MediaSource,
  MediaSourceFile,
  updatePlayHistory,
} from "./services";

enum Events {
  /** 电影详情加载完成 */
  ProfileLoaded,
  SourceFileChange,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ProfileLoaded]: {
    profile: NonNullable<MovieCoreState["profile"]>;
    curSource: CurMediaSource;
  };
  [Events.SourceFileChange]: MediaSourceFile & { currentTime: number };
  [Events.StateChange]: MovieCoreState;
};
type MediaProfile = {
  id: string;
  name: string;
  overview: string;
  posterPath: string;
};
type MovieCoreState = {
  profile: null | MediaProfile;
  curSource: null | CurMediaSource;
  fixTime: number;
};
type MovieCoreProps = {
  client: HttpClientCore;
  resolution?: MediaResolutionTypes;
};

export class MovieMediaCore extends BaseDomain<TheTypesOfEvents> {
  /** 该电电影名称、剧集等信息 */
  profile: MediaProfile | null = null;
  curSource: CurMediaSource | null = null;
  /** 当前影片播放进度 */
  currentTime = 0;
  /** 手动调整播放进度差值，用于校准字幕 */
  currentFixTime = 0;
  curResolutionType: MediaResolutionTypes = MediaResolutionTypes.SD;
  /** 正在请求中（获取详情、视频源信息等） */
  _pending = false;
  played = false;
  canAutoPlay = false;

  $source: MediaSourceFileCore;
  $client: HttpClientCore;

  get state(): MovieCoreState {
    return {
      profile: this.profile,
      curSource: this.curSource,
      fixTime: this.currentFixTime,
    };
  }

  constructor(props: Partial<{ name: string }> & MovieCoreProps) {
    super();

    const { client, resolution = MediaResolutionTypes.SD } = props;
    this.$client = client;
    this.$source = new MediaSourceFileCore({
      resolution,
      client,
    });
  }

  async fetchProfile(media_id: string) {
    if (media_id === undefined) {
      const msg = this.tip({ text: ["缺少电影 id 参数"] });
      return Result.Err(msg);
    }
    const fetch = new RequestCoreV2({
      fetch: fetchMediaPlayingEpisode,
      process: fetchMediaPlayingEpisodeProcess,
      client: this.$client,
    });
    const res = await fetch.run({ media_id, type: MediaTypes.Movie });
    if (res.error) {
      const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      return Result.Err(msg);
    }
    const { id, name, overview, sourceCount, posterPath, curSource } = res.data;
    this.profile = {
      id,
      name,
      overview,
      posterPath,
    };
    if (curSource === null) {
      const msg = this.tip({ text: ["当前没有可播放的视频源"] });
      return Result.Err(msg);
    }
    // 这里不能设置，否则下面就提示「已经是该剧集了」
    // this.curSource = curSource;
    this.emit(Events.ProfileLoaded, { profile: this.profile, curSource });
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok({ ...this.profile });
  }

  /** 播放该电视剧下指定影片 */
  async playSource(source: MediaSource, extra: { currentTime: number }) {
    const { currentTime = 0 } = extra;
    // console.log("[DOMAIN]tv/index - playEpisode", this.curSource, this._subtitleStore);
    if (!this.profile) {
      const msg = this.tip({ text: ["请先调用 fetchProfile 获取详情"] });
      return Result.Err(msg);
    }
    const { id, files } = source;
    if (this.curSource && id === this.curSource.id) {
      this.tip({
        text: ["已经是该剧集了"],
      });
      return Result.Ok(this.curSource);
    }
    if (files.length === 0) {
      const tip = this.tip({
        text: ["该剧集缺少视频源"],
      });
      return Result.Err(tip);
    }
    const file = files[0];
    // console.log("[DOMAIN]media/season - playSource before this.$source.load", source);
    this.curSource = { ...source, currentTime, thumbnailPath: source.stillPath, curFileId: file.id };
    const res = await this.$source.load(file);
    if (res.error) {
      const msg = this.tip({
        text: [res.error.message],
      });
      return Result.Err(msg);
    }
    // this.profile.curEpisode = { ...episode, currentTime, thumbnail };
    this.currentTime = currentTime;
    this.curSource = { ...source, currentTime, thumbnailPath: source.stillPath, curFileId: res.data.id };
    (async () => {
      const r = await this.$source.loadSubtitle({ extraSubtitleFiles: source.subtitles, currentTime });
      if (r.error) {
        console.log("[DOMAIN]media/season - loadSubtitle failed ", r.error.message);
        return;
      }
      // this.emit(Events.EpisodeChange, { ...this.curEpisode, currentTime });
    })();
    this.emit(Events.SourceFileChange, { ...res.data, currentTime });
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(res.data);
  }
  async changeSourceFile(sourceFile: { id: string }) {
    if (this.profile === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    if (this.curSource === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    const res = await this.$source.load({ id: sourceFile.id });
    this.curSource.curFileId = sourceFile.id;
    if (res.error) {
      this.tip({
        text: [res.error.message],
      });
      return Result.Err(res.error);
    }
    this.emit(Events.SourceFileChange, {
      ...res.data,
      currentTime: this.currentTime,
    });
    return Result.Ok(null);
  }
  /** 切换分辨率 */
  changeResolution(targetType: MediaResolutionTypes) {
    // console.log("switchResolution 1");
    if (this.profile === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    const r = this.$source.changeResolution(targetType);
    if (r.error) {
      const msg = this.tip({ text: [r.error.message] });
      return Result.Err(msg);
    }
    const target = r.data;
    // console.log("[DOMAIN]tv/index - changeResolution", this.currentTime);
    this.emit(Events.SourceFileChange, {
      ...target,
      currentTime: this.currentTime,
    });
    return Result.Ok(target);
  }
  setCurResolution(type: MediaResolutionTypes) {
    this.curResolutionType = type;
  }
  setCurrentTime(currentTime: number) {
    this.currentTime = currentTime;
  }
  updatePlayProgressForce(values: Partial<{ currentTime: number; duration: number }> = {}) {
    const { currentTime = this.currentTime, duration = 0 } = values;
    // console.log("[DOMAIN]TVPlay - update_play_progress", currentTime);
    if (!this.profile) {
      return;
    }
    if (this.curSource === null) {
      return;
    }
    if (this.$source.profile === null) {
      return;
    }
    const request = new RequestCoreV2({
      fetch: updatePlayHistory,
      client: this.$client,
    });
    request.run({
      media_id: this.profile.id,
      media_source_id: this.curSource.id,
      current_time: parseFloat(currentTime.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      source_id: this.$source.profile.id,
    });
  }
  minFixTime(step: number = 1) {
    this.currentFixTime -= step;
    if (this.$source.subtitle?.visible) {
      this.$source.$subtitle?.handleTimeChange(this.currentTime + this.currentFixTime);
    }
    this.emit(Events.StateChange, { ...this.state });
  }
  addFixTime(step: number = 1) {
    this.currentFixTime += step;
    if (this.$source.subtitle?.visible) {
      this.$source.$subtitle?.handleTimeChange(this.currentTime + this.currentFixTime);
    }
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 更新观看进度 */
  updatePlayProgress = throttle_1(10 * 1000, (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    this.updatePlayProgressForce(values);
  });
  /** 更新观看进度 */
  handleCurTimeChange = (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    const { currentTime = 0 } = values;
    this.currentTime = currentTime;
    if (this.$source.subtitle?.visible) {
      this.$source.$subtitle?.handleTimeChange(currentTime + this.currentFixTime);
    }
    this.updatePlayProgress(values);
  };
  getTitle(): [string] {
    if (this.profile === null) {
      return ["加载中..."];
    }
    const { name } = this.profile;
    return [name];
  }

  onSourceFileChange(handler: Handler<TheTypesOfEvents[Events.SourceFileChange]>) {
    return this.on(Events.SourceFileChange, handler);
  }
  onProfileLoaded(handler: Handler<TheTypesOfEvents[Events.ProfileLoaded]>) {
    return this.on(Events.ProfileLoaded, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

function throttle_1(delay: number, fn: Function) {
  let canInvoke = true;

  setInterval(() => {
    canInvoke = true;
  }, delay);

  return (...args: unknown[]) => {
    if (canInvoke === false) {
      return;
    }
    fn(...args);
    canInvoke = false;
  };
}
