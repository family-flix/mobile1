import dayjs from "dayjs";

import { ListResponseWithCursor } from "@/store/types";
import { TmpRequestResp, UnpackedRequestPayload, request } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import {
  MediaOriginCountry,
  MediaTypes,
  MovieMediaOriginCountryTexts,
  SeasonMediaOriginCountryTexts,
} from "@/constants/index";
import { RequestedResource, Result } from "@/types/index";

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
export function fetchMediaListProcess(r: Result<UnpackedRequestPayload<RequestedResource<typeof fetchMediaList>>>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((movie) => {
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
            return null;
          }
          return Number(vote_average.toFixed(1));
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
        ] as string[],
        episode_count_text: extra_text,
        full: !!extra_text?.match(/全[0-9]{1,}/),
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

export function fetchMediaProfile(values: { media_id: string }) {
  return request.post<{
    id: string;
    type: MediaTypes;
    name: string;
    original_name: string;
    alias: string | null;
    overview: string;
    poster_path: string;
    air_date: string;
    extra_text: string | null;
    genres: {
      value: string;
      label: string;
    }[];
    origin_country: MediaOriginCountry[];
    vote_average: number;
    actors: {
      id: string;
      name: string;
    }[];
  }>("/api/v2/wechat/media/profile", values);
}

export function fetchMediaRanks() {
  return request.post<
    {
      id: string;
      type: number;
      title: string;
      desc: string;
      medias: {
        id: string | null;
        name: string;
        order: number;
        poster_path: string | null;
        vote_average: number | null;
      }[];
    }[]
  >("/api/v2/wechat/rank", {});
}
export function fetchMediaRanksProcess(r: TmpRequestResp<typeof fetchMediaRanks>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(
    r.data.map((rank) => {
      const { id, type, title, desc, medias } = rank;
      return {
        id,
        type,
        title,
        desc,
        medias: medias.slice(0, 10).map((media, i) => {
          const { id, name, order, poster_path, vote_average } = media;
          return {
            key: i,
            id,
            name,
            order,
            poster_path,
            vote_average,
          };
        }),
      };
    })
  );
}
