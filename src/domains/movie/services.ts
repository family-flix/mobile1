import dayjs from "dayjs";

import { request, TmpRequestResp } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { SubtitleFileResp } from "@/domains/subtitle/types";
import { MediaResolutionTypes, MediaResolutionTypeTexts } from "@/domains/source/constants";
import { ListResponse, RequestedResource, Unpacked, UnpackedResult } from "@/types";
import { Result } from "@/domains/result/index";
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
