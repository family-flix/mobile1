import dayjs from "dayjs";

import { ReportTypes } from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, Result } from "@/types";
import { request } from "@/utils/request";
import { MediaTypes } from "@/domains/tv/services";

export function reportSomething(body: { type: ReportTypes; data: string }) {
  return request.post("/api/report/add", body);
}

export function fetch_subtitle_url(params: { id: string }) {
  const { id } = params;
  return request.get<{ name: string; url: string }>(`/api/subtitle/${id}/url`);
}

type AnswerPayload = Partial<{
  content: string;
  season: {
    id: string;
    tv_id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
  movie: {
    id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
}>;
/**
 * 获取消息通知
 */
export async function fetchNotifications(params: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      content: string;
      status: number;
      created: string;
    }>
  >("/api/notification/list", params);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { page, page_size, total, no_more, list } = r.data;
  return Result.Ok({
    page,
    page_size,
    total,
    no_more,
    list: list.map((notify) => {
      const { id, content, status, created } = notify;
      const { msg, movie, season } = JSON.parse(content) as {
        msg: string;
      } & AnswerPayload;
      return {
        id,
        status,
        movie,
        season,
        msg,
        created: dayjs(created).format("YYYY-MM-DD HH:mm"),
      };
    }),
  });
}

export function readNotification(params: { id: string }) {
  const { id } = params;
  return request.get(`/api/notification/${id}/read`);
}

export function readAllNotification() {
  return request.get(`/api/notification/read`);
}

export function fetchInfo() {
  return request.get<{
    id: string;
    permissions: string[];
  }>("/api/info");
}

/**
 * 邀请成员
 */
export function inviteMember(values: { remark: string }) {
  const { remark } = values;
  return request.post<{
    id: string;
    remark: string;
    tokens: {
      id: string;
      token: string;
      used: number;
    }[];
  }>("/api/invitee/add", {
    remark,
  });
}
export type MediaPayload = {
  id: string;
  type: number;
  tv_id?: string;
  season_text?: string;
  episode_count_text?: number;
  name: string;
  poster_path: string;
  air_date: string;
};
export function fetchInviteeList(params: FetchParams) {
  return request.get<
    ListResponse<{
      id: string;
      remark: string;
      tokens: {
        id: string;
        token: string;
        used: number;
      }[];
    }>
  >("/api/invitee/list", params);
}

export async function fetchCollectionList(body: FetchParams) {
  const r = await request.post<
    ListResponse<{
      id: string;
      title: string;
      desc?: string;
      medias: {
        id: string;
        type: number;
        tv_id?: string;
        season_text?: string;
        episode_count?: number;
        cur_episode_count?: number;
        name: string;
        poster_path: string;
        air_date: string;
      }[];
    }>
  >("/api/collection/list", body);
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((collection) => {
      const { id, title, desc, medias } = collection;
      return {
        id,
        title,
        desc,
        medias: medias.map((media) => {
          const { id, type, name, poster_path, air_date } = media;
          if (type === MediaTypes.TV) {
            const { cur_episode_count, episode_count } = media;
            return {
              id,
              type,
              name,
              poster_path,
              air_date,
              episode_count_text: (() => {
                if (!episode_count) {
                  return;
                }
                if (cur_episode_count === episode_count) {
                  return `全${episode_count}集`;
                }
                return `更新至${cur_episode_count}集`;
              })(),
            } as MediaPayload;
          }
          return {
            id,
            type,
            name,
            poster_path,
            air_date,
          } as MediaPayload;
        }),
      };
    }),
  });
}

/** 获取今日新增影视剧 */
export function fetchUpdatedMediaToday() {
  return request.post<
    ListResponse<{
      id: string;
      type: number;
      name: string;
      poster_path: string;
      air_date: string;
      text: string | null;
      tv_id?: string;
      season_text?: string;
    }>
  >("/api/discover/day", {});
}
