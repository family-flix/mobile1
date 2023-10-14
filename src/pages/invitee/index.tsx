/**
 * @file 邀请的成员列表
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Copy, Loader, QrCode, Search, SlidersHorizontal, Star } from "lucide-react";

import {
  BackToTop,
  ScrollView,
  Sheet,
  ListView,
  Skeleton,
  Input,
  LazyImage,
  CheckboxGroup,
  Dialog,
} from "@/components/ui";
import { ScrollViewCore, InputCore, DialogCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { fetchInviteeList, inviteMember } from "@/services";
import { Show } from "@/components/ui/show";
import { cn } from "@/utils";
import { Qrcode } from "@/components/Qrcode";
import { rootView } from "@/store";

export const InviteeListPage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const inviteMemberRequest = new RequestCore(inviteMember, {
    onLoading(loading) {
      inviteDialog.okBtn.setLoading(loading);
    },
    onSuccess(v) {
      const { tokens } = v;
      if (!tokens[0]) {
        return;
      }
      setUrl(tokens[0].token);
      inviteDialog.hide();
      memberLinkDialog.show();
    },
    onFailed(error) {
      app.tip({
        text: ["邀请失败", error.message],
      });
    },
  });
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          app.back();
        },
      })
  );
  const helper = useInstance(
    () =>
      new ListCore(new RequestCore(fetchInviteeList), {
        onLoadingChange(loading) {
          searchInput.setLoading(!helper.response.initial && loading);
        },
      })
  );
  const settingsSheet = useInstance(() => new DialogCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字",
        onEnter(v) {
          helper.search({
            remark: v,
          });
        },
        onBlur(v) {
          helper.search({
            remark: v,
          });
        },
      })
  );
  const remarkInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入成员备注",
  });
  const memberLinkDialog = new DialogCore({
    title: "成员专属链接",
    footer: false,
  });
  const inviteDialog = new DialogCore({
    title: "邀请成员",
    onOk() {
      if (!remarkInput.value) {
        app.tip({
          text: [remarkInput.placeholder],
        });
        return;
      }
      inviteMemberRequest.run({
        remark: remarkInput.value,
      });
    },
  });
  const qrcodeDialog = new DialogCore({
    title: "移动端二维码",
    footer: false,
  });

  const [response, setResponse] = useState(helper.response);
  const [url, setUrl] = useState<string | null>(null);

  useInitialize(() => {
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });
  useEffect(() => {
    helper.init();
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="min-h-screen">
          <div className="">
            <div className="flex items-center">
              <div
                className="inline-block p-4"
                onClick={() => {
                  app.back();
                }}
              >
                <ArrowLeft className="w-6 h-6 dark:text-black-200" />
              </div>
              <div className="text-2xl">成员</div>
            </div>
            <div className="flex items-center justify-between w-full p-4 pb-0 space-x-4">
              <div className="relative w-full">
                <Input store={searchInput} prefix={<Search className="w-4 h-4" />} />
              </div>
            </div>
          </div>
          <ListView
            store={helper}
            className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            {(() => {
              return dataSource.map((member) => {
                const { id, remark, tokens } = member;
                return (
                  <div key={id} className="flex px-4 pb-4 cursor-pointer">
                    <div className="flex items-center justify-center w-12 h-12 bg-slate-300 rounded-full mr-4">
                      <div className="text-3xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                    </div>
                    <div className="mt-2 flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="">{remark}</h2>
                      </div>
                      <Show when={tokens.length !== 0}>
                        <div className="mt-4 space-y-8">
                          {tokens.map((link) => {
                            const { id, used } = link;
                            return (
                              <div key={id} className="space-y-2">
                                {[
                                  {
                                    prefix: "/pc/home/index?token=",
                                    qrcode: false,
                                  },
                                  {
                                    prefix: "/mobile/home/index?token=",
                                    qrcode: true,
                                  },
                                ].map((config) => {
                                  const { prefix, qrcode } = config;
                                  // @todo 怎么移除 window 平台相关变量？
                                  const url = `${window.location.origin}${prefix}${id}`;
                                  return (
                                    <div key={url} className="flex">
                                      <div
                                        className={cn(
                                          "flex-1 w-0 text-sm text-slate-700 break-all whitespace-pre-wrap",
                                          used ? "line-through" : ""
                                        )}
                                        onClick={() => {
                                          app.copy(url);
                                          app.tip({
                                            text: ["链接已复制至剪切板"],
                                          });
                                        }}
                                      >
                                        {url}
                                      </div>
                                      <div className="flex items-center w-18 mt-2 space-x-2">
                                        <Show when={qrcode}>
                                          <div
                                            className=""
                                            onClick={() => {
                                              qrcodeDialog.show();
                                              setUrl(url);
                                            }}
                                          >
                                            <QrCode className="w-4 h-4" />
                                          </div>
                                        </Show>
                                        <div
                                          className=""
                                          onClick={() => {
                                            app.copy(url);
                                            app.tip({
                                              text: ["链接已复制至剪切板"],
                                            });
                                          }}
                                        >
                                          <Copy className="w-4 h-4" />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </Show>
                    </div>
                  </div>
                );
              });
            })()}
          </ListView>
        </div>
      </ScrollView>
      <Dialog store={inviteDialog}>
        <p>输入成员备注（该备注不展示给被邀请人）</p>
        <div className="mt-4">
          <Input store={remarkInput} />
        </div>
      </Dialog>
      <Dialog store={memberLinkDialog}>
        <Show when={!!url}>
          <div className="text-lg">{url}</div>
        </Show>
        <div
          className="flex items-center mt-4 space-x-2"
          onClick={() => {
            app.copy("hello");
          }}
        >
          <Copy className="w-4 h-4" />
          <div>点击复制</div>
        </div>
      </Dialog>
      <Dialog store={qrcodeDialog}>
        <div className="flex justify-center mt-4 p-2">
          {(() => {
            if (!url) {
              return null;
            }
            return <Qrcode className="w-[120px] h-[120px] mr-4" text={url} />;
          })()}
        </div>
      </Dialog>
    </>
  );
});
