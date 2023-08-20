/**
 * @file 进行中的异步任务
 */
import { RouteViewCore, onViewCreated } from "@/domains/route_view";
/** 首页 */
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeMoviePage } from "@/pages/home/movie";
import { HomeHistoryPage } from "@/pages/home/history";
import { HomeTVSearchPage } from "@/pages/home/search/tv";
import { HomeMovieSearchPage } from "@/pages/home/search/movie";
import { HomeMinePage } from "@/pages/home/mine";
/** 视频播放 */
import { TVPlayingPage } from "@/pages/tv/play";
import { MoviePlayingPage } from "@/pages/movie/play";
import { OuterPlayersPage } from "@/pages/outplayers";
/** 其他 */
import { Test1Page } from "@/pages/test1";
import { NotFoundPage } from "@/pages/not-found";

export const pages: RouteViewCore[] = [];
onViewCreated((created) => {
  if (pages.includes(created)) {
    return;
  }
  pages.push(created);
});
// rootView.curView = mainLayout;
// rootView.appendSubView(mainLayout);
export const homeIndexPage = new RouteViewCore({
  key: "/home/index",
  title: "首页",
  component: HomeIndexPage,
});
// mainLayout.curView = aView;
// mainLayout.appendSubView(aView);
export const homeMoviePage = new RouteViewCore({
  key: "/home/movie",
  title: "电影",
  component: HomeMoviePage,
});
export const homeTVSearchPage = new RouteViewCore({
  key: "/search_tv",
  title: "搜索电视剧",
  component: HomeTVSearchPage,
});
export const homeMovieSearchPage = new RouteViewCore({
  key: "/search_movie",
  title: "搜索电影",
  component: HomeMovieSearchPage,
});
export const homeHistoriesPage = new RouteViewCore({
  key: "/home/history",
  title: "播放历史",
  component: HomeHistoryPage,
});
export const homeMinePage = new RouteViewCore({
  key: "/home/mine",
  title: "我的",
  component: HomeMinePage,
});
export const homeLayout = new RouteViewCore({
  key: "/home",
  title: "首页",
  component: HomeLayout,
});
export const tvPlayingPage = new RouteViewCore({
  key: "/tv/play/:id",
  title: "播放电视剧",
  component: TVPlayingPage,
});
export const moviePlayingPage = new RouteViewCore({
  key: "/movie/play/:id",
  title: "播放电影",
  component: MoviePlayingPage,
});
export const outerPlayerPage = new RouteViewCore({
  key: "/out_players",
  title: "调用外部播放器",
  component: OuterPlayersPage,
});
export const testView = new RouteViewCore({
  key: "/test",
  title: "测试",
  component: Test1Page,
});
export const notFoundView = new RouteViewCore({
  key: "/not_found",
  title: "页面没有找到",
  component: NotFoundPage,
});
export const rootView = new RouteViewCore({
  key: "/",
  title: "ROOT",
  component: "div",
});
export function getRootView() {
  return rootView;
}
