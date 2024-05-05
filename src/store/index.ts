import { fetchInfo, fetchNotifications, fetchNotificationsProcess } from "@/services/index";
import { Application } from "@/domains/app/index";
import { ListCoreV2 } from "@/domains/list/v2";
import { NavigatorCore } from "@/domains/navigator/index";
import { RouteViewCore } from "@/domains/route_view/index";
import { HistoryCore } from "@/domains/history/index";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ImageCore } from "@/domains/ui/image";
import { Result } from "@/types/index";

import { client } from "./request";
import { user } from "./user";
import { storage } from "./storage";
import { PageKeys, RouteConfig, routes } from "./routes";

NavigatorCore.prefix = "/mobile";
ImageCore.setPrefix(window.location.origin);
const router = new NavigatorCore();
const view = new RouteViewCore({
  name: "root" as PageKeys,
  pathname: "/",
  title: "ROOT",
  visible: true,
  parent: null,
  views: [],
});
export const history = new HistoryCore<PageKeys, RouteConfig>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  user,
  async beforeReady() {
    await user.validate(router.query);
    return Result.Ok(null);
  },
});

user.onLogin((profile) => {
  client.appendHeaders({
    Authorization: user.token,
  });
  storage.set("user", profile);
});
user.onLogout(() => {
  storage.clear("user");
  history.push("root.login");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  // router.replace("/login");
});
user.onTip((msg) => {
  app.tip(msg);
});
user.onNeedUpdate(() => {
  app.tipUpdate();
});

export const messageList = new ListCoreV2(
  new RequestCoreV2({
    fetch: fetchNotifications,
    process: fetchNotificationsProcess,
    client: client,
  }),
  {
    search: {
      status: 1,
    },
  }
);
export const infoRequest = new RequestCoreV2({
  fetch: fetchInfo,
  client: client,
});

ListCoreV2.commonProcessor = <T>(
  originalResponse: any
): {
  dataSource: T[];
  page: number;
  pageSize: number;
  total: number;
  empty: boolean;
  noMore: boolean;
  error: Error | null;
} => {
  if (originalResponse === null) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: null,
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, noMore, no_more, next_marker } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
      error: null,
      next_marker,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
    }
    if (noMore !== undefined) {
      result.noMore = noMore;
    }
    if (next_marker === null) {
      result.noMore = true;
    }
    if (list.length === 0 && page === 1) {
      result.empty = true;
    }
    return result;
  } catch (error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: new Error(`${(error as Error).message}`),
      // next_marker: "",
    };
  }
};
