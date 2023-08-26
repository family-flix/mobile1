import dayjs from "dayjs";

import { ReportTypes } from "@/constants";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, Result } from "@/types";
import { request } from "@/utils/request";

export function reportSomething(body: { type: ReportTypes; data: string }) {
  return request.post("/api/report/add", body);
}

export function fetch_subtitle_url(params: { id: string }) {
  const { id } = params;
  return request.get<{ name: string; url: string }>(`/api/subtitle/${id}/url`);
}

/**
 * 获取消息通知
 */
export async function fetchNotifications(params: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      content: string;
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
      const { id, content, created } = notify;
      const { tv_id, name, poster_path, msg } = JSON.parse(content);
      return {
        id,
        tv_id,
        name,
        poster_path,
        msg,
        created: dayjs(created).format("YYYY-MM-DD HH:mm"),
      };
    }),
  });
}
