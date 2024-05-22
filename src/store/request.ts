/**
 * @file 网络请求
 */
import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.axios";
import { RequestPayload, request, request_factory } from "@/domains/request/utils";
import { RequestCore } from "@/domains/request/index";
import { __VERSION__ } from "@/constants/index";
import { Result } from "@/domains/result/index";

const media_request = request_factory({
  hostnames: {
    dev: "https://media-t.funzm.com",
    test: "https://media-t.funzm.com",
    beta: "https://media.funzm.com",
    prod: "https://media.funzm.com",
  },
  process<T>(r: Result<{ code: number | string; msg: string; data: T }>) {
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
});
// function fetchUserProfile(values: { id: string }) {
//   return media_request.post<{ nickname: string }>("/api/user/profile", values);
// }

// async function main() {
//   const req = new RequestCore(fetchUserProfile, { client });
//   const r = await req.run({ id: "" });
//   if (r.error) {
//     console.log(r.error.message);
//     return;
//   }
//   const data = r.data;
//   console.log(data);
// }
// media_request.setEnv("dev");
// media_request.appendHeaders({
//   Authorization: app.$user.token,
// });

export const client = new HttpClientCore({
  hostname: window.location.origin,
  headers: {
    "client-version": __VERSION__,
  },
});
connect(client);
