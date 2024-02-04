import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request_v2";
import { fetchInfo, fetchNotifications, fetchNotificationsProcess } from "@/services";

// export * from "./app";
import { request } from "./request";
// export * from "./views";

export const messageList = new ListCoreV2(
  new RequestCoreV2({
    fetch: fetchNotifications,
    process: fetchNotificationsProcess,
    client: request,
  }),
  {
    search: {
      status: 1,
    },
  }
);
export const infoRequest = new RequestCoreV2({
  fetch: fetchInfo,
  client: request,
});
