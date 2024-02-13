/**
 * @file 个人中心页
 */
import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  HelpCircle,
  HelpingHand,
  MailQuestion,
  MessageSquare,
  Moon,
  Pen,
  Settings2,
  Sun,
  Tv,
} from "lucide-react";

// import { client } from "@/store/request";
import { infoRequest, messageList } from "@/store/index";
// import { messagesPage, inviteeListPage } from "@/store/views";
import { inviteMember, reportSomething } from "@/services";
import { getSystemTheme, useTheme } from "@/components/Theme";
import { Button, Dialog, ScrollView, LazyImage, Input } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, ImageCore } from "@/domains/ui";
import { RequestCoreV2 } from "@/domains/request/v2";
import { RequestCore } from "@/domains/request";
import { MultipleClickCore } from "@/domains/utils/multiple_click";
import { ReportTypes, __VERSION__ } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/store/types";

export const HomeMinePage: ViewComponent = React.memo((props) => {
  const { app, history, storage, client, view } = props;

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        // async onPullToRefresh() {
        //   await sleep(2000);
        //   scrollView.stopPullToRefresh();
        // },
      })
  );
  const multipleClick = useInstance(
    () =>
      new MultipleClickCore({
        async onBingo() {
          app.$user.logout();
          const r = await app.$user.validate({
            token: history.$router.query.token,
            force: "1",
          });
          if (r.error) {
            return;
          }
          history.reload();
        },
      })
  );
  const avatar = useInstance(() => new ImageCore(app.$user.avatar));
  const workInProgressTipDialog = useInstance(
    () =>
      new DialogCore({
        footer: false,
      })
  );
  const reportInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入问题",
      })
  );
  const wantInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入想看的电视剧/电影",
      })
  );
  const reportRequest = useInstance(
    () =>
      new RequestCoreV2({
        client: client,
        fetch: reportSomething,
        onLoading(loading) {
          if (reportConfirmDialog.open) {
            reportConfirmDialog.okBtn.setLoading(loading);
          }
          if (wantDialog.open) {
            wantDialog.okBtn.setLoading(loading);
          }
        },
        onSuccess() {
          app.tip({
            text: ["提交成功"],
          });
          if (wantDialog.open) {
            wantDialog.hide();
          }
          if (reportConfirmDialog.open) {
            reportConfirmDialog.hide();
          }
        },
        onFailed(error) {
          app.tip({
            text: ["提交失败", error.message],
          });
        },
      })
  );
  const reportConfirmDialog = useInstance(
    () =>
      new DialogCore({
        title: "问题与建议",
        onOk() {
          if (!reportInput.value) {
            app.tip({
              text: ["请先输入问题"],
            });
            return;
          }
          reportRequest.run({
            type: ReportTypes.Question,
            data: JSON.stringify({
              content: reportInput.value,
            }),
          });
        },
      })
  );
  const wantDialog = useInstance(
    () =>
      new DialogCore({
        title: "想看",
        onOk() {
          if (!wantInput.value) {
            app.tip({
              text: ["请先输入电视剧/电影"],
            });
            return;
          }
          reportRequest.run({
            type: ReportTypes.Want,
            data: wantInput.value,
          });
        },
      })
  );

  // @todo 主题切换这块逻辑移动到 app 领域中
  const { theme, setTheme } = useTheme();
  const [t, setT] = useState(theme);
  const [profile, setProfile] = useState(app.$user);
  const [loading, setLoading] = useState(infoRequest.loading);
  const [messageResponse, setMessageResponse] = useState(messageList.response);
  // const [history_response] = useState(history_helper.response);

  useInitialize(() => {
    infoRequest.run();
    infoRequest.onLoadingChange((v) => {
      setLoading(v);
    });
    messageList.onStateChange((nextState) => {
      setMessageResponse(nextState);
    });
    if (theme !== "system") {
      return;
    }
    const system = getSystemTheme();
    setT(system);
    //     console.log("hello", system);
    //     scrollView.onPullToRefresh(async () => {
    //       await sleep(3000);
    //       scrollView.stopPullToRefresh();
    //     });
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
  });

  console.log("[PAGE]home/mine - render", theme, t);

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
                  app.tip({ text: ["敬请期待"] });
                }}
              >
                <Settings2 className="w-5 h-5" />
              </div>
            </div>
            <div className="relative flex p-4 h-24 rounded-lg bg-w-bg-3">
              <div className="mr-4 w-16 h-16 rounded-full overflow-hidden">
                <LazyImage className="w-full h-full" store={avatar} />
              </div>
              <div className="mt-2 text-xl text-w-fg-0">{profile.id}</div>
              <div></div>
            </div>
            <div className="rounded-lg bg-w-bg-3 text-w-fg-0">
              {/* <div
                className="flex items-center justify-between"
                onClick={() => {
                  app.showView(tvChannelListPage);
                }}
              >
                <div className="flex items-center">
                  <div className="relative p-4">
                    <Tv2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 py-4">
                    <div>电视频道</div>
                  </div>
                </div>
              </div> */}
              <div className="h-[1px] mx-4 bg-w-fg-3 transform scale-y-50"></div>
              <div
                className="flex items-center justify-between"
                onClick={() => {
                  // app.showView(messagesPage);
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
                  app.tip({ text: ["敬请期待"] });
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
                  reportConfirmDialog.show();
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
                  wantDialog.show();
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
                  if (!infoRequest.response) {
                    app.tip({
                      text: ["网络不佳，请刷新后重试"],
                    });
                    return;
                  }
                  if (!infoRequest.response.permissions.includes("001")) {
                    app.tip({
                      text: ["该功能暂未开放"],
                    });
                    return;
                  }
                  // app.showView(inviteeListPage);
                  history.push("root.invitee");
                }}
              >
                <div className="flex items-center">
                  <div className="p-4">
                    <HelpingHand className="w-5 h-5" />
                  </div>
                  <div className="flex-1 py-4">
                    <div>{loading ? "Loading" : "邀请好友"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="py-2 text-center text-sm"
              onClick={() => {
                multipleClick.handleClick();
              }}
            >
              v{__VERSION__}
            </div>
          </div>
          <div className="h-[1px]"></div>
        </div>
      </ScrollView>
      <Dialog store={workInProgressTipDialog}>
        <div className="text-w-fg-1">敬请期待</div>
      </Dialog>
      <Dialog store={reportConfirmDialog}>
        <div className="text-w-fg-1">
          <p>提交你认为存在问题或需要改进的地方</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={reportInput} focus />
          </div>
        </div>
      </Dialog>
      <Dialog store={wantDialog}>
        <div className="text-w-fg-1">
          <p>你可以提交想看的电视剧或电影</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={wantInput} focus />
          </div>
        </div>
      </Dialog>
    </>
  );
});
