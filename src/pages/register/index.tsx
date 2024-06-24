import React, { useEffect, useState } from "react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { useInstance } from "@/hooks/index";
import { Button, Input } from "@/components/ui";
import { ButtonCore, InputCore } from "@/domains/ui";
import { MediaOriginCountry } from "@/constants/index";

function Page(props: ViewComponentProps) {
  const { app, view, history, client } = props;

  const $view = view;
  const $username = new InputCore({
    placeholder: "请输入邮箱",
  });
  const $password = new InputCore({
    placeholder: "请输入密码",
    type: "password",
    autoComplete: false,
    onEnter() {
      $register.click();
    },
  });
  const $code = new InputCore({
    placeholder: "没有则不用输入",
    autoComplete: true,
    onEnter() {
      $register.click();
    },
  });
  const $register = new ButtonCore({
    async onClick() {
      const values = {
        email: $username.value,
        pwd: $password.value,
        code: $code.value,
      };
      $register.setLoading(true);
      const r = await app.$user.register(values);
      $register.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["注册成功"],
      });
      history.replace("root.home_layout.home_index.home_index_season", {
        language: MediaOriginCountry.CN,
      });
    },
  });
  const $login = new ButtonCore({
    onClick() {
      history.push("root.login");
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
      $code,
      $register,
      $login,
      $home,
    },
  };
}

export const RegisterPage: ViewComponent = React.memo((props) => {
  const { app, client, view, history } = props;

  const $page = useInstance(() => Page(props));

  return (
    <div className="pt-12 min-h-screen px-4 bg-w-bg-0">
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
        <div>
          <div>邀请码</div>
          <Input className="mt-1 bg-w-bg-0" store={$page.ui.$code} />
        </div>
      </div>
      <div className="w-full mt-4">
        <Button size="lg" store={$page.ui.$register}>
          注册
        </Button>
        <div
          className="mt-1 py-2 text-center text-w-fg-1 cursor-pointer hover:underline"
          onClick={() => {
            history.push("root.login");
          }}
        >
          已有账号，前往登录
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
