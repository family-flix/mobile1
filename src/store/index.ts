import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { fetchInfo, fetchNotifications } from "@/services";

export * from "./app";
export * from "./views";

export const messageList = new ListCore(new RequestCore(fetchNotifications), {
  search: {
    status: 1,
  },
});
export const infoRequest = new RequestCore(fetchInfo);
