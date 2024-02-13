import { fetchInfo, fetchNotifications, fetchNotificationsProcess } from "@/services";
import { Application } from "@/domains/app";
import { ListCoreV2 } from "@/domains/list/v2";
import { NavigatorCore } from "@/domains/navigator";
import { RouteViewCore } from "@/domains/route_view";
import { HistoryCore } from "@/domains/history";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCore } from "@/domains/list";
import { ImageCore } from "@/domains/ui";
import { Result } from "@/types";

// export * from "./app";
import { client } from "./request";
import { user } from "./user";
import { storage } from "./storage";
import { PageKeys, RouteConfig, routes } from "./routes";
// export * from "./views";

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
    if (!user.isLogin) {
      // app.emit(Application.Events.Error, new Error("请先登录"));
      return Result.Ok(null);
    }
    // app.emit(Application.Events.Ready);
    return Result.Ok(null);
    // if (!user.isLogin) {
    // const r = await has_admin();
    // if (r.error) {
    //   return Result.Ok(null);
    // }
    // const { existing } = r.data;
    // if (!existing) {
    //   app.showView(registerPage);
    //   user.needRegister = true;
    //   return Result.Ok(null);
    // }
    // app.showView(loginPage);
    // rootView.showSubView(loginPage);
    // return Result.Ok(null);
    // }

    // await app.$user.validate();
    // return Result.Ok(null);
  },
});

user.onLogin((profile) => {
  storage.set("user", profile);
});
user.onLogout(() => {
  storage.clear("user");
  // router.push("/login");
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

ListCore.commonProcessor = ListCoreV2.commonProcessor = <T>(
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
