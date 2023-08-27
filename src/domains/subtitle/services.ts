import { request } from "@/utils/request";

export function fetch_subtitle_url(params: { id: string }) {
  const { id } = params;
  return request.get<{ name: string; url: string }>(`/api/subtitle/${id}/url`);
}
