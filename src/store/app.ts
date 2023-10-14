/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { ListCore } from "@/domains/list";
import { Application } from "@/domains/app";
import { LocalCache } from "@/domains/app/cache";
import { UserCore } from "@/domains/user";
import { NavigatorCore } from "@/domains/navigator";
import { Result } from "@/types";

NavigatorCore.prefix = "/mobile";

const cache = new LocalCache({
  key: "m_global",
});
const router = new NavigatorCore();
const user = new UserCore(cache.get("user"));
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

export const app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    // const { query } = router;
    await user.validate(router.query.token, router.query.force);
    if (!user.isLogin) {
      app.emit(Application.Events.Error, new Error("请先登录"));
      return Result.Ok(null);
    }
    app.emit(Application.Events.Ready);
    return Result.Ok(null);
  },
});
// @ts-ignore
window.__app = app;

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
    const { list, page, page_size, total, noMore, no_more } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
      error: null,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (noMore !== undefined) {
      result.noMore = noMore;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
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
    };
  }
};
