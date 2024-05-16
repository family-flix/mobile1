// import axios, { AxiosError, AxiosInstance, CancelToken } from "axios";

import { BaseDomain, Handler } from "@/domains/base";
import { JSONObject, Result } from "@/types/index";
import { query_stringify } from "@/utils/index";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type HttpClientCoreProps = {
  hostname?: string;
  headers?: Record<string, string>;
};
type HttpClientCoreState = {};

export class HttpClientCore extends BaseDomain<TheTypesOfEvents> {
  hostname: string = "";
  headers: Record<string, string> = {};

  constructor(props: Partial<{ _name: string }> & HttpClientCoreProps) {
    super(props);

    const { hostname = "", headers = {} } = props;

    this.hostname = hostname;
    this.headers = headers;
  }

  async get<T>(
    endpoint: string,
    query?: JSONObject,
    extra: Partial<{ headers: Record<string, string>; id: string }> = {}
  ): Promise<Result<T>> {
    try {
      const h = this.hostname;
      const url = [h, endpoint, query ? "?" + query_stringify(query) : ""].join("");
      const resp = await this.fetch<T>({
        url,
        method: "GET",
        id: extra.id,
        headers: {
          ...this.headers,
          ...(extra.headers || {}),
        },
      });
      return Result.Ok(resp.data);
    } catch (err) {
      const error = err as Error;
      const { message } = error;
      return Result.Err(message);
    }
  }
  async post<T>(
    endpoint: string,
    body?: JSONObject | FormData,
    extra: Partial<{ headers: Record<string, string>; id: string }> = {}
  ): Promise<Result<T>> {
    const h = this.hostname;
    const url = [h, endpoint].join("");
    try {
      const resp = await this.fetch<T>({
        url,
        method: "POST",
        data: body,
        id: extra.id,
        headers: {
          ...this.headers,
          ...(extra.headers || {}),
        },
      });
      return Result.Ok(resp.data);
    } catch (err) {
      const error = err as Error;
      const { message } = error;
      return Result.Err(message);
    }
  }
  async fetch<T>(options: {
    url: string;
    method: "GET" | "POST";
    id?: string;
    data?: JSONObject | FormData;
    headers?: Record<string, string>;
  }) {
    console.log("请在 connect 中实现 fetch 方法");
    return { data: {} } as { data: T };
  }
  cancel(id: string) {
    const tip = "请在 connect 中实现 cancel 方法";
    console.log(tip);
    return Result.Err(tip);
  }
  setHeaders(headers: Record<string, string>) {
    this.headers = headers;
  }
  appendHeaders(headers: Record<string, string>) {
    this.headers = {
      ...this.headers,
      ...headers,
    };
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
