/**
 * @file 构建 http 请求载荷
 */
import qs from "qs";

import { JSONObject } from "@/types";
import { __VERSION__ } from "@/constants";

type RequestClient = {
  get: <T>(url: string, query?: JSONObject) => T;
  post: <T>(url: string, body: Record<string, unknown>) => T;
};
export const request = {
  get: async (endpoint, query) => {
    const url = `${endpoint}${query ? "?" + qs.stringify(query) : ""}`;
    const resp = {
      url,
      headers: {
        "Client-Version": __VERSION__,
      },
    };
    return resp;
  },
  post: async (url, body) => {
    const resp = {
      url,
      body,
      headers: {
        "Client-Version": __VERSION__,
      },
    };
    return resp;
  },
} as RequestClient;
