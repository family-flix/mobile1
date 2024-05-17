/**
 * @file 构建 http 请求载荷
 */
import { RequestedResource, Result } from "@/types/index";
import { query_stringify } from "@/utils/index";

export type RequestPayload<T> = {
  url: string;
  method: "POST" | "GET" | "DELETE" | "PUT";
  query?: any;
  params?: any;
  body?: any;
  headers?: Record<string, string>;
  // defaultResponse?: T;
  process?: (v: T) => T;
};
/**
 * GetRespTypeFromRequestPayload
 * T extends RequestPayload
 */
export type UnpackedRequestPayload<T> = NonNullable<T extends RequestPayload<infer U> ? (U extends null ? U : U) : T>;
export type TmpRequestResp<T extends (...args: any[]) => any> = Result<UnpackedRequestPayload<RequestedResource<T>>>;

let posterHandler: null | ((v: RequestPayload<any>) => void) = null;
export function onCreatePostPayload(h: (v: RequestPayload<any>) => void) {
  posterHandler = h;
}
let getHandler: null | ((v: RequestPayload<any>) => void) = null;
export function onCreateGetPayload(h: (v: RequestPayload<any>) => void) {
  getHandler = h;
}

/**
 * 并不是真正发出网络请求，仅仅是「构建请求信息」然后交给 HttpClient 发出请求
 * 所以这里构建的请求信息，就要包含
 * 1. 请求地址
 * 2. 请求参数
 * 3. headers
 */
export const request = {
  get<T>(
    endpoint: string,
    query?: Record<string, string | number | boolean | null | undefined>,
    extra: Partial<{
      headers: Record<string, string | number>;
      // defaultResponse: T;
    }> = {}
  ) {
    // console.log("GET", endpoint);
    const { headers } = extra;
    const url = [endpoint, query ? "?" + query_stringify(query) : ""].join("");
    const resp = {
      url,
      method: "GET",
      // defaultResponse,
      headers,
    } as RequestPayload<T>;
    if (getHandler) {
      getHandler(resp);
    }
    return resp;
  },
  /** 构建请求参数 */
  post<T>(
    url: string,
    body?: Record<string, unknown> | FormData,
    extra: Partial<{
      headers: Record<string, string | number>;
      // defaultResponse: T;
    }> = {}
  ) {
    // console.log("POST", url);
    const { headers } = extra;
    const resp = {
      url,
      method: "POST",
      body,
      // defaultResponse,
      headers,
    } as RequestPayload<T>;
    if (posterHandler) {
      posterHandler(resp);
    }
    return resp;
  },
};
