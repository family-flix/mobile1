/**
 * @file 进行中的异步任务
 */
import { RouteViewCore, onViewCreated } from "@/domains/route_view";
/** 首页 */
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeSeasonListPage } from "@/pages/home/season";
import { HomeMoviePage } from "@/pages/home/movie";
import { HomeHistoryPage } from "@/pages/home/history";
import { HomeMessagePage } from "@/pages/home/message";
import { HomeRecommendedTabContent } from "@/pages/home-tabs/recommended";
import { HomeSeasonTabContent } from "@/pages/home-tabs/season";
import { HomeMovieTabContent } from "@/pages/home-tabs/movie";
import { HomeHistoryTabContent } from "@/pages/home-tabs/history";
import { HomeMinePage } from "@/pages/home/mine";
/** 搜索 */
import { MediaSearchPage } from "@/pages/search";
/** 视频播放 */
import { TVPlayingPage } from "@/pages/tv/play";
import { SeasonPlayingPageV2 } from "@/pages/tv/play_v2";
import { TVOuterPlayersPage } from "@/pages/tv/outerplayers";
import { MoviePlayingPage } from "@/pages/movie/play";
import { MoviePlayingPageV2 } from "@/pages/movie/play_v2";
import { OuterPlayersPage } from "@/pages/outplayers";
/** 其他 */
import { Test1Page } from "@/pages/test1";
import { NotFoundPage } from "@/pages/not-found";
import { InviteeListPage } from "@/pages/invitee";
import { MediaSharePage } from "@/pages/invitee/share";
import { TVChannelPlayingPage } from "@/pages/live/play";
import { TVLiveListPage } from "@/pages/live/list";
import { TVChannelTestPlayingPage } from "@/pages/live/demo";
import { TestPage } from "@/pages/test";

export const pages: RouteViewCore[] = [];
onViewCreated((created) => {
  if (pages.includes(created)) {
    return;
  }
  pages.push(created);
});
// rootView.curView = mainLayout;
// rootView.appendSubView(mainLayout);
export const homeRecommendedTab = new RouteViewCore({
  key: "/home/index/recommended",
  title: "推荐",
  component: HomeRecommendedTabContent,
});
export const homeSeasonTab = new RouteViewCore({
  key: "/home/index/season",
  title: "电视剧",
  component: HomeSeasonTabContent,
});
export const homeMovieTab = new RouteViewCore({
  key: "/home/index/movie",
  title: "电影",
  component: HomeMovieTabContent,
});
export const homeHistoryTab = new RouteViewCore({
  key: "/home/index/history",
  title: "观看记录",
  component: HomeHistoryTabContent,
});
export const homeIndexPage = new RouteViewCore({
  key: "/home/index",
  title: "首页",
  component: HomeIndexPage,
  children: [homeRecommendedTab, homeSeasonTab, homeMovieTab, homeHistoryTab],
});
// mainLayout.curView = aView;
// mainLayout.appendSubView(aView);
export const homeSeasonPage = new RouteViewCore({
  key: "/home/season",
  title: "电视剧",
  component: HomeSeasonListPage,
});
export const homeMoviePage = new RouteViewCore({
  key: "/home/movie",
  title: "电影",
  component: HomeMoviePage,
});
// export const homeTVSearchPage = new RouteViewCore({
//   key: "/search_tv",
//   title: "搜索电视剧",
//   component: HomeTVSearchPage,
// });
// export const homeMovieSearchPage = new RouteViewCore({
//   key: "/search_movie",
//   title: "搜索电影",
//   component: HomeMovieSearchPage,
// });
export const homeHistoriesPage = new RouteViewCore({
  key: "/home/history",
  title: "观看记录",
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
  children: [homeIndexPage, homeSeasonPage, homeMoviePage, homeHistoriesPage],
});
export const tvPlayingPage = new RouteViewCore({
  key: "/tv_play",
  title: "播放电视剧",
  component: TVPlayingPage,
});
export const seasonPlayingPageV2 = new RouteViewCore({
  key: "/tv_play_v2",
  title: "播放电视剧",
  component: SeasonPlayingPageV2,
});
export const tvOuterPlayerPage = new RouteViewCore({
  key: "/tv/players/:id",
  title: "外部播放器",
  component: TVOuterPlayersPage,
});
export const moviePlayingPage = new RouteViewCore({
  key: "/movie_play",
  title: "播放电影",
  component: MoviePlayingPage,
});
export const moviePlayingPageV2 = new RouteViewCore({
  key: "/movie_play_v2",
  title: "播放电影",
  component: MoviePlayingPageV2,
});
export const inviteeListPage = new RouteViewCore({
  key: "/invitee",
  title: "邀请的好友",
  component: InviteeListPage,
});
export const tvChannelListPage = new RouteViewCore({
  key: "/live",
  title: "电视频道列表",
  component: TVLiveListPage,
});
export const tvChannelPlayingPage = new RouteViewCore({
  key: "/live_playing",
  title: "电视频道",
  component: TVChannelPlayingPage,
});
export const tvChannelTestPlayingPage = new RouteViewCore({
  key: "/live_playing_test",
  title: "电视频道",
  component: TVChannelTestPlayingPage,
});
export const outerPlayerPage = new RouteViewCore({
  key: "/out_players",
  title: "调用外部播放器",
  component: OuterPlayersPage,
});
export const messagesPage = new RouteViewCore({
  key: "/home/message",
  title: "未读消息",
  component: HomeMessagePage,
});
export const mediaSharePage = new RouteViewCore({
  key: "/media_share",
  title: "分享影视频",
  component: MediaSharePage,
});
export const mediaSearchPage = new RouteViewCore({
  key: "/search",
  title: "搜索",
  component: MediaSearchPage,
});
export const testView = new RouteViewCore({
  key: "/test",
  title: "测试",
  component: TestPage,
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
  layers: true,
  children: [
    homeLayout,
    tvPlayingPage,
    seasonPlayingPageV2,
    moviePlayingPage,
    moviePlayingPageV2,
    mediaSearchPage,
    inviteeListPage,
    homeMinePage,
    messagesPage,
    mediaSharePage,
    tvChannelPlayingPage,
    tvChannelTestPlayingPage,
    tvChannelListPage,
    testView,
  ],
});
export function getRootView() {
  return rootView;
}
