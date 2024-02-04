import dayjs from "dayjs";

import { UnpackedRequestPayload, request } from "@/domains/request_v2/utils";
import {
  MediaOriginCountry,
  MediaTypes,
  MovieMediaGenresTexts,
  MovieMediaOriginCountryTexts,
  SeasonMediaOriginCountryTexts,
} from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, RequestedResource, Result } from "@/types";

/**
 * 获取电影列表
 */
export function fetchMediaList(params: FetchParams & { type: MediaTypes; name: string }) {
  const { page, pageSize, ...rest } = params;
  return request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaTypes;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      //       backdrop_path: string;
      air_date: string;
      extra_text: string | null;
      genres: {
        value: string;
        label: string;
      }[];
      origin_country: MediaOriginCountry[];
      //       runtime: number;
      vote_average: number;
      actors: {
        id: string;
        name: string;
      }[];
    }>
  >("/api/v2/wechat/media/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export function fetchMediaListProcess(resp: Result<UnpackedRequestPayload<RequestedResource<typeof fetchMediaList>>>) {
  if (resp.error) {
    return Result.Err(resp.error);
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((movie) => {
      const {
        id,
        type,
        name,
        original_name,
        overview,
        extra_text,
        poster_path,
        air_date,
        vote_average,
        genres,
        origin_country,
        actors = [],
      } = movie;
      return {
        id,
        type,
        name: name || original_name,
        overview,
        poster_path,
        air_date: dayjs(air_date).format(type === MediaTypes.Movie ? "YYYY-MM-DD" : "YYYY"),
        vote: (() => {
          if (vote_average === 0) {
            return "N/A";
          }
          return vote_average.toFixed(1);
        })(),
        genres: [
          ...origin_country
            .map((country) => {
              if (type === MediaTypes.Movie) {
                return MovieMediaOriginCountryTexts[country];
              }
              if (type === MediaTypes.Season) {
                return SeasonMediaOriginCountryTexts[country];
              }
              return null;
            })
            .filter(Boolean),
          ...genres
            .map((g) => {
              return g.label;
            })
            .filter(Boolean),
        ],
        episode_count_text: extra_text,
        // runtime: (() => {
        //   if (!runtime) {
        //     return null;
        //   }
        //   const [hour, minute] = minute_to_hour(runtime);
        //   if (hour) {
        //     if (minute === 0) {
        //       return `${hour}h`;
        //     }
        //     return `${hour}h${minute}m`;
        //   }
        //   return `${minute}m`;
        // })(),
        actors: actors.map((actor) => actor.name).join(" / "),
      };
    }),
  });
}
export type MediaItem = RequestedResource<typeof fetchMediaListProcess>["list"][0];

export function fetchMemberToken(values: { media_id: string; target_member_id: string }) {
  const { media_id, target_member_id } = values;
  return request.post<{ name: string; original_name: string; poster_path: string; token: string }>(
    "/api/v2/wechat/member/token",
    {
      media_id,
      target_member_id,
    }
  );
}
