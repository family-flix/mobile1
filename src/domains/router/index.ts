import qs from "qs";
import { pathToRegexp } from "path-to-regexp";
import debounce from "lodash/fp/debounce";

import { noop, sleep } from "@/utils";
import { Domain, Listener } from "@/domains/base";

function resistanceFunction(t: number) {
  return Math.min(1, t / 2.5);
}

let _uid = 0;
function uid() {
  _uid += 1;
  return _uid;
}
function buildParams(opt: {
  regexp: RegExp;
  targetPath: string;
  keys: ParamConfigure[];
}) {
  const { regexp, keys, targetPath } = opt;
  // const regexp = pathToRegexp(path, keys);
  const match = regexp.exec(targetPath);
  if (match) {
    const params: Record<string, string> = {};
    for (let i = 1; i < match.length; i++) {
      params[keys[i - 1].name] = match[i];
    }
    return params;
  }
  return {};
}
function buildQuery(path: string) {
  const [, search] = path.split("?");
  if (!search) {
    return {} as Record<string, string>;
  }
  return qs.parse(search) as Record<string, string>;
}
function convertNumberStringsToNumbers(obj: Record<string, any>) {
  const result: Record<string, string | number> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (!isNaN(value)) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
type ParamConfigure = {
  name: string;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
};
type RouteConfigure = {
  title: string;
  // 怎么才能支持不同框架，而不是和 React 绑定呢？
  component: React.FC<any>;
};
type Stack = {
  uid: number;
  pathname: string;
  /** query 参数 */
  query: Record<string, string>;
  /** 路由参数 */
  params: Record<string, string>;
  /** 页面准备销毁 */
  // unmounting: boolean;
  /** 页面实例 */
  page: Page;
} & RouteConfigure;
export class Router {
  /** 配置信息 */
  configs: {
    /** 路由匹配规则 */
    path: string;
    /** 根据路由匹配规则解析得到的正则表达式 */
    regexp: RegExp;
    /** 参数获取 */
    keys: ParamConfigure[];
    config: () => RouteConfigure;
  }[];

  /** 当前页面栈 */
  stacks: Stack[] = [];
  /** 浏览器返回后，被销毁的那个栈 */
  destroyStacksWhenBack: Stack[] = [];

  /** 当前 pathname */
  pathname: string;
  /** 发生跳转前的 pathname */
  prevPathname: string | null = null;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  /** 当前访问地址 */
  url: string;

  /** router 基础信息 */
  host: string;
  protocol: string;
  origin: string;

  /** 回调事件 */
  onStacksChange: (stacks: Router["stacks"]) => void = noop;

  constructor() {
    this.configs = [];
    const { host, protocol, origin, href, pathname } = this.getLocation();
    this.host = host;
    this.protocol = protocol;
    this.origin = origin;
    this.pathname = pathname;
    this.url = href;
    this.query = buildQuery(href);
    console.log("[DOMAIN]Router - init", this);
  }

  setPrevPathname(p: string) {
    // console.log("[] - setPrevPathname", p);
    this.prevPathname = p;
  }
  setPathname(p: string) {
    // console.log("[] - setPathname", p);
    this.pathname = p;
  }

  /** 添加路由 */
  route(path: string, configFactory: () => RouteConfigure) {
    // @todo 检查重复注册路由
    const keys: ParamConfigure[] = [];
    const regexp = pathToRegexp(path, keys);
    this.configs.push({
      regexp,
      keys,
      path,
      config: configFactory,
    });
  }
  /** 跳转到指定路由 */
  push = async (
    targetPath: string,
    options: Partial<{ modifyHistory: boolean }> = {}
  ) => {
    const { modifyHistory = true } = options;
    console.log("[DOMAIN]Router - push", targetPath);
    this.setPrevPathname(this.pathname);
    const matchedRoute = this.configs.find((route) => {
      const { regexp } = route;
      return regexp.test(targetPath);
    });
    if (!matchedRoute) {
      console.error(`Route ${targetPath} not found`);
      return;
    }
    // targetPath 可能是带 search 的，不一定是 pathname 概念
    this.setPathname(targetPath);
    const { regexp, keys, config } = matchedRoute;
    const params = buildParams({
      regexp,
      targetPath,
      keys,
    });
    const query = buildQuery(targetPath);
    const { title, component } = await config();
    this.render(
      {
        title,
        component,
        regexp,
      },
      {
        query,
        params,
      }
    );
    if (!modifyHistory) {
      return;
    }
    window.history.pushState(
      {
        from: this.prevPathname,
      },
      title,
      `${this.origin}${targetPath}`
    );
  };
  replace = async (targetPath: string) => {
    console.log("[DOMAIN]Router - replace", targetPath);
    this.setPrevPathname(this.pathname);
    const matchedRoute = this.configs.find((route) => {
      const { regexp } = route;
      return regexp.test(targetPath);
    });
    if (!matchedRoute) {
      console.error(`Route ${targetPath} not found`);
      return;
    }
    // targetPath 可能是带 search 的，不一定是 pathname 概念
    this.setPathname(targetPath);
    const { regexp, keys, config } = matchedRoute;
    const params = buildParams({
      regexp,
      targetPath,
      keys,
    });
    const query = buildQuery(targetPath);
    const { title, component } = await config();
    this.render(
      {
        title,
        component,
        regexp,
      },
      {
        query,
        params,
        replace: true,
      }
    );
    window.history.replaceState(
      { from: this.prevPathname },
      title,
      `${this.origin}${targetPath}`
    );
  };
  back = () => {
    window.history.back();
  };
  reload = () => {
    window.location.reload();
  };
  render(
    opt: RouteConfigure & { regexp: RegExp },
    extra: {
      query: Record<string, string>;
      params: Record<string, string>;
      replace?: boolean;
    }
  ) {
    const { title, component } = opt;
    const { query, params, replace = false } = extra;
    this.query = query;
    this.params = params;
    // console.log("[DOMAIN]router - push", path);
    const cloneStacks = this.stacks.map((page) => {
      return {
        ...page,
        hidden: true,
      };
    });
    const newPage = new Page({ scrollTop: 0, yDistance: 0, state: "pending" });
    if (title) {
      newPage.setTitle(title);
    }
    if (replace) {
      cloneStacks[this.stacks.length - 1] = {
        uid: uid(),
        title,
        pathname: this.pathname,
        component,
        hidden: false,
        query,
        params,
        page: newPage,
      };
    } else {
      cloneStacks.push({
        uid: uid(),
        title,
        pathname: this.pathname,
        component,
        hidden: false,
        query,
        params,
        page: newPage,
      });
    }
    this.stacks = cloneStacks;
    if (this.onStacksChange) {
      this.onStacksChange(cloneStacks);
    }
  }
  /** 启动路由监听 */
  start() {
    (async () => {
      // console.log("[DOMAIN]router - document loaded, current pathname is");
      const { pathname, href } = this.getLocation();
      const matchedRoute = this.configs.find((route) => {
        const { regexp } = route;
        return regexp.test(pathname);
      });
      if (!matchedRoute) {
        // alert(`Route ${path} not found`);
        console.error(`Route ${pathname} not found`);
        return;
      }
      const { regexp, keys, config } = matchedRoute;
      const params = buildParams({
        regexp,
        targetPath: pathname,
        keys,
      });
      const query = buildQuery(href);
      const { title, component } = await config();
      // await sleep(800);
      this.render(
        {
          title,
          component,
          regexp,
        },
        { query, params }
      );
    })();
    window.addEventListener("popstate", (event) => {
      const { type } = event;
      if (type !== "popstate") {
        return;
      }
      const targetPath = this.getLocation().pathname;
      console.log("[DOMAIN]router - popstate change", targetPath);
      const isForward = (() => {
        if (this.destroyStacksWhenBack.length === 0) {
          return false;
        }
        const lastStackWhenBack =
          this.destroyStacksWhenBack[this.destroyStacksWhenBack.length - 1];
        console.log("[DOMAIN]router - lastStackWhenBack", lastStackWhenBack);
        if (lastStackWhenBack.pathname === targetPath) {
          return true;
        }
        return false;
      })();
      // forward
      if (isForward) {
        this.setPrevPathname(this.pathname);
        this.setPathname(targetPath);
        const lastStackWhenBack = this.destroyStacksWhenBack.pop();
        this.stacks = this.stacks.concat([lastStackWhenBack!]);
        if (this.onStacksChange) {
          this.onStacksChange([...this.stacks]);
        }
        return;
      }
      // back
      if (this.stacks.length === 1) {
        this.replace("/");
        return;
      }
      const theStackPrepareDestroy = this.stacks[this.stacks.length - 1];
      // @todo 可以让 emitHidden 返回 promise，决定是否要隐藏页面吗？
      theStackPrepareDestroy.page.emitHidden();
      this.destroyStacksWhenBack = this.destroyStacksWhenBack.concat([
        theStackPrepareDestroy,
      ]);
      setTimeout(() => {
        this.setPrevPathname(this.pathname);
        this.setPathname(targetPath);
        const cloneStacks = this.stacks.slice(0, this.stacks.length - 1);
        const lastStack = cloneStacks[cloneStacks.length - 1];
        this.stacks = cloneStacks;
        if (lastStack.title) {
          lastStack.page.setTitle(lastStack.title);
        }
        lastStack.page.emitDestroy();
        if (this.onStacksChange) {
          this.onStacksChange(cloneStacks);
        }
      }, 300);
    });
    document.addEventListener("click", (event) => {
      //       console.log("[DOMAIN]router - listen click event", event);
      let target = event.target;
      if (target instanceof Document) {
        return;
      }
      if (target === null) {
        return;
      }
      let matched = false;
      while (target) {
        const t = target as HTMLElement;
        if (t.tagName === "A") {
          matched = true;
          break;
        }
        target = t.parentNode;
      }
      if (!matched) {
        return;
      }
      const t = target as HTMLElement;
      // console.log("[DOMAIN]router - matched A tag", t);
      const href = t.getAttribute("href");
      if (!href) {
        return;
      }
      if (!href.startsWith("/")) {
        return;
      }
      if (href.startsWith("http")) {
        return;
      }
      event.preventDefault();
      this.push(href);
    });
  }
  /** 获取路由信息 */
  getLocation() {
    return window.location;
  }
}
type PullToRefreshStep = "pending" | "pulling" | "refreshing" | "releasing";
export class Page extends Domain<{
  scrollTop: number;
  yDistance: number;
  state: PullToRefreshStep;
}> {
  /** 页面尺寸信息 */
  client: {
    /** 页面宽度 */
    width: number;
    /** 页面高度 */
    height: number;
    /** 在 y 轴方向滚动的距离 */
    scrollTop: number;
    /** 内容高度 */
    contentHeight: number;
  } = {
    width: 0,
    height: 0,
    scrollTop: 0,
    contentHeight: 0,
  };
  /** 下拉刷新相关的状态信息 */
  pullToRefresh: {
    state: PullToRefreshStep;
    /** 开始拖动的起点 y */
    pullStartY: number;
    /** 拖动过程中的 y */
    pullMoveY: number;
    /** 拖动过程 y 方向上移动的距离 */
    dist: number;
    /** 实际移动的距离？ */
    distResisted: number;
  } = {
    state: "pending",
    pullStartY: 0,
    pullMoveY: 0,
    dist: 0,
    distResisted: 0,
  };

  /** 设置页面标题 */
  setTitle(title: string) {
    document.title = title;
  }
  /** PullToRefresh 相关逻辑 */
  handleTouchStart(pos: { x: number; y: number }) {
    const { x, y } = pos;
    const { state } = this.pullToRefresh;
    // 手指在边缘时可能是滑动切换页面
    if (x < 30) {
      return;
    }
    if (state !== "pending") {
      return;
    }
    if (this.client.scrollTop) {
      return;
    }
    this.pullToRefresh.pullStartY = y;
  }
  /** 移动 */
  handleTouchMove(
    pos: { x: number; y: number },
    lifetimes: Partial<{
      onCanPull: () => void;
    }> = {}
  ) {
    const { onCanPull } = lifetimes;
    const { x: curX, y: curY } = pos;
    const { pullStartY } = this.pullToRefresh;
    if (this.pullToRefresh.state === "refreshing") {
      return;
    }
    this.pullToRefresh.pullMoveY = curY;
    if (this.pullToRefresh.state === "pending") {
      this.pullToRefresh.state = "pulling";
    }
    if (pullStartY && curY) {
      this.pullToRefresh.dist = curY - pullStartY;
    }
    if (this.pullToRefresh.dist <= 0) {
      return;
    }
    // console.log(this.pullToRefresh.dist);
    if (onCanPull) {
      onCanPull();
    }
    const distThreshold = 60;
    const distMax = 80;
    const distResisted =
      resistanceFunction(this.pullToRefresh.dist / distThreshold) *
      Math.min(distMax, this.pullToRefresh.dist);
    this.pullToRefresh.distResisted = distResisted;
    if (
      this.pullToRefresh.state === "pulling" &&
      distResisted > distThreshold
    ) {
      this.pullToRefresh.state = "releasing";
    }
    if (
      this.pullToRefresh.state === "releasing" &&
      distResisted <= distThreshold
    ) {
      this.pullToRefresh.state = "pulling";
    }
    this.values.yDistance = distResisted;
    this.values.state = this.pullToRefresh.state;
    this.emitValuesChange();
  }
  async handleTouchEnd() {
    // console.log(
    //   "[DOMAIN]Page - onTouchEnd",
    //   this.pullToRefresh.state,
    //   this.pullToRefresh.distResisted
    // );
    if (["refreshing"].includes(this.pullToRefresh.state)) {
      return;
    }
    if (["pending", "pulling"].includes(this.pullToRefresh.state)) {
      this.pullToRefresh.pullStartY = 0;
      this.pullToRefresh.pullMoveY = 0;
      this.pullToRefresh.dist = 0;
      this.pullToRefresh.distResisted = 0;
      this.pullToRefresh.state = "pending";
      this.values.yDistance = 0;
      this.values.state = this.pullToRefresh.state;
      this.emitValuesChange();
      return;
    }
    if (
      this.pullToRefresh.state === "releasing" &&
      this.pullToRefresh.distResisted > 60
    ) {
      (async () => {
        // console.log(
        //   "[DOMAIN]Page - prepare invoke refresh listeners",
        //   this.refreshListeners.length
        // );
        for (let i = 0; i < this.refreshListeners.length; i += 1) {
          const listener = this.refreshListeners[i];
          await listener({});
        }
        await sleep(1200);
        this.pullToRefresh.state = "pending";
        this.values.yDistance = 0;
        this.emitValuesChange();
      })();
    }
    this.pullToRefresh.pullStartY = 0;
    this.pullToRefresh.pullMoveY = 0;
    this.pullToRefresh.dist = 60;
    this.pullToRefresh.distResisted = 60;
    this.pullToRefresh.state = "refreshing";
    this.values.yDistance = 60;
    this.values.state = this.pullToRefresh.state;
    this.emitValuesChange();
  }
  onTouchCancel() {}

  /** 一些可能要抛出的事件 */
  readyListeners: Listener<{}>[] = [];
  emitReady() {
    for (let i = 0; i < this.readyListeners.length; i += 1) {
      const listener = this.readyListeners[i];
      listener({});
    }
  }
  /** 页面准备完毕事件 */
  onReady(listener: Listener<{}>) {
    this.readyListeners.push(listener);
  }
  refreshListeners: Listener<{}>[] = [];
  onPullToRefresh(refreshListener: Listener<{}>) {
    this.refreshListeners.push(refreshListener);
  }
  /** 页面滚动时调用 */
  emitPageScroll(event: { scrollTop: number }) {
    const { scrollTop } = event;
    for (let i = 0; i < this.pageScrollListeners.length; i += 1) {
      const listener = this.pageScrollListeners[i];
      listener({ scrollTop });
    }
    if (scrollTop + this.client.height + 120 >= this.client.contentHeight) {
      this.emitReachBottom();
    }
    this.client.scrollTop = scrollTop;
    this.values.scrollTop = scrollTop;
    this.emitValuesChange();
  }
  pageScrollListeners: Listener<{}>[] = [];
  onPageScroll(pageScrollListener: Listener<{}>) {
    this.pageScrollListeners.push(pageScrollListener);
  }
  /** 触底事件 Start */
  reachBottomListeners: Listener<{}>[] = [];
  emitReachBottom = debounce(400, () => {
    for (let i = 0; i < this.reachBottomListeners.length; i += 1) {
      const listener = this.reachBottomListeners[i];
      listener({});
    }
  });
  /** 监听页面滚动到底部时的回调 */
  onReachBottom(reachBottomListener: Listener<{}>) {
    this.reachBottomListeners.push(reachBottomListener);
  }
  /** 页面隐藏事件 Start */
  hiddenListener: Listener<{}>[] = [];
  emitHidden() {
    for (let i = 0; i < this.hiddenListener.length; i += 1) {
      const listener = this.hiddenListener[i];
      listener({});
    }
  }
  /** 监听页面隐藏 */
  onHidden(listener: Listener<{}>) {
    this.hiddenListener.push(listener);
  }
  /** 页面销毁事件 Start */
  destroyListeners: Listener<{}>[] = [];
  emitDestroy() {
    for (let i = 0; i < this.destroyListeners.length; i += 1) {
      const listener = this.destroyListeners[i];
      listener({});
    }
  }
  /** 监听页面销毁 */
  onDestroy(listener: Listener<{}>) {
    this.destroyListeners.push(listener);
  }
}
