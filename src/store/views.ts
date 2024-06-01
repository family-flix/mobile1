/**
 * @file 所有的页面
 */
/** 首页 */
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { HomeMessagePage } from "@/pages/home/message";
import { HomeRecommendedTabContent } from "@/pages/home-tabs/recommended";
import { HomeSeasonTabContent } from "@/pages/home-tabs/season";
import { HomeMovieTabContent } from "@/pages/home-tabs/movie";
import { HomeHistoryTabContent } from "@/pages/home-tabs/history";
import { UserCenterPage } from "@/pages/home/mine";
import { MediaSearchPage } from "@/pages/search";
import { SeasonPlayingPageV2 } from "@/pages/season/play";
import { MoviePlayingPageV2 } from "@/pages/movie/play";
import { NotFoundPage } from "@/pages/not-found";
import { InviteeListPage } from "@/pages/invitee";
// import { MediaSharePage } from "@/pages/invitee/share";
import { TVChannelPlayingPage } from "@/pages/live/play";
import { TestPage } from "@/pages/test";
import { UpdatedHistoryListPage } from "@/pages/updated-history";
import { LoginPage } from "@/pages/login";
import { PersonProfileEditPage } from "@/pages/mine/profile_edit";
import { HelpCenterHomePage } from "@/pages/help";
import { QRCodeLoginConfirmPage } from "@/pages/scan";
import { InvitationCodeListPage } from "@/pages/code/list";
import { RegisterPage } from "@/pages/register";

import { PageKeys } from "./routes";
import { ViewComponent, ViewComponentWithMenu } from "./types";

export const pages: Omit<Record<PageKeys, ViewComponent | ViewComponentWithMenu>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.home_index": HomeIndexPage,
  "root.home_layout.home_index.home_index_recommended": HomeRecommendedTabContent,
  "root.home_layout.home_index.home_index_history": HomeHistoryTabContent,
  "root.home_layout.home_index.home_index_movie": HomeMovieTabContent,
  "root.home_layout.home_index.home_index_season": HomeSeasonTabContent,
  "root.mine": UserCenterPage,
  "root.update_mine_profile": PersonProfileEditPage,
  "root.history_updated": UpdatedHistoryListPage,
  "root.search": MediaSearchPage,
  "root.messages": HomeMessagePage,
  "root.invitee": InviteeListPage,
  "root.season_playing": SeasonPlayingPageV2,
  "root.movie_playing": MoviePlayingPageV2,
  "root.invitation_code": InvitationCodeListPage,
  "root.help": HelpCenterHomePage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.scan": QRCodeLoginConfirmPage,
  "root.test": TestPage,
  "root.notfound": NotFoundPage,
};
