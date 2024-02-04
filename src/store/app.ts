/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { ListCore } from "@/domains/list";
import { Application } from "@/domains/app";
import { LocalCache } from "@/domains/app/cache";
import { UserCore } from "@/domains/user";
import { NavigatorCore } from "@/domains/navigator";
import { ImageCore } from "@/domains/ui/image";
import { Result } from "@/types";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { StorageCore } from "@/domains/storage";

import { user } from "./user";
import { cache } from "./storage";

NavigatorCore.prefix = "/mobile";
ImageCore.setPrefix(window.location.origin);

const router = new NavigatorCore();
export const app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    // const { query } = router;
    await user.validate(router.query);
    if (!user.isLogin) {
      app.emit(Application.Events.Error, new Error("请先登录"));
      return Result.Ok(null);
    }
    app.emit(Application.Events.Ready);
    return Result.Ok(null);
  },
});

user.onLogin((profile) => {
  cache.set("user", profile);
});
user.onLogout(() => {
  cache.clear("user");
  // router.push("/login");
});
user.onExpired(() => {
  cache.clear("user");
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
