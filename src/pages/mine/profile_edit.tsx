/**
 * @file 个人信息编辑
 */
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { infoRequest, messageList } from "@/store/index";
import { inviteMember, reportSomething } from "@/services";
import { getSystemTheme, useTheme } from "@/components/theme-switch";
import { Button, Dialog, ScrollView, LazyImage, Input } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, ImageCore } from "@/domains/ui";
import { RequestCoreV2 } from "@/domains/request/v2";
import { MultipleClickCore } from "@/domains/utils/multiple_click";
import { ReportTypes, __VERSION__ } from "@/constants";
import { useInitialize, useInstance } from "@/hooks/index";

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
    });
    this.$login = new ButtonCore({
      onClick: async () => {
        const values = {
          email: this.$username.value,
          pwd: this.$password.value,
        };
        this.$login.setLoading(true);
        const r = await app.$user.updateAccount(values);
        this.$login.setLoading(false);
        if (r.error) {
          app.tip({
            text: ["更新失败", r.error.message],
          });
          return;
        }
        app.tip({
          text: ["更新成功"],
        });
      },
    });
  }
}

export const PersonProfileEditPage: ViewComponent = React.memo((props) => {
  const { app, history, storage, client, view } = props;

  const $logic = useInstance(() => new PageLogic({ app, history, client }));
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        // async onPullToRefresh() {
        //   await sleep(2000);
        //   scrollView.stopPullToRefresh();
        // },
      })
  );

  const { theme, setTheme } = useTheme();
  const [t, setT] = useState(theme);
  const [profile, setProfile] = useState(app.$user);
  const [loading, setLoading] = useState(infoRequest.loading);
  const [messageResponse, setMessageResponse] = useState(messageList.response);
  // const [history_response] = useState(history_helper.response);

  useInitialize(() => {});

  console.log("[PAGE]mine/profile_edit - render", theme, t);

  return (
    <>
      <ScrollView store={scrollView} className="bg-w-bg-0" contentClassName="h-full">
        <div className="w-full h-full">
          <div className="">
            <div className="flex items-center">
              <div
                className="inline-block p-4"
                onClick={() => {
                  history.back();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 space-y-4">
            <div>
              <div>邮箱</div>
              <Input store={$logic.$username} />
            </div>
            <div>
              <div>密码</div>
              <Input store={$logic.$password} />
            </div>
            <div className="w-full mt-4">
              <Button store={$logic.$login}>保存</Button>
            </div>
          </div>
        </div>
      </ScrollView>
    </>
  );
});
