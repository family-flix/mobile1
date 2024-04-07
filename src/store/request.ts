import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.axios";
import { __VERSION__ } from "@/constants/index";
import { Result } from "@/types/index";

export const _client = new HttpClientCore({
  hostname: window.location.origin,
  headers: {
    "client-version": __VERSION__,
  },
});
connect(_client);
// @ts-ignore
export const client: HttpClientCore = {
  setHeaders(headers) {
    return _client.setHeaders(headers);
  },
  appendHeaders(headers) {
    return _client.appendHeaders(headers);
  },
  async get<T>(...args: Parameters<typeof _client.get>) {
    const r = await _client.get<{ code: number | string; msg: string; data: unknown | null }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data as T);
  },
  async post<T>(...args: Parameters<typeof _client.post>) {
    const r = await _client.post<{ code: number | string; msg: string; data: unknown | null }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data as T);
  },
  cancel(...args: Parameters<typeof _client.cancel>) {
    return _client.cancel(...args);
  },
};
