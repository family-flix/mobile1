/**
 * @file 个人中心页
 */
import React, { useState } from "react";
import {
  ArrowLeft,
  HelpCircle,
  HelpingHand,
  Loader,
  MailQuestion,
  MessageSquare,
  Moon,
  Pen,
  Settings2,
  Sun,
  Tv,
} from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { messageList } from "@/store/index";
import { reportSomething } from "@/services/index";
import { useInitialize, useInstance } from "@/hooks/index";
import { getSystemTheme, useTheme } from "@/components/theme-switch";
import { Button, Dialog, ScrollView, LazyImage, Input } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, ImageCore } from "@/domains/ui";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ReportTypes, __VERSION__ } from "@/constants/index";

function Page(props: ViewComponentProps) {
  const { app, client } = props;

  const $requireRequest = new RequestCoreV2({
    client,
    fetch: reportSomething,
    onLoading(loading) {
      if ($reportDialog.open) {
        $reportDialog.okBtn.setLoading(loading);
      }
      if ($reportDialog.open) {
        $reportDialog.okBtn.setLoading(loading);
      }
    },
    onSuccess() {
      app.tip({
        text: ["提交成功"],
      });
      if ($reportDialog.open) {
        $reportDialog.hide();
      }
      if ($requireDialog.open) {
        $requireDialog.hide();
      }
    },
    onFailed(error) {
      app.tip({
        text: ["提交失败", error.message],
      });
    },
  });
  const $scroll = new ScrollViewCore({
    os: app.env,
    needHideIndicator: true,
  });
  const $avatar = new ImageCore(app.$user.avatar);
  const $tip = new DialogCore({
    footer: false,
  });
  const $reportInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入问题",
    autoFocus: true,
  });
  const $reportDialog = new DialogCore({
    title: "问题与建议",
    onOk() {
      if (!$reportInput.value) {
        app.tip({
          text: ["请先输入问题"],
        });
        return;
      }
      $requireRequest.run({
        type: ReportTypes.Question,
        data: JSON.stringify({
          content: $reportInput.value,
        }),
      });
    },
  });
  const $requireInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入想看的电视剧/电影",
    autoFocus: true,
  });
  const $requireDialog = new DialogCore({
    title: "想看",
    onOk() {
      if (!$requireInput.value) {
        app.tip({
          text: ["请先输入电视剧/电影"],
        });
        return;
      }
      $requireRequest.run({
        type: ReportTypes.Want,
        data: $reportInput.value,
      });
    },
  });
  const $logout = new ButtonCore({
    onClick() {
      app.$user.logout();
    },
  });

  return {
    // $info,
    ui: {
      $scroll,
      $avatar,
      $tip,
      $reportDialog,
      $reportInput,
      $requireDialog,
      $requireInput,
      $logout,
    },
    ready() {
      app.$user.fetchProfile();
    },
  };
}

export const UserCenterPage: ViewComponent = React.memo((props) => {
  const { app, history, storage, client, view } = props;

  const $page = useInstance(() => Page(props));

  // @todo 主题切换这块逻辑移动到 app 领域中
  const { theme, setTheme } = useTheme();
  const [t, setT] = useState(theme);
  const [profile, setProfile] = useState(app.$user.state);
  const [loading, setLoading] = useState(app.$user.$profile.loading);
  const [messageResponse, setMessageResponse] = useState(messageList.response);

  useInitialize(() => {
    app.$user.$profile.onLoadingChange((v) => setLoading(v));
    messageList.onStateChange((v) => setMessageResponse(v));
    (() => {
      if (theme !== "system") {
        return;
      }
      const system = getSystemTheme();
      setT(system);
    })();
    $page.ready();
  });

  return (
    <>
      <ScrollView store={$page.ui.$scroll} className="w-screen h-screen bg-w-bg-0">
        <div className="w-full h-full">
          <div
            className=""
            onClick={() => {
              history.back();
            }}
          >
            <div className="flex items-center">
              <div className="inline-block m-4">
                <ArrowLeft className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="relative px-4 py-2 space-y-2 text-w-fg-1">
            <div className="py-1 flex space-x-2">
              <div
                className="p-2 rounded bg-w-bg-3"
                onClick={() => {
                  const nextTheme = (() => {
                    if (t === "light") {
                      return "dark";
                    }
                    return "light";
                  })();
                  setT(nextTheme);
                  setTheme(nextTheme);
                }}
              >
                {(() => {
                  if (t === "light") {
                    return <Sun className="w-5 h-5" />;
                  }
                  return <Moon className="w-5 h-5" />;
                })()}
              </div>
              <div
                className="p-2 rounded bg-w-bg-3"
                onClick={() => {
                  history.push("root.update_mine_profile");
                }}
              >
                <Settings2 className="w-5 h-5" />
              </div>
            </div>
            <div
              className="relative flex p-4 h-24 rounded-lg bg-w-bg-3"
              onClick={() => {
                history.push("root.update_mine_profile");
              }}
            >
              <div className="mr-4 w-16 h-16 rounded-full overflow-hidden">
                <LazyImage className="w-full h-full" store={$page.ui.$avatar} />
              </div>
              <div className="mt-2 flex-1 w-0">
                <div className="w-full text-xl break-all truncate text-ellipsis text-w-fg-0">
                  {profile.email || profile.id}
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-w-bg-3 text-w-fg-0">
              <div
                className="flex items-center justify-between"
                onClick={() => {
                  history.push("root.messages");
                }}
              >
                <div className="flex items-center">
                  <div className="relative p-4">
                    <MessageSquare className="w-5 h-5" />
                    <Show when={!!messageResponse.total}>
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-w-red" />
                    </Show>
                  </div>
                  <div className="flex-1 py-4">
                    <div>消息</div>
                  </div>
                </div>
              </div>
              <div className="h-[1px] mx-4 bg-w-fg-3 transform scale-y-50"></div>
              <div
                className=""
                onClick={() => {
                  history.push("root.help");
                }}
              >
                <div className="flex items-center">
                  <div className="p-4">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 py-4">
                    <div>帮助中心</div>
                  </div>
                </div>
              </div>
              <div className="h-[1px] mx-4 bg-w-fg-3 transform scale-y-50"></div>
              <div
                className=""
                onClick={() => {
                  $page.ui.$reportDialog.show();
                }}
              >
                <div className="flex items-center">
                  <div className="p-4">
                    <MailQuestion className="w-5 h-5" />
                  </div>
                  <div className="flex-1 py-4">
                    <div>问题反馈</div>
                  </div>
                </div>
              </div>
              <div className="h-[1px] mx-4 bg-w-fg-3 transform scale-y-50"></div>
              <div
                className=""
                onClick={() => {
                  $page.ui.$requireDialog.show();
                }}
              >
                <div className="flex items-center">
                  <div className="p-4">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div className="flex-1 py-4">
                    <div>想看</div>
                  </div>
                </div>
              </div>
              <div className="h-[1px] mx-4 bg-w-fg-3 transform scale-y-50"></div>
              <div
                className="relative"
                onClick={() => {
                  if (!app.$user.hasPermission("001")) {
                    app.tip({
                      text: ["暂无权限"],
                    });
                    return;
                  }
                  history.push("root.invitee");
                }}
              >
                <div className="flex items-center">
                  <div className="p-4">
                    {loading ? <Loader className="w-5 h-5" /> : <HelpingHand className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 py-4">
                    <div>邀请好友</div>
                  </div>
                </div>
              </div>
            </div>
            <Button size="lg" variant="subtle" store={$page.ui.$logout}>
              退出登录
            </Button>
            <div className="py-2 text-center text-sm">v{__VERSION__}</div>
          </div>
          <div className="h-[1px]"></div>
        </div>
      </ScrollView>
      <Dialog store={$page.ui.$tip}>
        <div className="text-w-fg-1">敬请期待</div>
      </Dialog>
      <Dialog store={$page.ui.$reportDialog}>
        <div className="text-w-fg-1">
          <p>提交你认为存在问题或需要改进的地方</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={$page.ui.$reportInput} />
          </div>
        </div>
      </Dialog>
      <Dialog store={$page.ui.$requireDialog}>
        <div className="text-w-fg-1">
          <p>你可以提交想看的电视剧或电影</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={$page.ui.$requireInput} />
          </div>
        </div>
      </Dialog>
    </>
  );
});
