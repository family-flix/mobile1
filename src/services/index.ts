import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { TmpRequestResp, request } from "@/domains/request/utils";
import { ListResponse, ListResponseWithCursor, RequestedResource, Result, UnpackedResult } from "@/types";
import { MediaTypes, CollectionTypes, ReportTypes } from "@/constants";
import { season_to_chinese_num } from "@/utils";

export function reportSomething(body: {
  type: ReportTypes;
  data: string;
  media_id?: string;
  media_source_id?: string;
}) {
  return request.post("/api/v2/wechat/report/create", body);
}

type AnswerPayload = Partial<{
  msg: string;
  media: {
    id: string;
    type: MediaTypes;
    name: string;
    air_date: string;
    poster_path: string;
  };
}>;
/**
 * 获取消息通知
 */
export function fetchNotifications(params: FetchParams) {
  return request.post<
    ListResponseWithCursor<{
      id: string;
      content: string;
      status: number;
      created: string;
    }>
  >("/api/v2/wechat/notification/list", params);
}
export function fetchNotificationsProcess(r: TmpRequestResp<typeof fetchNotifications>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { next_marker, page_size, total, list } = r.data;
  return Result.Ok({
    page_size,
    total,
    next_marker,
    list: list.map((notify) => {
      const { id, content, status, created } = notify;
      const { msg, media } = JSON.parse(content) as AnswerPayload;
      return {
        id,
        status,
        media,
        msg,
        created: dayjs(created).format("YYYY-MM-DD HH:mm"),
      };
    }),
  });
}

export function readNotification(params: { id: string }) {
  const { id } = params;
  return request.post("/api/v2/wechat/notification/read", {
    id,
  });
}

export function readAllNotification() {
  return request.post("/api/v2/wechat/notification/read_all", {});
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
  text?: string;
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
export type InviteeItem = UnpackedResult<TmpRequestResp<typeof fetchInviteeList>>["list"][number];

export function fetchCollectionList(body: FetchParams) {
  return request.post<
    ListResponseWithCursor<{
      id: string;
      title: string;
      desc?: string;
      medias: {
        id: string;
        type: number;
        order: number;
        season_text?: string;
        episode_count?: number;
        cur_episode_count?: number;
        name: string;
        poster_path: string;
        air_date: string;
        text: string;
      }[];
    }>
  >("/api/v2/wechat/collection/list", body);
}
export function fetchCollectionListProcess(r: TmpRequestResp<typeof fetchCollectionList>) {
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
        medias: medias
          .sort((a, b) => a.order - b.order)
          .map((media) => {
            const { id, type, name, text, poster_path, air_date, cur_episode_count, episode_count } = media;
            return {
              id,
              type,
              name,
              poster_path,
              air_date: (() => {
                if (type === MediaTypes.Movie) {
                  return air_date;
                }
                return dayjs(air_date).format("YYYY");
              })(),
              text: (() => {
                if (type === MediaTypes.Movie) {
                  return null;
                }
                if (text) {
                  return text;
                }
                if (cur_episode_count === episode_count) {
                  return `全${episode_count}集`;
                }
                return `更新至${cur_episode_count}集`;
              })(),
            } as MediaPayload;
          })
          .filter(Boolean),
      };
    }),
  });
}

/** 获取今日新增影视剧 */
export function fetchUpdatedMediaToday() {
  return request.get<
    ListResponse<{
      id: string;
      title: string;
      type: number;
      medias: {
        id: string;
        name: string;
        type: number;
        poster_path: string;
        air_date?: string;
        text: string | null;
        tv_id?: string;
        season_text?: string;
      }[];
    }>
  >("/api/collection/list", { type: CollectionTypes.DailyUpdate });
}
export function fetchUpdatedMediaTodayProcess(r: TmpRequestResp<typeof fetchUpdatedMediaToday>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const collection = r.data.list[0];
  if (!collection) {
    return Result.Err("获取失败");
  }
  const { id, type, title, medias } = collection;
  return Result.Ok({
    id,
    type,
    title: (() => {
      const d = dayjs(Number(title) * 1000);
      if (d.clone().isSame(dayjs(), "day")) {
        return "今日更新";
      }
      return d.format("MM月DD日") + "更新";
    })(),
    medias: medias.map((media) => {
      const { id, type, name, poster_path, air_date, text, tv_id, season_text } = media;
      if (type === MediaTypes.Movie) {
        return {
          id,
          type,
          name,
          poster_path,
          air_date: dayjs(air_date).format("YYYY/MM/DD"),
          text,
        };
      }
      return {
        id,
        type,
        name,
        poster_path,
        air_date: dayjs(air_date).format("YYYY"),
        text,
        tv_id,
        season_text: season_text ? season_to_chinese_num(season_text) : null,
      };
    }),
  });
}

export function shareMediaToInvitee(values: { season_id?: string; movie_id?: string; target_member_id: string }) {
  const { season_id, movie_id, target_member_id } = values;
  return request.post<{ id: string; name: string; poster_path: string; url: string }>("/api/share/create", {
    season_id,
    movie_id,
    target_member_id,
  });
}

/** 获取电视频道列表 */
export function fetchTVChannelList(params: FetchParams) {
  return request.post<
    ListResponse<{
      id: string;
      name: string;
      group_name: string;
      logo: string;
      url: string;
    }>
  >("/api/tv_live/list", params);
}
