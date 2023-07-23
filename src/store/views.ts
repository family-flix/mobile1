import { RouteViewCore } from "@/domains/route_view";
/** 首页 */
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeMoviePage } from "@/pages/home/movie";
import { HomeHistoryPage } from "@/pages/home/history";
import { HomeSearchPage } from "@/pages/home/search";
import { HomeMyPage } from "@/pages/home/my";
/** 视频播放 */
import { TVPlayingPage } from "@/pages/play";
import { MoviePlayingPage } from "@/pages/movie/play";
import { OuterPlayersPage } from "@/pages/outplayers";
/** 其他 */
import { Test1Page } from "@/pages/test1";
import { NotFoundPage } from "@/pages/not-found";

RouteViewCore.prefix = "/mobile";

export const rootView = new RouteViewCore({
  title: "ROOT",
  component: "div",
  keepAlive: true,
});
export const homeLayout = new RouteViewCore({
  title: "首页",
  component: HomeLayout,
  keepAlive: true,
});
// rootView.curView = mainLayout;
// rootView.appendSubView(mainLayout);
export const homeIndexPage = new RouteViewCore({
  title: "首页",
  component: HomeIndexPage,
});
// mainLayout.curView = aView;
// mainLayout.appendSubView(aView);
export const homeMoviePage = new RouteViewCore({
  title: "电影",
  component: HomeMoviePage,
});
export const homeSearchPage = new RouteViewCore({
  title: "搜索",
  component: HomeSearchPage,
});
export const cView = new RouteViewCore({
  title: "播放历史",
  component: HomeHistoryPage,
});
export const homeMyPage = new RouteViewCore({
  title: "我的",
  component: HomeMyPage,
});
export const authLayoutView = new RouteViewCore({
  title: "EmptyLayout",
  component: Test1Page,
});
export const tvPlayingPage = new RouteViewCore({
  title: "加载中...",
  component: TVPlayingPage,
});
export const moviePlayingPage = new RouteViewCore({
  title: "加载中...",
  component: MoviePlayingPage,
});
export const outerPlayerPage = new RouteViewCore({
  title: "加载中...",
  component: OuterPlayersPage,
});
export const testView = new RouteViewCore({
  title: "测试",
  component: Test1Page,
});
export const notFoundView = new RouteViewCore({
  title: "页面没有找到",
  component: NotFoundPage,
});
