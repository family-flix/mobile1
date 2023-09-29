/**
 * @file 电视剧
 */
import { Handler } from "mitt";

import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { SubtitleCore } from "@/domains/subtitle";
import { SubtitleResp } from "@/domains/subtitle/types";
import { BaseDomain } from "@/domains/base";
import { Result } from "@/types";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";
import {
  TVAndEpisodesProfile,
  MediaSourceProfile,
  updatePlayHistory,
  fetch_episode_profile,
  fetch_tv_and_cur_episode,
  fetch_episodes_of_season,
  TVSeasonProfile,
  TVEpisodeProfile,
  fetch_source_playing_info,
} from "./services";
import { debounce } from "lodash/fp";

enum Events {
  /** 电视剧详情加载完成 */
  ProfileLoaded,
  /** 切换播放的剧集 */
  EpisodeChange,
  /** 剧集列表改变 */
  EpisodesChange,
  /** 切换播放的剧集 */
  SourceChange,
  /** 分辨率改变 */
  ResolutionChange,
  StateChange,
  BeforeNextEpisode,
  BeforePrevEpisode,
  BeforeChangeSource,
  /** 字幕改变 */
  SubtitleChange,
  /** 字幕加载完成 */
  SubtitleLoaded,
}
type TheTypesOfEvents = {
  [Events.ProfileLoaded]: TVProps["profile"];
  [Events.SourceChange]: MediaSourceProfile & { currentTime: number };
  [Events.EpisodeChange]: TVProps["profile"]["curEpisode"] & {
    currentTime: number;
  };
  [Events.EpisodesChange]: TVEpisodeProfile[];
  [Events.ResolutionChange]: MediaSourceProfile & { currentTime: number };
  [Events.BeforeNextEpisode]: void;
  [Events.BeforePrevEpisode]: void;
  [Events.StateChange]: TVProps["profile"];
  [Events.BeforeChangeSource]: void;
  [Events.SubtitleChange]: {
    url: string | null;
    index: string;
    enabled: boolean;
    visible: boolean;
    texts: string[];
    others: (SubtitleResp & { selected: boolean })[];
  };
  [Events.SubtitleLoaded]: SubtitleCore;
};
type TVState = {};
type TVProps = {
  resolution?: EpisodeResolutionTypes;
  profile: {
    id: TVAndEpisodesProfile["id"];
    name: TVAndEpisodesProfile["name"];
    overview: TVAndEpisodesProfile["overview"];
    /** 如果存在播放记录，返回当前播放的集数对应季，如果没有播放记录，返回第一季 */
    curSeason: TVSeasonProfile;
    /** 如果存在播放记录，返回当前播放的集数，如果没有播放记录，返回第一季、第一集 */
    curEpisode: TVEpisodeProfile & {
      currentTime: number;
      thumbnail: string | null;
    };
    /** 电视剧下所有季 */
    seasons: TVSeasonProfile[];
    /** 当前播放剧集同一季的所有剧集 */
    curEpisodes: TVEpisodeProfile[];
    episodeNoMore: boolean;
  };
};

export class TVCore extends BaseDomain<TheTypesOfEvents> {
  static async Get(body: { id: string }) {
    const { id } = body;
    if (id === undefined) {
      // const msg = this.tip({ text: ["缺少 tv id 参数"] });
      return Result.Err("缺少电视剧 id");
    }
    // this.id = id;
    const res = await fetch_tv_and_cur_episode({ tv_id: id });
    if (res.error) {
      // const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      return Result.Err(res.error);
    }
    // const tv = res.data;
    // this.profile = tv;
    // this.emit(Events.ProfileLoaded, { ...this.profile });
    const { name, overview, curSeason, curEpisode, curEpisodes, episodeNoMore, seasons } = res.data;
    if (curEpisode === null) {
      // const msg = this.tip({ text: ["该电视剧尚未收录影片"] });
      return Result.Err("该电视剧尚未收录影片");
    }
    const tv = new TVCore({
      profile: {
        id,
        name,
        overview,
        curSeason,
        curEpisode,
        seasons,
        curEpisodes,
        episodeNoMore,
      },
    });
    return Result.Ok(tv);
  }

  /** 电视剧 id */
  id?: string;
  /** 该电视剧名称、剧集等信息 */
  profile: TVProps["profile"] | null = null;
  curSeason: TVProps["profile"]["curSeason"] | null = null;
  curEpisode: TVProps["profile"]["curEpisode"] | null = null;
  curEpisodes: TVProps["profile"]["curEpisodes"] = [];
  /** 当前播放的视频源 */
  curSource: MediaSourceProfile | null = null;
  /** 当前影片播放进度 */
  currentTime = 0;
  curResolutionType: EpisodeResolutionTypes = "SD";
  episodeList = new ListCore(new RequestCore(fetch_episodes_of_season), {
    pageSize: 20,
  });
  /** 正在请求中（获取详情、视频源信息等） */
  private _pending = false;
  /** 正在播放中 */
  playing = false;
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
    /** 是否有字幕 */
    enabled: false,
    /** 手动展示/隐藏字幕 */
    visible: false,
    texts: [],
    others: [],
  };

  constructor(options: Partial<{ name: string } & TVProps> = {}) {
    super();

    const { resolution = "SD", profile } = options;
    this.curResolutionType = resolution;
    this.episodeList.onDataSourceChange((nextDataSource) => {
      // console.log("nextDataSource", nextDataSource.length);
      if (!this.profile) {
        return;
      }
      console.log("this.episodeList.onDataSourceChange", this.episodeList.response.noMore);
      this.curEpisodes = nextDataSource;
      if (this.curSeason) {
        this.curSeason.episodes = nextDataSource;
      }
      this.profile.curEpisodes = nextDataSource;
      this.profile.episodeNoMore = this.episodeList.response.noMore;
      this.emit(Events.StateChange, { ...this.profile });
    });
    // this.profile = profile;
    // this.curSeason = profile.curSeason;
    // this.curEpisode = profile.curEpisode;
  }

  async fetchProfile(id: string, extra: { season_id?: string } = {}) {
    const { season_id } = extra;
    if (id === undefined) {
      const msg = this.tip({ text: ["缺少 tv id 参数"] });
      return Result.Err(msg);
      // return Result.Err("缺少电视剧 id");
    }
    this.id = id;
    const res = await fetch_tv_and_cur_episode({ tv_id: id, season_id });
    if (res.error) {
      const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      // return Result.Err(res.error);
      return Result.Err(msg);
    }
    // const tv = res.data;
    // this.profile = tv;
    // this.emit(Events.ProfileLoaded, { ...this.profile });
    const { name, overview, curSeason, curEpisode, curEpisodes, episodeNoMore, seasons } = res.data;
    if (curEpisode === null) {
      const msg = this.tip({ text: ["该电视剧尚未收录影片"] });
      // return Result.Err("该电视剧尚未收录影片");
      return Result.Err(msg);
    }
    this.profile = {
      id,
      name,
      overview,
      seasons,
      curSeason,
      curEpisode,
      curEpisodes,
      episodeNoMore,
    };
    // this.curEpisode = curEpisode;
    this.curSeason = curSeason;
    this.episodeList.modifyDataSource(curEpisodes);
    this.episodeList.setParams((prev) => {
      return {
        ...prev,
        tv_id: id,
        season_id: season_id || curSeason.id,
      };
    });
    this.emit(Events.ProfileLoaded, { ...this.profile });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok({ ...this.profile });
  }

  /** 播放该电视剧下指定影片 */
  async playEpisode(episode: TVEpisodeProfile, extra: { currentTime?: number; thumbnail?: string | null } = {}) {
    const { currentTime = 0, thumbnail = null } = extra;
    console.log("[DOMAIN]tv/index - playEpisode", this.curSource, this._subtitleStore);
    if (!this.profile) {
      const msg = this.tip({ text: ["请先调用 fetchProfile 获取详情"] });
      return Result.Err(msg);
    }
    const { id: episodeId } = episode;
    if (this.curEpisode && episodeId === this.curEpisode.id) {
      this.tip({
        text: [this.profile.name, this.curEpisode.episode_text],
      });
      return Result.Ok(this.curEpisode);
    }
    const res = await fetch_episode_profile({
      id: episodeId,
      type: this.curResolutionType,
    });
    if (res.error) {
      this.tip({
        text: ["获取影片详情失败", res.error.message],
      });
      return Result.Err(res.error);
    }
    this.profile.curEpisode = { ...episode, currentTime, thumbnail };
    this.curEpisode = { ...episode, currentTime, thumbnail };
    this.curSource = (() => {
      const { file_id, resolutions, subtitles } = res.data;
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
      this.curResolutionType = type;
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
    if (!this.curEpisode.thumbnail && this.curSource.thumbnail) {
      this.curEpisode.thumbnail = this.curSource.thumbnail;
    }
    this.emit(Events.EpisodeChange, { ...this.curEpisode });
    this.emit(Events.SourceChange, { ...this.curSource, currentTime });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(this.curEpisode);
  }
  /** 切换剧集 */
  switchEpisode(episode: TVEpisodeProfile) {
    if (this.playing) {
      this.canAutoPlay = true;
    }
    this.playEpisode(episode, { currentTime: 0, thumbnail: null });
  }
  async loadSubtitle(options: { currentTime: number }) {
    // console.log("[DOMAIN]tv/index - loadSubtitle", this.curSource, this._subtitleStore);
    const { currentTime } = options;
    if (!this.curEpisode) {
      return;
    }
    if (!this.curSource) {
      return;
    }
    console.log("[DOMAIN]tv/index - loadSubtitle", this.curSource.subtitles, this.curEpisode.subtitles);
    const subtitles = this.curSource.subtitles.concat(this.curEpisode.subtitles).filter(Boolean);
    this._subtitles = subtitles;
    // console.log("[DOMAIN]tv/index - loadSubtitle2 ", subtitles);
    const subtitleFile = (() => {
      const matched = subtitles.find((s) => {
        return s.lang === "chi";
      });
      if (matched) {
        return matched;
      }
      const first = subtitles[0];
      // console.log("[DOMAIN]tv/index - first", first, subtitles);
      if (first) {
        return first;
      }
      return null;
    })();
    // console.log("[DOMAIN]tv/index - no matched subtitle?", subtitleFile);
    if (!subtitleFile) {
      return;
    }
    // console.log("[DOMAIN]tv/index - before loadSubtitleFile", subtitleFile);
    this.loadSubtitleFile(subtitleFile, currentTime);
  }
  async loadSubtitleFile(subtitleFile: SubtitleResp, currentTime: number) {
    // console.log("[DOMAIN]movie/index - before SubtitleCore.New", this.subtitle);
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
  async findEpisode(id: string): Promise<number> {
    const episodes = this.curEpisodes;
    const index = episodes.findIndex((e) => e.id === id);
    if (index === -1) {
      if (!this.episodeList.response.noMore) {
        await this.episodeList.loadMore();
        return this.findEpisode(id);
      }
    }
    return index;
  }
  /** 获取下一剧集 */
  async getNextEpisode() {
    if (this.profile === null || this.curEpisode === null) {
      return Result.Err("请先调用 fetchProfile 方法");
    }
    const { seasons } = this.profile;
    const { id, season_id } = this.curEpisode;
    const curSeason = seasons.find((season) => {
      return season.id === season_id;
    });
    if (!curSeason) {
      return Result.Err("没有找到当前剧集所在季");
    }
    // const { episodes } = curSeason;
    const episodes = this.curEpisodes;
    // console.log("[DOMAIN]tv/index - getNextEpisode", curSeason, this.curEpisode);
    const index = await this.findEpisode(id);
    if (index === -1) {
      return Result.Err("没有找到当前剧集在季中的顺序");
    }
    const is_last_episode = index === episodes.length - 1;
    if (!is_last_episode) {
      const next_episode = episodes[index + 1];
      return Result.Ok(next_episode);
    }
    if (seasons.length === 1) {
      return Result.Err("已经是最后一集了");
    }
    // const cur_season_index = seasons.findIndex((s) => s == season_of_cur_episode);
    const curSeasonIndex = seasons.indexOf(curSeason);
    if (curSeasonIndex === -1) {
      return Result.Err("没有找到当前季的顺序");
    }
    const next_season = seasons[curSeasonIndex + 1];
    if (!next_season) {
      return Result.Err("没有找到下一季");
    }
    const r = await this.fetchEpisodesOfSeason(next_season);
    if (r.error) {
      return Result.Err(r.error);
    }
    if (r.data.length === 0) {
      return Result.Err("已经是最后一集了");
    }
    const nextCurEpisode = r.data[0];
    return Result.Ok(nextCurEpisode);
  }
  /** 获取下一剧集 */
  async getPrevEpisode() {
    if (this.profile === null || this.curEpisode === null) {
      return Result.Err("请先调用 fetchProfile 方法");
    }
    const { seasons } = this.profile;
    const { id, season_id } = this.curEpisode;
    const curSeason = seasons.find((season) => {
      return season.id === season_id;
    });
    if (!curSeason) {
      return Result.Err("没有找到当前剧集所在季");
    }
    // const { episodes } = curSeason;
    const episodes = this.curEpisodes;
    const index = episodes.findIndex((e) => e.id === id);
    if (index === -1) {
      return Result.Err("没有找到当前剧集所在季的顺序");
    }
    const isFirstEpisode = index === episodes.length - 1;
    if (!isFirstEpisode) {
      const prevEpisode = episodes[index - 1];
      return Result.Ok(prevEpisode);
    }
    if (seasons.length === 1) {
      return Result.Err("已经是第一集了");
    }
    const curSeasonIndex = seasons.indexOf(curSeason);
    if (curSeasonIndex === -1) {
      return Result.Err("获取异常，没有找到上一季");
    }
    const prevSeason = seasons[curSeasonIndex + 1];
    if (!prevSeason) {
      return Result.Err("获取异常，没有找到上一季");
    }
    const r = await this.fetchEpisodesOfSeason(prevSeason);
    if (r.error) {
      return Result.Err(r.error);
    }
    if (r.data.length === 0) {
      return Result.Err("已经是第一集了");
    }
    // 这里有问题，应该获取上一季最后一集，但是剧集是分页的，没法获取最后一集，或者让后端返
    const prevEpisode = r.data[0];
    return Result.Ok(prevEpisode);
  }
  /** 播放下一集 */
  async playNextEpisode() {
    if (this._pending) {
      this.tip({ text: ["正在加载下一集"] });
      return;
    }
    this.canAutoPlay = true;
    this.emit(Events.BeforeNextEpisode);
    this._pending = true;
    const nextEpisodeRes = await this.getNextEpisode();
    this._pending = false;
    if (nextEpisodeRes.error) {
      this.tip({ text: [nextEpisodeRes.error.message] });
      return;
    }
    const nextEpisode = nextEpisodeRes.data;
    if (nextEpisode === null) {
      return Result.Err("没有找到可播放剧集");
    }
    // this.currentTime = 0;
    await this.playEpisode(nextEpisode, { currentTime: 0, thumbnail: null });
    return Result.Ok(null);
  }
  /** 播放上一集 */
  async playPrevEpisode() {
    if (this._pending) {
      this.tip({ text: ["正在加载上一集"] });
      return;
    }
    this.canAutoPlay = true;
    this.emit(Events.BeforePrevEpisode);
    this._pending = true;
    const prevEpisodeRes = await this.getPrevEpisode();
    if (prevEpisodeRes.error) {
      this.tip({ text: [prevEpisodeRes.error.message] });
      this._pending = false;
      return;
    }
    const prevEpisode = prevEpisodeRes.data;
    if (prevEpisode === null) {
      this._pending = false;
      return Result.Err("没有找到可播放剧集");
    }
    // this.currentTime = 0;
    await this.playEpisode(prevEpisode, { currentTime: 0, thumbnail: null });
    this._pending = false;
    return Result.Ok(null);
  }
  /** 加载指定季下的剧集列表并返回第一集 */
  async fetchEpisodesOfSeason(season: TVProps["profile"]["curSeason"]) {
    if (this.id === undefined) {
      return Result.Err("缺少 tv id 参数");
    }
    if (this.profile === null) {
      return Result.Err("视频还未加载");
    }
    if (this.curSeason && this.curSeason.id === season.id) {
      return Result.Err(`已经是 ${this.curSeason.name} 了`);
    }
    const episodes_res = await this.episodeList.search({
      season_id: season.id,
    });
    if (episodes_res.error) {
      const msg = this.tip({
        text: ["获取剧集列表失败，请刷新后重试"],
      });
      return Result.Err(msg);
    }
    const { dataSource } = episodes_res.data;
    if (dataSource.length === 0) {
      const msg = this.tip({
        text: ["该季没有剧集"],
      });
      return Result.Err(msg);
    }
    this.curSeason = {
      ...season,
      episodes: dataSource,
    };
    this.profile.curSeason = season;
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(dataSource);
  }
  /** 预加载指定影片 */
  async preloadNextEpisode() {
    const r = await this.getNextEpisode();
    if (r.error) {
      return Result.Err(r.error);
    }
    return Result.Ok(r.data);
  }
  setCurResolution(type: EpisodeResolutionTypes) {
    this.curResolutionType = type;
  }
  async changeSource(source: { file_id: string }) {
    const { file_id } = source;
    // console.log(this.profile);
    // console.log(this.curEpisode);
    if (this.profile === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    if (this.curSource && file_id === this.curSource.file_id) {
      return;
    }
    const r = await fetch_source_playing_info({
      episode_id: this.profile.curEpisode.id,
      file_id,
    });
    if (r.error) {
      this.tip({
        text: ["获取源失败", r.error.message],
      });
      return;
    }
    this.canAutoPlay = true;
    this.curSource = (() => {
      const { file_id } = r.data;
      const { resolutions, subtitles } = r.data;
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
    this.loadSubtitle({ currentTime: this.currentTime });
    this.emit(Events.SourceChange, {
      ...this.curSource,
      currentTime: this.currentTime,
    });
    return Result.Ok(null);
  }
  /** 切换分辨率 */
  changeResolution(target_type: EpisodeResolutionTypes) {
    // console.log("switchResolution 1");
    if (this.profile === null || this.curSource === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    // console.log("switchResolution 2");
    const { type, resolutions, subtitles } = this.curSource;
    if (type === target_type) {
      const msg = this.tip({
        text: [`当前已经是${EpisodeResolutionTypeTexts[target_type]}了`],
      });
      return Result.Err(msg);
    }
    // console.log("switchResolution 3");
    this.curResolutionType = target_type;
    const matched_resolution = resolutions.find((e) => e.type === target_type);
    if (!matched_resolution) {
      const msg = this.tip({ text: [`没有 '${target_type}' 分辨率`] });
      return Result.Err(msg);
    }
    this.canAutoPlay = true;
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
    const { currentTime = this.currentTime, duration = 0 } = values;
    // console.log("[DOMAIN]TVPlay - update_play_progress", currentTime);
    if (!this.id) {
      return;
    }
    if (this.curSeason === null) {
      return;
    }
    if (this.curEpisode === null) {
      return;
    }
    if (this.curSource === null) {
      return;
    }
    const { id: episode_id } = this.curEpisode;
    const { file_id } = this.curSource;
    updatePlayHistory({
      tv_id: this.id,
      season_id: this.curSeason.id,
      episode_id,
      current_time: parseFloat(currentTime.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      file_id,
    });
  }
  /** 更新观看进度 */
  updatePlayProgress = throttle_1(10 * 1000, (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    this.updatePlayProgressForce(values);
  });
  /** 当前进度改变 */
  handleCurTimeChange(values: { currentTime: number; duration: number }) {
    this.playing = true;
    this._pause();
    const { currentTime = 0 } = values;
    if (this._subtitleStore && this.subtitle.visible) {
      this._subtitleStore.handleTimeChange(currentTime);
    }
    this.updatePlayProgress(values);
  }
  _pause = debounce(800, () => {
    this.playing = false;
  });
  getTitle(): [string, string, string] {
    if (this.profile === null || this.curEpisode === null) {
      // @ts-ignore
      return ["加载中..."];
    }
    const { episode_text: episode, season_text: season } = this.curEpisode;
    const { name } = this.profile;
    return [episode, season, name];
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
  onEpisodeChange(handler: Handler<TheTypesOfEvents[Events.EpisodeChange]>) {
    return this.on(Events.EpisodeChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onBeforeNextEpisode(handler: Handler<TheTypesOfEvents[Events.BeforeNextEpisode]>) {
    return this.on(Events.BeforeNextEpisode, handler);
  }
  onBeforePrevEpisode(handler: Handler<TheTypesOfEvents[Events.BeforePrevEpisode]>) {
    return this.on(Events.BeforePrevEpisode, handler);
  }
  onBeforeChangeSource(handler: Handler<TheTypesOfEvents[Events.BeforeChangeSource]>) {
    return this.on(Events.BeforeChangeSource, handler);
  }
  onSubtitleChange(handler: Handler<TheTypesOfEvents[Events.SubtitleChange]>) {
    return this.on(Events.SubtitleChange, handler);
  }
  onSubtitleLoaded(handler: Handler<TheTypesOfEvents[Events.SubtitleLoaded]>) {
    return this.on(Events.SubtitleLoaded, handler);
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
