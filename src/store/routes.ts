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
      live: {
        title: "电视频道",
        pathname: "/live",
      },
      search: {
        title: "搜索",
        pathname: "/search",
        options: {
          animation: {
            // in: "fade-in",
            out: "fade-out",
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
type PageKeysType<T extends OriginalRouteConfigure, K = keyof T> = K extends keyof T & (string | number)
  ?
      | `${K}`
      | (T[K] extends object
          ? T[K]["children"] extends object
            ? `${K}.${PageKeysType<T[K]["children"]>}`
            : never
          : never)
  : never;
export type PathnameKey = string;
export type PageKeys = PageKeysType<typeof configure>;
export type RouteConfig = {
  /** 使用该值定位唯一 route/page */
  name: PageKeys;
  title: string;
  pathname: PathnameKey;
  /** 是否为布局 */
  layout?: boolean;
  parent: {
    name: string;
  };
  options?: Partial<{
    require?: string[];
    keep_alive?: boolean;
    animation?: {
      in: string;
      out: string;
      show: string;
      hide: string;
    };
  }>;
  // component: unknown;
};
type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    title: string;
    pathname: string;
    options?: Partial<{
      keep_alive?: boolean;
      animation?: Partial<{
        in: string;
        out: string;
        show: string;
        hide: string;
      }>;
      require?: string[];
    }>;
    children?: OriginalRouteConfigure;
  }
>;
function apply(
  configure: OriginalRouteConfigure,
  parent: {
    pathname: PathnameKey;
    name: string;
  }
): RouteConfig[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { title, pathname, options, children } = config;
    // 一个 hack 操作，过滤掉 root
    const name = [parent.name, key].filter(Boolean).join(".") as PageKeys;
    if (children) {
      const subRoutes = apply(children, {
        name,
        pathname,
      });
      return [
        {
          title,
          name,
          pathname,
          options,
          layout: true,
          parent: {
            name: parent.name,
          },
        },
        ...subRoutes,
      ] as RouteConfig[];
    }
    return [
      {
        title,
        name,
        pathname,
        options,
        parent: {
          name: parent.name,
        },
      },
    ] as RouteConfig[];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}
const configs = apply(configure, {
  name: "",
  pathname: "/",
});
export const routes: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.name]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
export const routesWithPathname: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.pathname]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
// @ts-ignore
window.__routes__ = routes;
// @ts-ignore
window.__routes2__ = routesWithPathname;
