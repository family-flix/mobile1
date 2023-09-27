import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { SubtitleResp } from "@/domains/subtitle/types";
import { ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
import { request } from "@/utils/request";
import { episode_to_chinese_num, minute_to_hour, relative_time_from_now, season_to_chinese_num } from "@/utils";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";
import { MediaSource, TVGenresTexts, TVSourceTexts } from "@/constants";

/**
 * 获取电视剧列表
 */
export async function fetch_tv_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
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
  if (resp.error) {
    return Result.Err(resp.error);
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((tv) => {
      return tv;
    }),
  });
}
export type TVItem = RequestedResource<typeof fetch_tv_list>["list"][0];

/**
 * 获取季列表
 */
export async function fetch_season_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
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
      first_air_date: string;
      genres: string;
      origin_country: string;
      vote_average: number;
    }>
  >("/api/season/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return Result.Err(resp.error);
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((season) => {
      const {
        id,
        tv_id,
        season_text,
        name,
        original_name,
        overview,
        poster_path,
        vote_average,
        first_air_date,
        genres,
        origin_country,
        episode_count,
        cur_episode_count,
      } = season;
      return {
        id,
        tv_id,
        name: name || original_name,
        season_text,
        air_date: dayjs(first_air_date).year(),
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
            return TVSourceTexts[country as MediaSource] ?? "unknown";
          })
          .concat(
            genres
              .split("|")
              .map((g) => {
                return TVGenresTexts[g];
              })
              .filter(Boolean)
          ),
      };
    }),
  });
}
export type SeasonItem = RequestedResource<typeof fetch_season_list>["list"][0];

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
export async function fetch_tv_and_cur_episode(params: { tv_id: string; season_id?: string }) {
  // console.log("[]fetch_tv_profile params", params);
  const { tv_id, season_id } = params;
  const r = await request.get<{
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
        subtitles: SubtitleResp[];
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
      subtitles: SubtitleResp[];
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
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, seasons, cur_season, cur_episode } = r.data;
  const matchedSeason = seasons.find((season) => {
    return season.id === cur_season.id;
  });
  return Result.Ok({
    id,
    name,
    overview,
    curSeason: {
      episodes: [],
      ...(matchedSeason || cur_season),
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
export type TVAndEpisodesProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>>;
export type TVSeasonProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>>["seasons"][number];
export type TVEpisodeProfile = UnpackedResult<
  Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>
>["curEpisodes"][number];

/**
 * 获取影片「播放源」信息，包括播放地址、宽高等信息
 */
export async function fetch_episode_profile(params: { id: string; type?: EpisodeResolutionTypes }) {
  // console.log("[]fetch_episode_profile", params);
  const { id } = params;
  const res = await request.get<{
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
    subtitles: SubtitleResp[];
  }>(`/api/episode/${id}`, {
    type: params.type,
  });
  if (res.error) {
    return Result.Err(res.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = res.data;
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
export type MediaSourceProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_episode_profile>>>;

/**
 * 获取指定 tv、指定 season 下的所有影片
 */
export async function fetch_episodes_of_season(params: { tv_id: string; season_id: string } & FetchParams) {
  const { tv_id, season_id, page, pageSize } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      overview: string;
      season_number: string;
      episode_number: string;
      runtime: number;
      season_id: string;
      sources: MediaSourceProfileRes[];
      subtitles: SubtitleResp[];
    }>
  >(`/api/tv/${tv_id}/season/${season_id}/episode/list`, {
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, total, page_size, no_more } = r.data;
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
    }),
  });
}

/**
 * 获取视频源播放信息
 */
export async function fetch_source_playing_info(body: { episode_id: string; file_id: string }) {
  const res = await request.get<{
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
    subtitles: SubtitleResp[];
  }>(`/api/episode/${body.episode_id}/source/${body.file_id}`);
  if (res.error) {
    return Result.Err(res.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = res.data;
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
export async function update_play_history(body: {
  tv_id: string;
  episode_id: string;
  /** 视频当前时间 */
  current_time: number;
  duration?: number;
  /** 视频源 */
  file_id: string;
}) {
  const { tv_id, episode_id, current_time, duration, file_id } = body;
  return request.post<null>("/api/history/update", {
    tv_id,
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
export async function fetchPlayingHistories(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      /** 电视剧名称 */
      name: string;
      /** 电视剧海报地址 */
      poster_path: string;
      /** 电视剧id */
      tv_id: string;
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
      /** 电视剧首播日期 */
      first_air_date: string;
      /** 该季首播日期 */
      air_date: string;
      /** 看过后是否有更新 */
      has_update: number;
      thumbnail: string;
    }>
  >("/api/history/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  const { list, total, no_more, page_size } = r.data;
  return Result.Ok({
    no_more,
    page,
    page_size,
    total,
    list: list.map((history) => {
      const {
        id,
        name,
        tv_id,
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
      } = history;
      if (movie_id) {
        return {
          id,
          movie_id,
          name,
          poster_path,
          updated: relative_time_from_now(updated),
          currentTime: current_time,
          percent: parseFloat(((current_time / duration) * 100).toFixed(2)),
          thumbnail,
        };
      }
      return {
        id,
        name,
        tv_id,
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
        currentTime: current_time,
        percent: parseFloat(((current_time / duration) * 100).toFixed(2)),
        thumbnail,
      };
    }),
  });
}
export type PlayHistoryItem = RequestedResource<typeof fetchPlayingHistories>["list"][0];

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
export async function search_tv_and_movie(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
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
  if (resp.error) {
    return Result.Err(resp.error);
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((tv) => {
      const { ...rest } = tv;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type SearchResultItem = RequestedResource<typeof search_tv_and_movie>["list"][0];
