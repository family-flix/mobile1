import dayjs from "dayjs";

import { request, TmpRequestResp } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { SubtitleFileResp } from "@/domains/subtitle/types";
import { MediaResolutionTypes, MediaResolutionTypeTexts } from "@/domains/source/constants";
import { ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
import { episode_to_chinese_num, minute_to_hour, relative_time_from_now, season_to_chinese_num } from "@/utils";
import { MediaOriginCountry, MovieMediaGenresTexts, MovieMediaOriginCountryTexts } from "@/constants";

/**
 * 获取电影和当前播放进度
 * @param body
 */
export function fetchMoviePlayingSource(body: { movie_id: string }) {
  // console.log("[]fetch_tv_profile params", params);
  return request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: string;
    popularity: number;
    sources: {
      file_id: string;
      file_name: string;
      parent_paths: string;
    }[];
    subtitles: SubtitleFileResp[];
    cur_source: {
      file_id: string;
      file_name: string;
    } | null;
    /** 当前进度 */
    current_time: number;
    /** 当前进度截图 */
    thumbnail: string | null;
  }>(`/api/v2/wechat/season/playing`, {
    media_id: body.movie_id,
  });
}
export function fetchMoviePlayingSourceProcess(r: TmpRequestResp<typeof fetchMoviePlayingSource>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, current_time, thumbnail, sources, subtitles, cur_source } = r.data;
  return Result.Ok({
    id,
    name,
    overview,
    currentTime: current_time,
    thumbnail,
    sources,
    curSource: cur_source,
    subtitles,
  });
}
/** 电影详情 */
export type MovieProfile = UnpackedResult<Unpacked<ReturnType<typeof fetchMoviePlayingSourceProcess>>>;

/**
 * 获取影片「播放源」信息，包括播放地址、宽高等信息
 */
export function fetchMovieProfile(params: { id: string; type?: MediaResolutionTypes }) {
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
    type: MediaResolutionTypes;
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
      type: MediaResolutionTypes;
      thumbnail: string;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
    subtitles: SubtitleFileResp[];
  }>(`/api/movie/${id}`, {
    type: params.type,
  });
}
export function fetchMovieProfileProcess(r: TmpRequestResp<typeof fetchMovieProfile>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = r.data;
  return Result.Ok({
    url,
    file_id,
    type,
    typeText: MediaResolutionTypeTexts[type],
    width,
    height,
    thumbnail,
    resolutions: other.map((t) => {
      const { url, width, height, thumbnail, type } = t;
      return {
        url,
        type,
        typeText: MediaResolutionTypeTexts[t.type],
        width,
        height,
        thumbnail,
      };
    }),
    subtitles,
  });
}

/**
 * 获取影片「播放源」信息，包括播放地址、宽高等信息
 */
export function fetchMediaProfile(params: { id: string; type?: MediaResolutionTypes }) {
  // console.log("[]fetch_episode_profile", params);
  const { id } = params;
  return request.get<{
    id: string;
    name: string;
    /** 缩略图 */
    thumbnail: string;
    /** 影片阿里云盘文件 id */
    file_id: string;
    /** 影片分辨率 */
    type: MediaResolutionTypes;
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
      type: MediaResolutionTypes;
      thumbnail: string;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
    subtitles: SubtitleFileResp[];
  }>(`/api/media/${id}`, {
    type: params.type,
  });
}
export function fetchMediaProfileProcess(r: TmpRequestResp<typeof fetchMediaProfile>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, file_id, width, height, thumbnail, type, other, subtitles } = r.data;
  return Result.Ok({
    url,
    file_id,
    type,
    typeText: MediaResolutionTypeTexts[type],
    width,
    height,
    thumbnail,
    resolutions: other.map((t) => {
      const { url, width, height, thumbnail, type } = t;
      return {
        url,
        type,
        typeText: MediaResolutionTypeTexts[t.type],
        width,
        height,
        thumbnail,
      };
    }),
    subtitles,
  });
}
export type MediaSourceProfile = UnpackedResult<Unpacked<ReturnType<typeof fetchMediaProfileProcess>>>;
/**
 * 更新播放记录
 */
export async function updateMoviePlayHistory(params: {
  movie_id?: string;
  /** 视频当前时间 */
  current_time?: number;
  duration?: number;
  file_id?: string;
}) {
  const { movie_id, current_time = 0, duration = 0, file_id } = params;
  return request.post<null>("/api/history/movie/update", {
    movie_id,
    current_time,
    duration,
    file_id,
  });
}

/**
 * 隐藏指定 tv
 * @param body
 * @returns
 */
export function hidden_tv(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/tv/hidden/${id}`);
}

/**
 * 获取当前用户影片播放记录
 * @param params
 * @returns
 */
export function fetchPlayHistories(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  return request.get<
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
}
export function fetchPlayHistoriesProcess(r: TmpRequestResp<typeof fetchPlayHistories>) {
  if (r.error) {
    return r;
  }
  const { list, total, no_more, page, page_size } = r.data;
  return Result.Ok({
    page,
    page_size,
    no_more,
    total,
    list: list.map((history) => {
      const {
        id,
        name,
        tv_id,
        episode_id,
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
      return {
        id,
        name,
        tv_id,
        episode_id,
        poster_path,
        cur_episode_count,
        episode_count,
        episode: episode_to_chinese_num(episode_number),
        season: season_to_chinese_num(season_number),
        updated: relative_time_from_now(updated),
        has_update: !!has_update,
        currentTime: current_time,
        percent: parseFloat((current_time / duration).toFixed(2)) * 100 + "%",
        thumbnail,
      };
    }),
  });
}
export type PlayHistoryItem = RequestedResource<typeof fetchPlayHistoriesProcess>["list"][0];

/**
 * 获取电影列表
 */
export function fetchMovieList(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      backdrop_path: string;
      air_date: string;
      vote_average: number;
      genres: string;
      origin_country: string;
      runtime: number;
      actors: {
        id: string;
        name: string;
      }[];
    }>
  >("/api/movie/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export function fetchMovieListProcess(r: TmpRequestResp<typeof fetchMovieList>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((movie) => {
      const {
        id,
        name,
        original_name,
        overview,
        runtime,
        poster_path,
        air_date,
        vote_average,
        genres,
        origin_country,
        actors = [],
      } = movie;
      return {
        id,
        name: name || original_name,
        overview,
        poster_path,
        air_date: dayjs(air_date).format("YYYY-MM-DD"),
        vote: (() => {
          if (vote_average === 0) {
            return "N/A";
          }
          return vote_average.toFixed(1);
        })(),
        genres: origin_country
          .split("|")
          .map((country) => {
            return MovieMediaOriginCountryTexts[country as MediaOriginCountry] ?? "unknown";
          })
          .concat(
            genres
              .split("|")
              .map((g) => {
                return MovieMediaGenresTexts[g];
              })
              .filter(Boolean)
          ),
        runtime: (() => {
          if (!runtime) {
            return null;
          }
          const [hour, minute] = minute_to_hour(runtime);
          if (hour) {
            if (minute === 0) {
              return `${hour}h`;
            }
            return `${hour}h${minute}m`;
          }
          return `${minute}m`;
        })(),
        actors: actors.map((actor) => actor.name).join(" / "),
      };
    }),
  });
}
export type MovieItem = RequestedResource<typeof fetchMovieListProcess>["list"][0];
