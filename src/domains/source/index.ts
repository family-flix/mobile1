/**
 * @file 视频文件播放
 * 提供获取播放地址、切换分辨率、字幕展示等功能
 */
import { BaseDomain, Handler } from "@/domains/base";
import { SubtitleCore } from "@/domains/subtitle";
import { SubtitleFileResp } from "@/domains/subtitle/types";
import { RequestCore } from "@/domains/request";
import { HttpClientCore } from "@/domains/http_client";
import { MediaOriginCountry } from "@/constants";
import { Result } from "@/domains/result/index";

import { MediaResolutionTypes, MediaResolutionTypeTexts } from "./constants";
import { MediaSourceFile, fetchSourcePlayingInfo, fetchSourcePlayingInfoProcess } from "./services";

enum Events {
  /** 切换播放的剧集 */
  SourceChange,
  /** 分辨率改变 */
  ResolutionChange,
  StateChange,
  /** 字幕改变 */
  SubtitleChange,
  /** 字幕加载完成 */
  SubtitleLoaded,
}
type TheTypesOfEvents = {
  [Events.SourceChange]: MediaSourceFile & { currentTime: number };
  [Events.ResolutionChange]: MediaSourceFile & { currentTime: number };

  [Events.SubtitleChange]: {
    url: string;
    visible: boolean;
    index: string;
    texts: string[];
  };
  [Events.SubtitleLoaded]: SubtitleCore;
  [Events.StateChange]: MediaSourceFileCoreState;
};

type MediaSourceFileCoreState = {
  resolution: MediaResolutionTypes;
};
type MediaSourceFileCoreProps = {
  //   id: string;
  resolution?: MediaResolutionTypes;
  client: HttpClientCore;
};

export class MediaSourceFileCore extends BaseDomain<TheTypesOfEvents> {
  profile: null | MediaSourceFile = null;
  curResolution: MediaResolutionTypes = MediaResolutionTypes.SD;
  subtitle: null | {
    url: string;
    visible: boolean;
    index: string;
    texts: string[];
  } = null;
  subtitles: (SubtitleFileResp & { cur?: boolean })[] = [];

  /** 正在请求中 */
  loading = false;

  $subtitle: SubtitleCore | null = null;
  $client: HttpClientCore;

  get state(): MediaSourceFileCoreState {
    return {
      resolution: this.curResolution,
    };
  }

  constructor(props: Partial<{ name: string }> & MediaSourceFileCoreProps) {
    super();

    const { client, resolution = MediaResolutionTypes.SD } = props;
    //     this.id = id;
    this.$client = client;
    this.curResolution = resolution;
  }

  /** 播放该电视剧下指定影片 */
  async load(file: { id: string }) {
    const fetch = new RequestCore(fetchSourcePlayingInfo, {
      process: fetchSourcePlayingInfoProcess,
      client: this.$client,
    });
    const res = await fetch.run({
      id: file.id,
      type: this.curResolution,
    });
    if (res.error) {
      this.tip({
        text: ["获取影片详情失败", res.error.message],
      });
      this.profile = {
        id: file.id,
        invalid: 1,
        url: "",
        type: this.curResolution,
        typeText: "",
        width: 0,
        height: 0,
        thumbnailPath: "",
        resolutions: [],
        subtitles: [],
      };
      this.emit(Events.StateChange, { ...this.state });
      return Result.Err(res.error);
    }
    const { url, thumbnailPath, typeText, type, width, height, resolutions, subtitles } = res.data;
    this.curResolution = type;
    this.profile = {
      id: file.id,
      url,
      type,
      typeText,
      invalid: 0,
      width,
      height,
      thumbnailPath,
      resolutions,
      subtitles,
    };
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(this.profile);
  }
  /** 切换分辨率 */
  changeResolution(targetType: MediaResolutionTypes) {
    if (this.profile === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    const { id, resolutions, subtitles, thumbnailPath } = this.profile;
    if (this.curResolution === targetType) {
      const msg = this.tip({
        text: [`当前已经是${MediaResolutionTypeTexts[targetType]}了`],
      });
      return Result.Err(msg);
    }
    this.curResolution = targetType;
    const matchedResolution = resolutions.find((e) => e.type === targetType);
    if (!matchedResolution) {
      const msg = this.tip({ text: [`没有 '${targetType}' 分辨率`] });
      return Result.Err(msg);
    }
    const { url, typeText, width, height } = matchedResolution;
    this.profile = {
      id,
      url,
      type: targetType,
      typeText,
      invalid: 0,
      width,
      height,
      resolutions,
      subtitles,
      thumbnailPath,
    };
    //     console.log("[DOMAIN]tv/index - changeResolution");
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(this.profile);
  }
  async loadSubtitle(options: { extraSubtitleFiles: SubtitleFileResp[]; currentTime: number }) {
    const { extraSubtitleFiles, currentTime } = options;
    // console.log("[DOMAIN]source/index - loadSubtitle", extraSubtitleFiles);
    if (!this.profile) {
      return Result.Err("请先调用 load 获取视频文件");
    }
    const subtitles = extraSubtitleFiles.concat(this.profile.subtitles).filter(Boolean);
    this.subtitles = subtitles;
    console.log("[DOMAIN]tv/index - loadSubtitle2 ", subtitles);
    const subtitleFile = (() => {
      const matched = subtitles.find((s) => {
        return s.language.join("&") === MediaOriginCountry.CN;
      });
      if (matched) {
        return matched;
      }
      return subtitles[0] ?? null;
    })();
    // console.log("[DOMAIN]tv/index - no matched subtitle?", subtitleFile);
    if (!subtitleFile) {
      return Result.Err("没有可加载的字幕文件");
    }
    // console.log("[DOMAIN]tv/index - before loadSubtitleFile", subtitleFile);
    return this.loadSubtitleFile(subtitleFile, currentTime);
  }
  async loadSubtitleFile(subtitleFile: SubtitleFileResp, currentTime: number) {
    if (subtitleFile.url === this.subtitle?.url) {
      return Result.Err("已经是当前字幕了");
    }
    if (this.$subtitle) {
      this.$subtitle.destroy();
    }
    this.$subtitle = null;
    const r = await SubtitleCore.New(subtitleFile, {
      currentTime,
      client: this.$client,
    });
    if (r.error) {
      return Result.Err("实例化字幕失败");
    }
    this.$subtitle = r.data;
    const { curLine } = r.data;
    const subtitle = {
      url: subtitleFile.url,
      visible: true,
      index: curLine?.line ?? "0",
      texts: curLine?.texts ?? [],
    };
    this.subtitle = subtitle;
    console.log("[DOMAIN]movie/index - before emit Events.SubtitleChange", this.subtitle);
    this.emit(Events.SubtitleLoaded, this.$subtitle);
    this.emit(Events.SubtitleChange, { ...subtitle });
    this.$subtitle.onStateChange((nextState) => {
      const { curLine } = nextState;
      const subtitle = {
        url: subtitleFile.url,
        visible: true,
        index: curLine?.line ?? "0",
        texts: curLine?.texts ?? [],
      };
      this.subtitle = subtitle;
      // console.log("[DOMAIN]tv/index - subtitleStore.onStateChange", this.subtitle, curLine);
      this.emit(Events.SubtitleChange, { ...subtitle });
    });
    return Result.Ok(null);
  }
  toggleSubtitleVisible() {
    if (!this.subtitle) {
      return;
    }
    if (this.subtitle.visible) {
      this.hideSubtitle();
      return;
    }
    this.showSubtitle();
  }
  hideSubtitle() {
    if (!this.subtitle) {
      return;
    }
    this.subtitle.visible = false;
    this.emit(Events.SubtitleChange, { ...this.subtitle });
  }
  showSubtitle() {
    if (!this.subtitle) {
      return;
    }
    this.subtitle.visible = true;
    this.emit(Events.SubtitleChange, { ...this.subtitle });
  }

  onSourceChange(handler: Handler<TheTypesOfEvents[Events.SourceChange]>) {
    return this.on(Events.SourceChange, handler);
  }
  onSubtitleChange(handler: Handler<TheTypesOfEvents[Events.SubtitleChange]>) {
    return this.on(Events.SubtitleChange, handler);
  }
  onSubtitleLoaded(handler: Handler<TheTypesOfEvents[Events.SubtitleLoaded]>) {
    return this.on(Events.SubtitleLoaded, handler);
  }
  onResolutionChange(handler: Handler<TheTypesOfEvents[Events.ResolutionChange]>) {
    return this.on(Events.ResolutionChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
