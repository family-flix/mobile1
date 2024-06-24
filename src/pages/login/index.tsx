import React, { useEffect } from "react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Button, Input } from "@/components/ui";
import { ButtonCore, InputCore } from "@/domains/ui";
import { useInstance } from "@/hooks/index";
import { MediaOriginCountry } from "@/constants/index";

function Page(props: ViewComponentProps) {
  const { app, view, history } = props;
  const $view = view;
  const $username = new InputCore({
    placeholder: "请输入邮箱",
  });
  const $password = new InputCore({
    placeholder: "请输入密码",
    type: "password",
    autoComplete: true,
    onEnter() {
      $login.click();
    },
  });
  const $login = new ButtonCore({
    async onClick() {
      const values = {
        email: $username.value,
        pwd: $password.value,
      };
      $login.setLoading(true);
      const r = await app.$user.loginWithEmailAndPwd(values);
      $login.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["登录成功"],
      });
      // const { redirect } = view.query as { redirect: PageKeys };
      // if (redirect) {
      //   history.replace(redirect, {});
      //   return;
      // }
      history.replace("root.home_layout.home_index.home_index_season", {
        language: MediaOriginCountry.CN,
      });
      // const route = routesWithPathname[pathname];
      // console.log("[PAGE]login/index", pathname, route, app.$user.isLogin);
    },
  });
  const $register = new ButtonCore({
    onClick() {
      history.push("root.register");
    },
  });
  const $home = new ButtonCore({
    onClick() {
      history.push("root.home_layout.home_index.home_index_season", {
        language: MediaOriginCountry.CN,
      });
    },
  });

  return {
    ui: {
      $username,
      $password,
      $login,
      $register,
      $home,
    },
  };
}

export const LoginPage: ViewComponent = React.memo((props) => {
  const { app, client, view, history } = props;

  const $page = useInstance(() => Page(props));

  return (
    <div className="pt-12 px-4 min-h-screen bg-w-bg-0">
      <div className="h-[160px] mx-auto">
        <div className="relative cursor-pointer">
          <div className="z-10 absolute left-14 top-[32px] w-[82%] h-[32px] rounded-xl bg-green-500"></div>
          <div className="z-20 relative text-6xl text-center italic">FamilyFlix</div>
        </div>
      </div>
      <div className="space-y-4 rounded-md">
        <div>
          <div>邮箱</div>
          <Input className="mt-1 bg-w-bg-0" store={$page.ui.$username} />
        </div>
        <div>
          <div>密码</div>
          <Input className="mt-1 bg-w-bg-0" store={$page.ui.$password} />
        </div>
      </div>
      <div className="w-full mt-8">
        <Button size="lg" store={$page.ui.$login}>
          登录
        </Button>
        <div
          className="mt-1 py-2 text-center text-w-fg-1 cursor-pointer hover:underline"
          onClick={() => {
            history.push("root.register");
          }}
        >
          没有账号，前往注册
        </div>
        {app.$user.isLogin ? (
          <div className="mt-2">
            <Button size="lg" variant="subtle" store={$page.ui.$home}>
              前往首页
            </Button>
            <div className="mt-1 text-sm text-w-fg-2 text-center">检测到当前已登录</div>
          </div>
        ) : null}
      </div>
    </div>
  );
});
