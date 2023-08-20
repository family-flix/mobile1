/**
 * @file 个人中心页
 */
import React, { useState } from "react";
import { HelpCircle, HelpingHand, MailQuestion, Moon, Settings2, Sun, Tv } from "lucide-react";

import { reportSomething } from "@/services";
import { getSystemTheme, useTheme } from "@/components/Theme";
import { Button, Dialog, ScrollView, LazyImage, Input } from "@/components/ui";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { ReportTypes } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { sleep } from "@/utils";

export const HomeMinePage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        async onPullToRefresh() {
          await sleep(2000);
          scrollView.stopPullToRefresh();
        },
      })
  );
  const logoutBtn = useInstance(
    () =>
      new ButtonCore({
        async onClick() {
          const r = await app.user.validate(router.query.token, "1");
          if (r.error) {
            return;
          }
          router.reload();
        },
      })
  );
  const dialog = useInstance(
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
      new RequestCore(reportSomething, {
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
            data: JSON.stringify({
              content: wantInput.value,
            }),
          });
        },
      })
  );

  // @todo 主题切换这块逻辑移动到 app 领域中
  const { theme, setTheme } = useTheme();
  const [t, setT] = useState(theme);
  const [profile, setProfile] = useState(app.user);
  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
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
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="relative p-4 space-y-4">
          <div className="py-1 px-4 flex flex-row-reverse">
            <div
              className="self-end"
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
              className="mr-4"
              onClick={() => {
                app.tip({ text: ["敬请期待"] });
                // dialog.show();
              }}
            >
              <Settings2 className="w-5 h-5" />
            </div>
          </div>
          <div className="relative flex p-4 h-24 rounded-lg">
            <LazyImage className="mr-4 w-16 h-16 rounded-full" src={profile.avatar} />
            <div className="mt-2 text-xl">{profile.id}</div>
            <div></div>
          </div>
          <div className="border-b-2 dark:border-black-900"></div>
          <div className="rounded-lg">
            <div
              className=""
              onClick={() => {
                app.tip({ text: ["敬请期待"] });
              }}
            >
              <div className="flex">
                <div className="w-5 p-4 mr-4">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 py-4 mr-4">
                  <div>帮助中心</div>
                </div>
              </div>
            </div>
            <div
              className=""
              onClick={() => {
                // app.tip({ text: ["敬请期待"] });
                reportConfirmDialog.show();
              }}
            >
              <div className="flex">
                <div className="w-5 p-4 mr-4">
                  <MailQuestion className="w-5 h-5" />
                </div>
                <div className="flex-1 py-4 mr-4">
                  <div>问题反馈</div>
                </div>
              </div>
            </div>
            <div
              className=""
              onClick={() => {
                // app.tip({ text: ["敬请期待"] });
                wantDialog.show();
              }}
            >
              <div className="flex">
                <div className="w-5 p-4 mr-4">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="flex-1 py-4 mr-4">
                  <div>想看</div>
                </div>
              </div>
            </div>
            <div
              className=""
              onClick={() => {
                app.tip({ text: ["敬请期待"] });
                // dialog.show();
              }}
            >
              <div className="flex">
                <div className="w-5 p-4 mr-4">
                  <HelpingHand className="w-5 h-5" />
                </div>
                <div className="flex-1 py-4 mr-4">
                  <div>邀请好友</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Button className="w-full py-3 text-lg bg-red-600" size="lg" store={logoutBtn}>
              退出登录
            </Button>
          </div>
          <div className="text-center text-sm">V1.7.1</div>
        </div>
      </ScrollView>
      <Dialog store={dialog}>
        <div>敬请期待</div>
      </Dialog>
      <Dialog store={reportConfirmDialog}>
        <p>提交你认为存在问题或需要改进的地方</p>
        <div className="mt-4">
          <Input store={reportInput} />
        </div>
      </Dialog>
      <Dialog store={wantDialog}>
        <p>你可以提交想看的电视剧或电影</p>
        <div className="mt-4">
          <Input store={wantInput} />
        </div>
      </Dialog>
    </>
  );
});
