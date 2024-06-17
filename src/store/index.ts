import { fetchNotifications, fetchNotificationsProcess } from "@/services/index";
import { media_request } from "@/biz/requests";
import { Application } from "@/domains/app/index";
import { ListCore } from "@/domains/list/index";
import { NavigatorCore } from "@/domains/navigator/index";
import { RouteViewCore } from "@/domains/route_view/index";
import { RouteConfig } from "@/domains/route_view/utils";
import { UserCore } from "@/biz/user/index";
import { HistoryCore } from "@/domains/history/index";
import { RequestCore, onRequestCreated } from "@/domains/request/index";
import { ImageCore } from "@/domains/ui/image/index";
import { Result } from "@/domains/result/index";
import { MediaOriginCountry } from "@/constants/index";

import { client } from "./request";
import { storage } from "./storage";
import { PageKeys, routes, routesWithPathname } from "./routes";

NavigatorCore.prefix = import.meta.env.BASE_URL;
ImageCore.setPrefix(window.location.origin);
if (window.location.hostname === "media-t.funzm.com") {
  media_request.setEnv("dev");
}

onRequestCreated((ins) => {
  ins.onFailed((e) => {
    app.tip({
      text: [e.message],
    });
    if (e.code === 900) {
      history.push("root.login");
    }
  });
  if (!ins.client) {
    ins.client = client;
  }
});

const router = new NavigatorCore();

class ExtendsUser extends UserCore {
  say() {
    console.log(`My name is ${this.username}`);
  }
}
const user = new ExtendsUser(storage.get("user"), client);
const view = new RouteViewCore({
  name: "root" as PageKeys,
  pathname: "/",
  title: "ROOT",
  visible: true,
  parent: null,
  views: [],
});
view.isRoot = true;
export const history = new HistoryCore<PageKeys, RouteConfig<PageKeys>>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  user,
  storage,
  async beforeReady() {
    await user.loginWithTokenId({ token: router.query.token, tmp: Number(router.query.tmp) });
    const { pathname, query } = history.$router;
    const route = routesWithPathname[pathname];
    console.log("[ROOT]onMount", pathname, route, app.$user.isLogin);
    if (!route) {
      history.push("root.notfound");
      return Result.Err("not found");
    }
    if (!app.$user.isLogin) {
      if (route.options?.require?.includes("login")) {
        history.push("root.login", { redirect: route.pathname });
        return Result.Err("need login");
      }
    }
    if (app.$user.isLogin) {
      client.appendHeaders({
        Authorization: app.$user.token,
      });
      messageList.init();
    }
    if (!history.isLayout(route.name)) {
      history.push(route.name, query, { ignore: true });
      return Result.Err("can't goto layout");
    }
    history.push(
      "root.home_layout.home_index.home_index_season",
      {
        language: MediaOriginCountry.CN,
      },
      { ignore: true }
    );
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
  history.replace("root.login");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  history.replace("root.login");
});
user.onTip((msg) => {
  app.tip(msg);
});
user.onNeedUpdate(() => {
  app.tipUpdate();
});

export const messageList = new ListCore(
  new RequestCore(fetchNotifications, {
    process: fetchNotificationsProcess,
    client: client,
  }),
  {
    search: {
      status: 1,
    },
  }
);

ListCore.commonProcessor = <T>(
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
