import dayjs from "dayjs";

import { request, TmpRequestResp, UnpackedRequestPayload } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { SubtitleFileResp } from "@/domains/subtitle/types";
import { ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
import { MediaOriginCountry, SeasonMediaOriginCountryTexts, SeasonGenresTexts } from "@/constants";
import { episode_to_chinese_num, minute_to_hour, relative_time_from_now, season_to_chinese_num } from "@/utils";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";

/**
 * 获取电视剧列表
 */
export function fetchTVList(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      backdrop_path: string;
      first_air_date: string;
    }>
  >("/api/tv/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
// export type TVItem = RequestedResource<typeof fetchTVList>["list"][0];
export type TVItem = UnpackedResult<TmpRequestResp<typeof fetchTVList>>["list"][0];

/**
 * 获取季列表
 */
export function fetchSeasonList(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: string;
      tv_id: string;
      name: string;
      original_name: string;
      episode_count: string;
      cur_episode_count: string;
      season_text: string;
      overview: string;
      poster_path: string;
      backdrop_path: string;
      air_date: string;
      genres: string;
      origin_country: string;
      vote_average: number;
      actors: {
        id: string;
        name: string;
      }[];
    }>
  >("/api/season/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export function fetchSeasonListProcess(r: TmpRequestResp<typeof fetchSeasonList>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((season) => {
      const {
        id,
        tv_id,
        season_text,
        name,
        original_name,
        overview,
        poster_path,
        vote_average,
        air_date,
        genres,
        origin_country,
        episode_count,
        cur_episode_count,
        actors = [],
      } = season;
      return {
        id,
        tv_id,
        name: name || original_name,
        season_text: season_to_chinese_num(season_text),
        air_date: dayjs(air_date).year(),
        episode_count,
        cur_episode_count,
        episode_count_text: (() => {
          if (!episode_count) {
            return null;
          }
          if (cur_episode_count === episode_count) {
            return `全${episode_count}集`;
          }
          return `更新至${cur_episode_count}集`;
        })(),
        overview,
        poster_path,
        vote: (() => {
          if (vote_average === 0) {
            return "N/A";
          }
          return vote_average.toFixed(1);
        })(),
        genres: origin_country
          .split("|")
          .map((country) => {
            return SeasonMediaOriginCountryTexts[country as MediaOriginCountry] ?? "unknown";
          })
          .concat(
            genres
              .split("|")
              .map((g) => {
                return SeasonGenresTexts[g];
              })
              .filter(Boolean)
          ),
        actors: actors.map((actor) => actor.name).join(" / "),
      };
    }),
  });
}
export type SeasonItem = RequestedResource<typeof fetchSeasonListProcess>["list"][0];

type MediaSourceProfileRes = {
  id: string;
  file_id: string;
  file_name: string;
  parent_paths: string;
  drive: {
    id: string;
    name: string;
    avatar: string;
  };
};
/**
 * 获取电视剧及当前播放的剧集详情
 * @param params
 */
export function fetchTVAndCurEpisode(params: { tv_id: string; season_id?: string }) {
  // console.log("[]fetch_tv_profile params", params);
  const { tv_id, season_id } = params;
  return request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: string;
    popularity: number;
    /** 电视剧所有季 */
    seasons: {
      id: string;
      name: string;
      overview: string;
      air_date: string;
      episode_no_more: boolean;
      episodes: {
        id: string;
        name: string;
        overview: string;
        season_number: string;
        episode_number: string;
        runtime: number;
        season_id: string;
        sources: MediaSourceProfileRes[];
        subtitles: SubtitleFileResp[];
      }[];
    }[];
    /** 会根据用户播放历史返回正在播放的剧集，或第一集 */
    cur_episode: {
      id: string;
      name: string;
      overview: string;
      season_number: string;
      episode_number: string;
      season_id: string;
      current_time: number;
      thumbnail: string | null;
      sources: MediaSourceProfileRes[];
      subtitles: SubtitleFileResp[];
    };
    cur_season: {
      id: string;
      name: string;
      overview: string;
      air_date: string;
    };
  }>(`/api/tv/${tv_id}/playing`, {
    season_id,
  });
}
export function fetchTVAndCurEpisodeProcess(r: TmpRequestResp<typeof fetchTVAndCurEpisode>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, seasons, cur_season, cur_episode } = r.data;
  const matchedSeason = seasons.find((season) => {
    return season.id === cur_season.id;
  });
  const s = (() => {
    return {
      ...(matchedSeason || cur_season),
    };
  })();
  return Result.Ok({
    id,
    name,
    overview,
    curSeason: {
      episodes: [],
      ...s,
    },
    episodeNoMore: (() => {
      if (matchedSeason) {
        return matchedSeason.episode_no_more;
      }
      return true;
    })(),
    curEpisodes: (() => {
      // 大概率会走这里
      if (matchedSeason) {
        return matchedSeason.episodes.map((episode) => {
          const { id, name, overview, season_number, episode_number, season_id, runtime, sources, subtitles } = episode;
          const d = {
            id,
            name,
            overview,
            season_id,
            season_text: season_to_chinese_num(season_number),
            episode_text: (() => {
              if (name.match(/第[^集]{1,}集/)) {
                return name;
              }
              return `${episode_to_chinese_num(episode_number)}、${name}`;
            })(),
            runtime: (() => {
              if (!runtime) {
                return null;
              }
              const [hour, minute] = minute_to_hour(runtime);
              if (hour) {
                return `${hour}h${minute}m`;
              }
              return `${minute}m`;
            })(),
            sources,
            subtitles,
          };
          return d;
        });
      }
      return [];
    })(),
    curEpisode: (() => {
      if (cur_episode === null) {
        return null;
      }
      const {
        id,
        name,
        overview,
        season_number,
        episode_number,
        current_time,
        sources,
        season_id,
        thumbnail,
        subtitles,
      } = cur_episode;
      const d = {
        id,
        name,
        overview,
        currentTime: current_time,
        thumbnail,
        season_id,
        runtime: "" as string | null,
        season_text: season_to_chinese_num(season_number),
        episode_text: episode_to_chinese_num(episode_number),
        sources,
        subtitles,
      };
      return d;
    })(),
    seasons: seasons.map((season) => {
      const { id, name, overview, episodes } = season;
      return {
        id,
        name,
        overview,
        episodes: episodes.map((episode) => {
          const { id, name, overview, season_number, episode_number, runtime, sources, season_id } = episode;
          const d = {
            id,
            name,
            overview,
            season_id,
            runtime: (() => {
              if (!runtime) {
                return null;
              }
              const [hour, minute] = minute_to_hour(runtime);
              if (hour) {
                return `${hour}h${minute}m`;
              }
              return `${minute}m`;
            })(),
            season_text: season_to_chinese_num(season_number),
            episode_text: episode_to_chinese_num(episode_number),
            sources,
          };
          return d;
        }),
      };
    }),
  });
}
/** 电视剧详情 */
export type TVAndEpisodesProfile = UnpackedResult<Unpacked<ReturnType<typeof fetchTVAndCurEpisodeProcess>>>;
export type TVSeasonProfile = UnpackedResult<
  Unpacked<ReturnType<typeof fetchTVAndCurEpisodeProcess>>
>["seasons"][number];
export type TVEpisodeProfile = UnpackedResult<
  Unpacked<ReturnType<typeof fetchTVAndCurEpisodeProcess>>
>["curEpisodes"][number];

/**
 * 获取影片「播放源」信息，包括播放地址、宽高等信息
 */
export function fetchEpisodeProfile(params: { id: string; type?: EpisodeResolutionTypes }) {
  // console.log("[]fetch_episode_profile", params);
  const { id } = params;
  return request.get<{
    id: string;
    name: string;
    // parent_file_id: string;
    /** 缩略图 */
    thumbnail: string;
    season_number: string;
    episode_number: string;
    /** 影片阿里云盘文件 id */
    file_id: string;
    /** 影片分辨率 */
    type: EpisodeResolutionTypes;
    /** 影片播放地址 */
    url: string;
    /** 影片宽度 */
    width: number;
    /** 影片高度 */
    height: number;
    /** 该影片其他分辨率 */
    other: {
      id: string;
      file_id: string;
      /** 影片分辨率 */
      type: EpisodeResolutionTypes;
      thumbnail: string;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
    subtitles: SubtitleFileResp[];
  }>(`/api/episode/${id}`, {
    type: params.type,
  });
}
export function fetchEpisodeProfileProcess(r: TmpRequestResp<typeof fetchEpisodeProfile>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = r.data;
  return Result.Ok({
    url,
    file_id,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    width,
    height,
    thumbnail,
    resolutions: other.map((t) => {
      const { url, width, height, thumbnail, type } = t;
      return {
        url,
        type,
        typeText: EpisodeResolutionTypeTexts[t.type],
        width,
        height,
        thumbnail,
      };
    }),
    subtitles,
  });
}
export type MediaSourceProfile = UnpackedResult<Unpacked<ReturnType<typeof fetchEpisodeProfileProcess>>>;

/**
 * 获取指定 tv、指定 season 下的所有影片
 */
export function fetchEpisodesOfSeason(params: { tv_id: string; season_id: string } & FetchParams) {
  const { tv_id, season_id, page, pageSize } = params;
  return request.get<
    ListResponse<{
      id: string;
      name: string;
      overview: string;
      season_number: string;
      episode_number: string;
      runtime: number;
      season_id: string;
      sources: MediaSourceProfileRes[];
      subtitles: SubtitleFileResp[];
    }>
  >(`/api/tv/${tv_id}/season/${season_id}/episode/list`, {
    page,
    page_size: pageSize,
  });
}
export function fetchEpisodeOfSeasonProcess(r: TmpRequestResp<typeof fetchEpisodesOfSeason>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, total, page, page_size, no_more } = r.data;
  return Result.Ok({
    page_size,
    page,
    total,
    no_more,
    list: list.map((episode) => {
      const { id, name, overview, season_number, episode_number, runtime, sources, season_id, subtitles } = episode;
      const d = {
        id,
        name,
        overview,
        season_id,
        season_text: season_to_chinese_num(season_number),
        episode_text: (() => {
          if (name.match(/第[^集期场局]{1,}[集期场局]/)) {
            return name;
          }
          if (episode_number.match(/^[0-9]/)) {
            return name;
          }
          return `${episode_to_chinese_num(episode_number)}、${name}`;
        })(),
        runtime: (() => {
          if (!runtime) {
            return null;
          }
          const [hour, minute] = minute_to_hour(runtime);
          if (hour) {
            return `${hour}h${minute}m`;
          }
          return `${minute}m`;
        })(),
        sources,
        subtitles,
      };
      return d;
    }),
  });
}

/**
 * 获取视频源播放信息
 */
export function fetchSourcePlayingInfo(body: { episode_id: string; file_id: string }) {
  return request.get<{
    id: string;
    name: string;
    // parent_file_id: string;
    /** 缩略图 */
    thumbnail: string;
    season_number: string;
    episode_number: string;
    /** 影片阿里云盘文件 id */
    file_id: string;
    /** 影片分辨率 */
    type: EpisodeResolutionTypes;
    /** 影片播放地址 */
    url: string;
    /** 影片宽度 */
    width: number;
    /** 影片高度 */
    height: number;
    /** 该影片其他分辨率 */
    other: {
      id: string;
      file_id: string;
      /** 影片分辨率 */
      type: EpisodeResolutionTypes;
      thumbnail: string;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
    subtitles: SubtitleFileResp[];
  }>(`/api/episode/${body.episode_id}/source/${body.file_id}`);
}
export function fetchSourcePlayingInfoProcess(r: TmpRequestResp<typeof fetchSourcePlayingInfo>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = r.data;
  return Result.Ok({
    url,
    file_id,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    width,
    height,
    thumbnail,
    resolutions: other.map((t) => {
      const { url, width, height, thumbnail, type } = t;
      return {
        url,
        type,
        typeText: EpisodeResolutionTypeTexts[t.type],
        width,
        height,
        thumbnail,
      };
    }),
    subtitles,
  });
}

/**
 * 更新播放记录
 */
export function updatePlayHistory(body: {
  tv_id: string;
  season_id: string;
  episode_id: string;
  /** 视频当前时间 */
  current_time: number;
  duration?: number;
  /** 视频源 */
  file_id: string;
}) {
  const { tv_id, season_id, episode_id, current_time, duration, file_id } = body;
  return request.post<null>("/api/history/update", {
    tv_id,
    season_id,
    episode_id,
    current_time,
    duration,
    file_id,
  });
}

/**
 * 获取当前用户影片播放记录
 * @param params
 * @returns
 */
export function fetchPlayingHistories(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: string;
      type: number;
      /** 电视剧名称 */
      name: string;
      /** 电视剧海报地址 */
      poster_path: string;
      /** 电视剧id */
      tv_id: string;
      season_id: string;
      /** 影片id */
      episode_id: string;
      movie_id: string;
      /** 该集总时长 */
      duration: number;
      /** 看到该电视剧第几集 */
      episode_number: string;
      /** 该集是第几季 */
      season_number: string;
      /** 播放记录当前集进度 */
      current_time: number;
      /** 播放记录更新时间 */
      updated: string;
      /** 当前总集数 */
      cur_episode_count: number;
      /** 该剧集当前季总集数 */
      episode_count: number;
      /** 最新一集添加时间 */
      latest_episode: string;
      /** 首播日期 */
      air_date: string;
      first_air_date: string;
      /** 看过后是否有更新 */
      has_update: number;
      thumbnail: string;
    }>
  >("/api/history/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export function fetchPlayingHistoriesProcess(r: TmpRequestResp<typeof fetchPlayingHistories>) {
  if (r.error) {
    return r;
  }
  const { list, total, page, no_more, page_size } = r.data;
  return Result.Ok({
    no_more,
    page,
    page_size,
    total,
    list: list.map((history) => {
      const {
        id,
        type,
        name,
        tv_id,
        season_id,
        episode_id,
        movie_id,
        poster_path,
        updated,
        has_update,
        episode_number,
        season_number,
        cur_episode_count,
        episode_count,
        duration,
        current_time,
        thumbnail,
        air_date,
        first_air_date,
      } = history;
      if (movie_id) {
        return {
          id,
          type,
          movie_id,
          name,
          poster_path,
          updated: relative_time_from_now(updated),
          air_date: first_air_date,
          currentTime: current_time,
          percent: parseFloat(((current_time / duration) * 100).toFixed(2)),
          thumbnail,
        };
      }
      return {
        id,
        type,
        name,
        tv_id,
        season_id,
        episode_id,
        poster_path,
        cur_episode_count,
        episode_count,
        episode_count_text: (() => {
          if (!episode_count) {
            return null;
          }
          if (cur_episode_count === episode_count) {
            return `全${episode_count}集`;
          }
          return `更新至${cur_episode_count}集`;
        })(),
        episode: episode_to_chinese_num(episode_number),
        season: season_to_chinese_num(season_number),
        updated: relative_time_from_now(updated),
        has_update: !!has_update,
        air_date,
        currentTime: current_time,
        percent: parseFloat(((current_time / duration) * 100).toFixed(2)),
        thumbnail,
      };
    }),
  });
}
export type PlayHistoryItem = RequestedResource<typeof fetchPlayingHistoriesProcess>["list"][0];

export enum MediaTypes {
  TV = 1,
  Movie = 2,
}

export function delete_history(body: { history_id: string }) {
  const { history_id } = body;
  return request.get(`/api/history/${history_id}/delete`);
}

/**
 * 获取电视剧列表
 * @deprecated
 */
export function search_tv_and_movie(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: string;
      tv_id: string;
      type: MediaTypes;
      name: string;
      season_number?: string;
      overview: string;
      poster_path: string;
      air_date: string;
    }>
  >("/api/search", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export type SearchResultItem = UnpackedRequestPayload<ReturnType<typeof search_tv_and_movie>>["list"][0];
