/**
 * @file 邀请的好友列表
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Copy, Film, Pen, Plus, QrCode, Search, Smartphone, Tv2 } from "lucide-react";

// import { homeIndexPage, mediaSharePage } from "@/store/views";
import { fetchInviteeList, inviteMember } from "@/services";
import { ScrollView, ListView, Skeleton, Input, Dialog } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { Qrcode } from "@/components/qr-code";
import { ScrollViewCore, InputCore, DialogCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/store/types";
import { cn } from "@/utils";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: QrcodeState;
};
type QrcodeState = {
  text: string | null;
};
class QrcodeCore extends BaseDomain<TheTypesOfEvents> {
  text: string | null = null;

  constructor(props: Partial<{ _name: string }>) {
    super(props);
  }

  get state() {
    return {
      text: this.text,
    };
  }

  setText(text: string) {
    this.text = text;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
const QrcodeWithStore = (props: { store: QrcodeCore } & React.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const [state, setState] = useState(store.state);

  return (
    <div>
      {state.text ? <Qrcode className={props.className} text={state.text} /> : <div className={props.className}></div>}
    </div>
  );
};

export const InviteeListPage: ViewComponent = React.memo((props) => {
  const { app, history, client, view } = props;

  const helper = useInstance(
    () =>
      new ListCoreV2(
        new RequestCoreV2({
          fetch: fetchInviteeList,
          client,
        }),
        {
          onLoadingChange(loading) {
            searchInput.setLoading(!helper.response.initial && loading);
          },
        }
      )
  );
  const inviteMemberRequest = new RequestCoreV2({
    client,
    fetch: inviteMember,
    onLoading(loading) {
      inviteDialog.okBtn.setLoading(loading);
    },
    onSuccess(v) {
      const { tokens } = v;
      if (!tokens[0]) {
        return;
      }
      app.tip({
        text: ["新增成功"],
      });
      helper.refresh();
      inviteDialog.hide();
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
        // onPullToRefresh() {
        //   helper.refresh();
        // },
        onPullToBack() {
          history.back();
        },
      })
  );
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
    placeholder: "请输入好友备注",
  });
  const memberLinkDialog = new DialogCore({
    title: "好友专属链接",
    footer: false,
  });
  const inviteDialog = new DialogCore({
    title: "邀请好友",
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
  const qrcodeCore = new QrcodeCore({});
  const qrcodeDialog = new DialogCore({
    title: "移动端二维码",
    footer: false,
  });

  const [response, setResponse] = useState(helper.response);
  const [url, setUrl] = useState<string | null>(null);

  useInitialize(() => {
    // scrollView.onPullToRefresh(async () => {
    //   await helper.refresh();
    //   scrollView.stopPullToRefresh();
    // });
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
      <ScrollView store={scrollView} className="">
        <div className="min-h-screen">
          <div className="">
            <div className="flex items-center justify-between py-2 px-4">
              <div className="flex items-center space-x-2">
                <div
                  className="inline-block"
                  onClick={() => {
                    history.back();
                  }}
                >
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <div className="text-md">好友</div>
              </div>
              <div>
                <div
                  className="p-2 rounded-md bg-w-bg-2"
                  onClick={() => {
                    inviteDialog.show();
                  }}
                >
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full p-4 pt-0 pb-0 space-x-4">
              <div className="relative w-full">
                <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
              </div>
            </div>
          </div>
          <ListView
            store={helper}
            className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            {(() => {
              return dataSource.map((member) => {
                const { id, remark, tokens } = member;
                return (
                  <div key={id} className="flex p-4 pb-4 mb-2 bg-w-bg-2 cursor-pointer">
                    <div className="flex items-center justify-center w-12 h-12 bg-slate-300 rounded-full mr-4">
                      <div className="text-3xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                    </div>
                    <div className="flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="text-xl">{remark}</h2>
                      </div>
                      <div className="operations flex mt-2 space-x-2">
                        <Show when={tokens.length !== 0}>
                          {tokens.map((link) => {
                            const { id, used } = link;
                            return (
                              <>
                                {[
                                  {
                                    prefix: "/pc/home/index?force=1&token=",
                                    qrcode: false,
                                    platform: 1,
                                    text: "PC 端",
                                  },
                                  {
                                    prefix: "/mobile/home/index?force=1&token=",
                                    qrcode: true,
                                    platform: 2,
                                    text: "移动端",
                                  },
                                ].map((config) => {
                                  const { prefix, qrcode, platform, text } = config;
                                  // @todo 怎么移除 window 平台相关变量？
                                  // homeIndexPage.buildUrl2({ token: id });
                                  const url = `${window.location.origin}${prefix}${id}`;
                                  return (
                                    <>
                                      <div className="">
                                        <div
                                          className="p-2 rounded bg-w-bg-1"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            app.copy(url);
                                            app.tip({
                                              text: [`${text}链接已复制至剪切板`],
                                            });
                                          }}
                                        >
                                          {platform === 1 ? (
                                            <Tv2 className="w-5 h-5" />
                                          ) : (
                                            <Smartphone className="w-5 h-5" />
                                          )}
                                        </div>
                                        {/* <div className="text-[12px] text-w-fg-1">{text}</div> */}
                                      </div>
                                      <Show when={qrcode}>
                                        <div className="">
                                          <div
                                            className="p-2 rounded bg-w-bg-1"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              qrcodeDialog.show();
                                              qrcodeCore.setText(url);
                                            }}
                                          >
                                            <QrCode className="w-5 h-5" />
                                          </div>
                                          {/* <div className="text-[12px] text-w-fg-1">二维码</div> */}
                                        </div>
                                      </Show>
                                    </>
                                  );
                                })}
                              </>
                            );
                          })}
                        </Show>
                        {/* <div className="">
                          <div
                            className="p-2 rounded bg-w-bg-1"
                            onClick={(event) => {
                              event.stopPropagation();
                              app.showView(mediaSharePage);
                            }}
                          >
                            <Film className="w-5 h-5" />
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </ListView>
        </div>
      </ScrollView>
      <Dialog store={inviteDialog}>
        <p>输入好友备注（该备注不展示给好友）</p>
        <div className="mt-4">
          <Input prefix={<Pen className="w-4 h-4" />} store={remarkInput} />
        </div>
      </Dialog>
      <Dialog store={memberLinkDialog}>
        <Show when={!!url}>
          <div className="">{url}</div>
          <div
            className="flex items-center mt-4 space-x-2"
            onClick={() => {
              app.copy(url!);
            }}
          >
            <Copy className="w-4 h-4" />
            <div>点击复制</div>
          </div>
        </Show>
      </Dialog>
      <Dialog store={qrcodeDialog}>
        <div className="flex justify-center mt-4 p-2">
          <QrcodeWithStore className="w-[120px] h-[120px]" store={qrcodeCore} />
        </div>
      </Dialog>
    </>
  );
});
