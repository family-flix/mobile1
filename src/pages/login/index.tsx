import React from "react";

// import { user } from "@/store/user";
import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Button, Input } from "@/components/ui";
import { ButtonCore, InputCore } from "@/domains/ui";
import { useInstance } from "@/hooks/index";
import { MediaOriginCountry } from "@/constants/index";

class PageLogic {
  $username: InputCore;
  $password: InputCore;
  $login: ButtonCore;

  constructor(props: Pick<ViewComponentProps, "app" | "client" | "history">) {
    const { app, client, history } = props;

    this.$username = new InputCore({
      placeholder: "请输入邮箱",
    });
    this.$password = new InputCore({
      placeholder: "请输入密码",
      type: "password",
      autoComplete: true,
    });
    this.$login = new ButtonCore({
      onClick: async () => {
        const values = {
          email: this.$username.value,
          pwd: this.$password.value,
        };
        this.$login.setLoading(true);
        const r = await app.$user.login(values);
        this.$login.setLoading(false);
        if (r.error) {
          app.tip({
            text: ["登录失败", r.error.message],
          });
          return;
        }
        app.tip({
          text: ["登录成功"],
        });
        history.replace("root.home_layout.home_index.home_index_season", {
          language: MediaOriginCountry.CN,
        });
      },
    });
  }
}

export const LoginPage: ViewComponent = React.memo((props) => {
  const { app, client, history } = props;
  const $logic = useInstance(() => new PageLogic({ app, client, history }));

  return (
    <div className="p-4">
      <div className="relative">
        <div className="z-20 relative text-3xl">FamilyFlix</div>
        <div className="z-10 absolute bottom-[0px] left-[12px] w-[124px] h-[12px] bg-w-brand rounded-md"></div>
      </div>
      <div className="mt-4 py-4 space-y-4 rounded-md">
        <div>
          <div>邮箱</div>
          <Input className="mt-1 bg-w-bg-0" store={$logic.$username} />
        </div>
        <div>
          <div>密码</div>
          <Input className="mt-1 bg-w-bg-0" store={$logic.$password} />
        </div>
      </div>
      <div className="w-full mt-4">
        <Button store={$logic.$login}>登录</Button>
      </div>
    </div>
  );
});
