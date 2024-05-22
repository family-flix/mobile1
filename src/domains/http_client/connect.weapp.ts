import { Result } from "@/domains/result/index";

import { HttpClientCore } from "./index";

export function connect(store: HttpClientCore) {
  let requests: { id: string; source: { abort: () => void } }[] = [];
  store.fetch = (options) => {
    const { url, method, id, data, headers } = options;
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const r: { abort: () => void } = wx.request({
        url,
        method,
        data,
        header: headers,
        success(result: any) {
          requests = requests.filter((r) => r.id !== id);
          return resolve(result);
        },
        fail(err: { errMsg: string }) {
          requests = requests.filter((r) => r.id !== id);
          return reject(err.errMsg);
        },
      });
      if (id) {
        requests.push({
          id,
          source: r,
        });
      }
    });
  };
  store.cancel = (id: string) => {
    const matched = requests.find((r) => r.id === id);
    if (!matched) {
      return Result.Err("没有找到对应请求");
    }
    requests = requests.filter((r) => r.id !== id);
    matched.source.abort();
    return Result.Ok(null);
  };
}
