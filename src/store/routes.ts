import { PageKeysType, build } from "@/domains/route_view/utils";

/**
 * @file 路由配置
 */
const configure = {
  root: {
    title: "ROOT",
    pathname: "/",
    children: {
      home_layout: {
        title: "首页布局",
        pathname: "/home",
        options: {
          keep_alive: true,
          require: ["login"],
        },
        children: {
          home_index: {
            title: "首页",
            pathname: "/home/index",
            children: {
              home_index_season: {
                title: "电视剧",
                pathname: "/home/index/season",
              },
              home_index_movie: {
                title: "电影",
                pathname: "/home/index/movie",
              },
              home_index_recommended: {
                title: "推荐",
                pathname: "/home/index/recommended",
              },
              home_index_history: {
                title: "播放历史",
                pathname: "/home/index/history",
              },
            },
            options: {
              keep_alive: true,
              require: ["login"],
            },
          },
        },
      },
      season_playing: {
        title: "播放电视剧",
        pathname: "/season_play",
        options: {
          keep_alive: true,
          animation: {
            in: "fade-in",
            out: "fade-out",
          },
          require: ["login"],
        },
      },
      movie_playing: {
        title: "播放电影",
        pathname: "/movie_play",
        options: {
          keep_alive: true,
          animation: {
            in: "fade-in",
            out: "fade-out",
          },
          require: ["login"],
        },
      },
      history_updated: {
        title: "我的",
        pathname: "/home/updated_history",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      search: {
        title: "搜索",
        pathname: "/search",
        options: {
          animation: {
            // in: "fade-in",
            // out: "fade-out",
          },
          require: ["login"],
        },
      },
      invitee: {
        title: "好友",
        pathname: "/invitee",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      messages: {
        title: "消息",
        pathname: "/home/message",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      mine: {
        title: "我的",
        pathname: "/mine/index",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      update_mine_profile: {
        title: "修改邮箱密码",
        pathname: "/mine/patch",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      invitation_code: {
        title: "邀请码",
        pathname: "/code",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
          require: ["login"],
        },
      },
      help: {
        title: "帮助中心",
        pathname: "/help",
        options: {
          keep_alive: true,
          animation: {
            in: "slide-in-from-right",
            out: "slide-out-to-right",
          },
        },
      },
      login: {
        title: "登录",
        pathname: "/login",
        options: {
          keep_alive: true,
        },
      },
      register: {
        title: "注册",
        pathname: "/register",
        options: {
          keep_alive: true,
        },
      },
      scan: {
        title: "登录",
        pathname: "/scan",
        options: {
          keep_alive: true,
          require: ["login"],
        },
      },
      test: {
        title: "测试",
        pathname: "/test",
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
      },
    },
  },
};
export type PageKeys = PageKeysType<typeof configure>;
const result = build<PageKeys>(configure);
export const routes = result.routes;
export const routesWithPathname = result.routesWithPathname;
