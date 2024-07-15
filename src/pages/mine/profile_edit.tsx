/**
 * @file 个人信息编辑
 */
import React from "react";
import { ArrowLeft, ChevronRight, Copy } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Dialog, ScrollView, Input } from "@/components/ui";
import { useInstance } from "@/hooks/index";
import { DialogCore, ScrollViewCore, InputCore } from "@/domains/ui";

function Page(props: ViewComponentProps) {
  const { app, client, history } = props;
  const $scroll = new ScrollViewCore({
    os: app.env,
  });
  const $email = new InputCore({
    defaultValue: "",
    placeholder: "请输入邮箱",
    autoFocus: true,
  });
  const $emailDialog = new DialogCore({
    title: "修改邮箱",
    async onOk() {
      const email = $email.value;
      if (!email) {
        app.tip({
          text: ["请输入邮箱"],
        });
        return;
      }
      $emailDialog.okBtn.setLoading(true);
      const r = await app.$user.updateEmail({ email });
      $emailDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["更新邮箱成功"],
      });
      $email.clear();
      $emailDialog.hide();
    },
  });
  const $pwd = new InputCore({
    defaultValue: "",
    placeholder: "请输入密码",
    type: "password",
    autoComplete: false,
    autoFocus: true,
  });
  const $pwdDialog = new DialogCore({
    title: "修改密码",
    async onOk() {
      const pwd = $pwd.value;
      if (!pwd) {
        app.tip({
          text: ["请输入密码"],
        });
        return;
      }
      $pwdDialog.okBtn.setLoading(true);
      const r = await app.$user.updatePwd({ pwd });
      $pwdDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      $pwd.clear();
      $pwdDialog.hide();
      app.tip({
        text: ["更新成功，请重新登录"],
      });
      history.push("root.login");
    },
  });

  return {
    ui: {
      $email,
      $pwd,
      $scroll,
      $emailDialog,
      $pwdDialog,
    },
  };
}

export const PersonProfileEditPage: ViewComponent = React.memo((props) => {
  const { app, history, storage, client, view } = props;

  const $page = useInstance(() => Page(props));

  return (
    <>
      <ScrollView store={$page.ui.$scroll} className="min-h-screen bg-w-bg-0">
        <div className="w-full h-full">
          <div className="">
            <div className="flex items-center">
              <div
                className="inline-block p-4"
                onTouchEnd={() => {
                  history.back();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-[1px] transform scale-y-50 bg-w-fg-3" />
            <div
              className="flex items-center justify-between p-4 bg-w-bg-1"
              onClick={() => {
                if (!app.$user.id) {
                  app.tip({
                    text: ["异常"],
                  });
                  return;
                }
                app.copy(app.$user.id);
                app.tip({
                  text: ["复制成功"],
                });
              }}
            >
              <div>ID</div>
              <div className="flex items-center text-w-fg-1">
                <div className="">{app.$user.id}</div>
                <div className="ml-2 mr-2">
                  <Copy className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="w-full h-[1px] transform scale-y-50 bg-w-fg-3" />
            <div
              className="flex items-center justify-between p-4 bg-w-bg-1"
              onClick={() => {
                $page.ui.$emailDialog.show();
              }}
            >
              <div>邮箱</div>
              <div className="flex items-center text-w-fg-1">
                <div className="">
                  {(() => {
                    if (app.$user.email) {
                      return app.$user.email;
                    }
                    return "设置邮箱";
                  })()}
                </div>
                <div>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="w-full h-[1px] transform scale-y-50 bg-w-fg-3" />
            <div
              className="flex items-center justify-between p-4 bg-w-bg-1"
              onClick={() => {
                $page.ui.$pwdDialog.show();
              }}
            >
              <div>密码</div>
              <div className="flex items-center text-w-fg-1">
                <div className="">修改</div>
                <div>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
      <Dialog store={$page.ui.$emailDialog}>
        <Input store={$page.ui.$email} />
      </Dialog>
      <Dialog store={$page.ui.$pwdDialog}>
        <Input store={$page.ui.$pwd} />
      </Dialog>
    </>
  );
});
