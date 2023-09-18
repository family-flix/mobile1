/**
 * @file 电影
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { SubtitleCore } from "@/domains/subtitle";
import { SubtitleResp } from "@/domains/subtitle/types";
import { Result } from "@/types";

import { MediaResolutionTypes, MediaResolutionTypeTexts } from "./constants";
import {
  MovieProfile,
  fetch_movie_and_cur_source,
  update_play_history,
  MediaSourceProfile,
  fetch_media_profile,
} from "./services";

enum Events {
  /** 电影详情加载完成 */
  ProfileLoaded,
  SourceChange,
  /** 分辨率改变 */
  ResolutionChange,
  StateChange,
  SubtitleChange,
  /** 字幕加载完成 */
  SubtitleLoaded,
}
type TheTypesOfEvents = {
  [Events.ProfileLoaded]: MovieProps["profile"];
  [Events.SourceChange]: MediaSourceProfile & { currentTime: number };
  [Events.ResolutionChange]: MediaSourceProfile & { currentTime: number };
  [Events.SubtitleChange]: {
    url: string | null;
    index: string;
    enabled: boolean;
    visible: boolean;
    texts: string[];
    others: (SubtitleResp & { selected: boolean })[];
  };
  [Events.StateChange]: MovieProps["profile"];
  [Events.SubtitleLoaded]: SubtitleCore;
};
type MovieState = {};
type MovieProps = {
  profile: MovieProfile;
};

export class MovieCore extends BaseDomain<TheTypesOfEvents> {
  static async Get(body: { id: string }) {
    const { id } = body;
    if (id === undefined) {
      return Result.Err("缺少电影 id");
    }
    // this.id = id;
    const res = await fetch_movie_and_cur_source({ movie_id: id });
    if (res.error) {
      // const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      return Result.Err(res.error);
    }
    // const tv = res.data;
    // this.profile = tv;
    // this.emit(Events.ProfileLoaded, { ...this.profile });
    const { name, overview, currentTime, thumbnail, sources, subtitles, curSource } = res.data;
    const tv = new MovieCore({
      profile: {
        id,
        name,
        overview,
        currentTime,
        thumbnail,
        sources,
        curSource,
        subtitles,
      },
    });
    return Result.Ok(tv);
  }

  /** 电视剧 id */
  id?: string;
  /** 该电视剧名称、剧集等信息 */
  profile: MovieProps["profile"] | null = null;
  /** 当前播放的视频源 */
  curSource: MediaSourceProfile | null = null;
  /** 当前影片播放进度 */
  currentTime = 0;
  curResolutionType: MediaResolutionTypes = "LD";
  /** 正在请求中（获取详情、视频源信息等） */
  private _pending = false;
  played = false;
  canAutoPlay = false;
  _subtitleStore: SubtitleCore | null = null;
  /** 字幕文件列表 */
  _subtitles: SubtitleResp[] = [];
  /** 字幕 */
  subtitle: {
    url: string | null;
    index: string;
    enabled: boolean;
    visible: boolean;
    texts: string[];
    others: (SubtitleResp & { selected: boolean })[];
  } = {
    url: null,
    index: "0",
    enabled: false,
    visible: false,
    texts: [],
    others: [],
  };

  constructor(options: Partial<{ name: string } & MovieProps> = {}) {
    super();

    const { profile } = options;
    // this.profile = profile;
  }

  async fetchProfile(id: string) {
    if (id === undefined) {
      const msg = this.tip({ text: ["缺少电影 id 参数"] });
      return Result.Err(msg);
    }
    this.id = id;
    const res = await fetch_movie_and_cur_source({ movie_id: id });
    if (res.error) {
      const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      return Result.Err(msg);
    }
    const { name, overview, currentTime, thumbnail, sources, subtitles, curSource } = res.data;
    this.profile = {
      id,
      name,
      overview,
      currentTime,
      thumbnail,
      sources,
      curSource,
      subtitles,
    };
    this.emit(Events.ProfileLoaded, { ...this.profile });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok({ ...this.profile });
  }

  /** 开始播放 */
  async play() {
    console.log("[DOMAIN]movie/index - play");
    if (!this.profile) {
      const msg = this.tip({ text: ["请先调用 fetchProfile 获取详情"] });
      return Result.Err(msg);
    }
    const { currentTime = 0, curSource } = this.profile;
    if (!curSource) {
      const msg = this.tip({ text: ["没有可播放的视频源"] });
      return Result.Err(msg);
    }
    const res = await fetch_media_profile({
      id: curSource.file_id,
    });
    if (res.error) {
      this.tip({
        text: ["获取影片详情失败", res.error.message],
      });
      return Result.Err(res.error);
    }
    this.curSource = (() => {
      const { file_id, subtitles } = res.data;
      const { resolutions } = res.data;
      const matched_resolution = resolutions.find((e) => e.type === this.curResolutionType);
      if (!matched_resolution) {
        const { url, type, typeText, width, height, thumbnail } = resolutions[0];
        return {
          url,
          file_id,
          type,
          typeText,
          width,
          height,
          thumbnail,
          resolutions,
          subtitles,
        };
      }
      const { url, type, typeText, width, height, thumbnail } = matched_resolution;
      return {
        url,
        file_id,
        type,
        typeText,
        width,
        height,
        thumbnail,
        resolutions,
        subtitles,
      };
    })();
    this.loadSubtitle({ currentTime });
    this.currentTime = currentTime;
    this.played = true;
    this.emit(Events.SourceChange, { ...this.curSource, currentTime });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(null);
  }
  /** 切换视频源 */
  async changeSource(source: { file_id: string }) {
    if (!this.profile) {
      const msg = this.tip({ text: ["请先调用 fetchProfile 获取详情"] });
      return Result.Err(msg);
    }
    console.log("[PAGE](play/index) - change source");
    const res = await fetch_media_profile({
      id: source.file_id,
    });
    if (res.error) {
      this.tip({
        text: ["获取影片详情失败", res.error.message],
      });
      return Result.Err(res.error);
    }
    this.canAutoPlay = true;
    this.curSource = (() => {
      const { file_id, subtitles } = res.data;
      const { resolutions } = res.data;
      const matched_resolution = resolutions.find((e) => e.type === this.curResolutionType);
      if (!matched_resolution) {
        const { url, type, typeText, width, height, thumbnail } = resolutions[0];
        return {
          url,
          file_id,
          type,
          typeText,
          width,
          height,
          thumbnail,
          resolutions,
          subtitles,
        };
      }
      const { url, type, typeText, width, height, thumbnail } = matched_resolution;
      return {
        url,
        file_id,
        type,
        typeText,
        width,
        height,
        thumbnail,
        resolutions,
        subtitles,
      };
    })();
    // console.log("[DOMAIN]Movie - changeSource", this.currentTime);
    this.emit(Events.SourceChange, {
      ...this.curSource,
      currentTime: this.played ? this.currentTime : this.profile.currentTime,
    });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(null);
  }
  async loadSubtitle(options: { currentTime: number }) {
    // console.log("[DOMAIN]tv/index - loadSubtitle", this.curSource, this._subtitleStore);
    const { currentTime } = options;
    if (!this.profile) {
      return;
    }
    if (!this.curSource) {
      return;
    }
    const subtitles = this.curSource.subtitles.concat(this.profile.subtitles);
    this._subtitles = subtitles;
    const subtitleFile = (() => {
      const matched = subtitles.find((s) => {
        return s.lang === "chi";
      });
      if (matched) {
        return matched;
      }
      const first = subtitles[0];
      if (!first) {
        return first;
      }
      return null;
    })();
    if (!subtitleFile) {
      return;
    }
    this.loadSubtitleFile(subtitleFile, currentTime);
  }
  async loadSubtitleFile(subtitleFile: SubtitleResp, currentTime: number) {
    // console.log("[DOMAIN]movie/index - before SubtitleCore.New", this._subtitles);
    if (subtitleFile.url === this.subtitle.url) {
      return;
    }
    if (this._subtitleStore) {
      this._subtitleStore.destroy();
    }
    this._subtitleStore = null;
    const r = await SubtitleCore.New(subtitleFile, {
      currentTime,
    });
    if (r.error) {
      return;
    }
    const { curLine } = r.data;
    this.subtitle.others = this._subtitles.map((sub) => {
      const { id, name, url, lang, type } = sub;
      return {
        id,
        name: lang || name || url,
        url,
        lang,
        type,
        selected: url === subtitleFile.url,
      };
    });
    this.subtitle.url = subtitleFile.url;
    this.subtitle.enabled = true;
    this.subtitle.visible = true;
    this.subtitle.index = curLine?.line ?? "0";
    this.subtitle.texts = curLine?.texts ?? [];
    this._subtitleStore = r.data;
    this.emit(Events.SubtitleChange, { ...this.subtitle });
    this.emit(Events.SubtitleLoaded, this._subtitleStore);
    // console.log("[DOMAIN]movie/index - after SubtitleCore.New", r.data, curLine);
    this._subtitleStore.onStateChange((nextState) => {
      const { curLine } = nextState;
      this.subtitle.index = curLine?.line ?? "0";
      this.subtitle.texts = curLine?.texts ?? [];
      // console.log("[DOMAIN]tv/index - subtitleStore.onStateChange", this.subtitle, curLine);
      this.emit(Events.SubtitleChange, { ...this.subtitle });
    });
  }
  setCurResolution(type: MediaResolutionTypes) {
    this.curResolutionType = type;
  }
  /** 切换分辨率 */
  changeResolution(target_type: MediaResolutionTypes) {
    // console.log("switchResolution 1");
    if (this.profile === null || this.curSource === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    // console.log("switchResolution 2");
    const { type, resolutions, subtitles } = this.curSource;
    if (type === target_type) {
      const msg = this.tip({
        text: [`当前已经是${MediaResolutionTypeTexts[target_type]}了`],
      });
      return Result.Err(msg);
    }
    this.canAutoPlay = true;
    // console.log("switchResolution 3");
    this.curResolutionType = target_type;
    const matched_resolution = resolutions.find((e) => e.type === target_type);
    if (!matched_resolution) {
      const msg = this.tip({ text: [`没有 '${target_type}' 分辨率`] });
      return Result.Err(msg);
    }
    // console.log("switchResolution 4");
    const { url, type: nextType, typeText, width, height, thumbnail } = matched_resolution;
    this.curSource = {
      url,
      file_id: this.curSource.file_id,
      type: nextType,
      typeText,
      width,
      height,
      thumbnail,
      resolutions,
      subtitles,
    };
    this.emit(Events.SourceChange, {
      ...this.curSource,
      currentTime: this.currentTime,
    });
    this.emit(Events.ResolutionChange, {
      ...this.curSource,
      currentTime: this.currentTime,
    });
    return Result.Ok(null);
  }
  setCurrentTime(currentTime: number) {
    this.currentTime = currentTime;
  }
  updatePlayProgressForce(values: Partial<{ currentTime: number; duration: number }> = {}) {
    const { currentTime = this.currentTime, duration } = values;
    // console.log("[DOMAIN]TVPlay - update_play_progress", currentTime);
    if (!this.id) {
      return;
    }
    if (this.curSource === null) {
      return;
    }
    const { file_id } = this.curSource;
    update_play_history({
      movie_id: this.id,
      current_time: currentTime,
      duration,
      file_id,
    });
  }
  updatePlayProgress = throttle_1(10 * 1000, (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    this.updatePlayProgressForce(values);
  });
  /** 更新观看进度 */
  handleCurTimeChange = (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    const { currentTime = 0 } = values;
    this.currentTime = currentTime;
    if (this._subtitleStore && this.subtitle.visible) {
      this._subtitleStore.handleTimeChange(currentTime);
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
  toggleSubtitleVisible() {
    if (this.subtitle.visible) {
      this.hideSubtitle();
      return;
    }
    this.showSubtitle();
  }
  hideSubtitle() {
    this.subtitle.visible = false;
    this.emit(Events.SubtitleChange, { ...this.subtitle });
  }
  showSubtitle() {
    this.subtitle.visible = true;
    this.emit(Events.SubtitleChange, { ...this.subtitle });
  }

  onSourceChange(handler: Handler<TheTypesOfEvents[Events.SourceChange]>) {
    return this.on(Events.SourceChange, handler);
  }
  onResolutionChange(handler: Handler<TheTypesOfEvents[Events.ResolutionChange]>) {
    return this.on(Events.ResolutionChange, handler);
  }
  onProfileLoaded(handler: Handler<TheTypesOfEvents[Events.ProfileLoaded]>) {
    return this.on(Events.ProfileLoaded, handler);
  }
  onSubtitleChange(handler: Handler<TheTypesOfEvents[Events.SubtitleChange]>) {
    return this.on(Events.SubtitleChange, handler);
  }
  onSubtitleLoaded(handler: Handler<TheTypesOfEvents[Events.SubtitleLoaded]>) {
    return this.on(Events.SubtitleLoaded, handler);
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
