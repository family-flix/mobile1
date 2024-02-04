import axios, { AxiosError, AxiosInstance, CancelToken } from "axios";

import { BaseDomain, Handler } from "@/domains/base";
import { UserCore } from "@/domains/user";
import { JSONObject, Result } from "@/types";
import { query_stringify } from "@/utils";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type HttpClientCoreProps = {
  hostname: string;
  user: UserCore;
};
type HttpClientCoreState = {};

export class HttpClientCore extends BaseDomain<TheTypesOfEvents> {
  axios: AxiosInstance;
  user: UserCore;

  hostname: string;

  constructor(props: Partial<{ _name: string }> & HttpClientCoreProps) {
    super(props);

    const { hostname, user } = props;

    this.hostname = hostname;
    this.user = user;
    const client = axios.create({
      timeout: 12000,
    });
    this.axios = client;

    type RequestClient = {
      get: <T>(
        url: string,
        query?: JSONObject,
        config?: Partial<{ headers: Record<string, string> }>
      ) => Promise<Result<T>>;
      post: <T>(
        url: string,
        body: JSONObject | FormData,
        config?: Partial<{ headers: Record<string, string> }>
      ) => Promise<Result<T>>;
    };
    const request = {} as RequestClient;
  }

  async get<T>(
    endpoint: string,
    query?: JSONObject,
    extra: Partial<{ headers: Record<string, string>; token: CancelToken }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    const user = this.user;
    try {
      const h = this.hostname;
      const url = `${h}${endpoint}${query ? "?" + query_stringify(query) : ""}`;
      const resp = await client.get<{ code: number | string; msg: string; data: unknown | null }>(url, {
        cancelToken: extra.token,
        headers: {
          ...(extra.headers || {}),
          Authorization: user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data as T);
    } catch (err) {
      const error = err as AxiosError;
      if (axios.isCancel(error)) {
        return Result.Err("cancel", "CANCEL");
      }
      const { response, message } = error;
      console.log("error", message);
      return Result.Err(message);
    }
  }

  async post<T>(
    endpoint: string,
    body?: JSONObject | FormData,
    extra: Partial<{ headers: Record<string, string>; token: CancelToken }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    const user = this.user;
    const h = this.hostname;
    try {
      const resp = await client.post<{ code: number | string; msg: string; data: unknown | null }>(endpoint, body, {
        cancelToken: extra.token,
        headers: {
          ...(extra.headers || {}),
          Authorization: user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data as T);
    } catch (err) {
      const error = err as AxiosError;
      if (axios.isCancel(error)) {
        return Result.Err("cancel", "CANCEL");
      }
      const { response, message } = error;
      return Result.Err(message);
    }
  }
  cancel() {}

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
