/**
 * @file 邀请的好友列表
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Copy, HelpingHand, List, Pen, Plus, QrCode, Search, Smartphone, Tv2 } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { fetchInviteeList, inviteMember, createInvitationCode } from "@/services/index";
import { useInitialize, useInstance } from "@/hooks/index";
import { ScrollView, ListView, Skeleton, Input, Dialog } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { ScrollViewCore, InputCore, DialogCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { UnpackedRequestPayload } from "@/domains/request/utils";

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
      {/* {state.text ? <Qrcode className={props.className} text={state.text} /> : <div className={props.className}></div>} */}
    </div>
  );
};

function Page(props: ViewComponentProps) {
  const { app, client } = props;
  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $list.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $list.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $searchInput = new InputCore({
    placeholder: "请输入关键字",
    onEnter(v) {
      $list.search({
        remark: v,
      });
    },
    onBlur(v) {
      $list.search({
        remark: v,
      });
    },
  });
  const $remarkInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入好友备注",
    onEnter() {
      $inviteDialog.okBtn.click();
    },
  });
  const $list = new ListCore(
    new RequestCore(fetchInviteeList, {
      client,
    }),
    {
      onLoadingChange(loading) {
        $searchInput.setLoading(!$list.response.initial && loading);
      },
    }
  );
  const $inviteDialog = new DialogCore({
    title: "邀请好友",
    onOk() {
      if (!$remarkInput.value) {
        app.tip({
          text: [$remarkInput.placeholder],
        });
        return;
      }
      $inviteMemberRequest.run({
        remark: $remarkInput.value,
      });
    },
  });
  const $memberLinkDialog = new DialogCore({
    title: "好友专属链接",
    footer: false,
  });
  const $qrcodeDialog = new DialogCore({
    title: "移动端二维码",
    footer: false,
  });
  // const $invitationCodeList = new ListCoreV2(
  //   new RequestCoreV2({
  //     fetch: createInvitationCode,
  //     client,
  //   })
  // );
  const $invitationCodeCreateRequest = new RequestCore(createInvitationCode, {
    client,
    defaultResponse: {
      list: [],
    } as UnpackedRequestPayload<ReturnType<typeof createInvitationCode>>,
  });
  const $invitationCodeDialog = new DialogCore({
    title: "生成邀请码",
    async onOk() {
      const count = $invitationCodeInput.value;
      if (!count) {
        app.tip({
          text: ["请输入邀请码数量"],
        });
        return;
      }
      $invitationCodeDialog.okBtn.setLoading(true);
      const r = await $invitationCodeCreateRequest.run({ count: Number(count) });
      $invitationCodeDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      app.tip({
        text: ["创建成功"],
      });
      $invitationCodeDialog.hide();
      $invitationCodeResultDialog.show();
    },
  });
  const $invitationCodeInput = new InputCore({
    defaultValue: "1",
    placeholder: "请输入邀请码数量",
  });
  const $invitationCodeResultDialog = new DialogCore({
    title: "邀请码",
    footer: false,
  });
  const $inviteMemberRequest = new RequestCore(inviteMember, {
    client,
    onLoading(loading) {
      $inviteDialog.okBtn.setLoading(loading);
    },
    onSuccess(v) {
      const { tokens } = v;
      if (!tokens[0]) {
        return;
      }
      app.tip({
        text: ["新增成功"],
      });
      $list.refresh();
      $inviteDialog.hide();
    },
    onFailed(error) {
      app.tip({
        text: ["邀请失败", error.message],
      });
    },
  });
  const state = {
    response: $list.response,
  };

  return {
    state,
    $list,
    request: {
      $invitationCodeCreateRequest,
    },
    ui: {
      $scroll,
      $searchInput,
      $inviteDialog,
      $invitationCodeDialog,
      $invitationCodeInput,
      $invitationCodeResultDialog,
      $qrcodeDialog,
      $memberLinkDialog,
      $remarkInput,
    },
  };
}

export const InviteeListPage: ViewComponent = React.memo((props) => {
  const { app, history, client, view } = props;

  // const qrcodeCore = new QrcodeCore({});
  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$list.response);
  const [codes, setCodes] = useState($page.request.$invitationCodeCreateRequest.response);
  const [url, setUrl] = useState<string | null>(null);

  useInitialize(() => {
    $page.$list.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    $page.request.$invitationCodeCreateRequest.onResponseChange((v) => {
      setCodes(v);
    });
  });
  useEffect(() => {
    $page.$list.init();
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]invitee/index - render", dataSource);

  return (
    <>
      <div className="relative z-20 bg-w-bg-0">
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
            <div className="text-md"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="p-2 rounded-md bg-w-bg-2"
              onClick={() => {
                $page.ui.$inviteDialog.show();
              }}
            >
              <Plus className="w-6 h-6" />
            </div>
            <div
              className="p-2 rounded-md bg-w-bg-2"
              onClick={() => {
                $page.ui.$invitationCodeDialog.show();
                // history.push("root.invitation_code");
              }}
            >
              <HelpingHand className="w-6 h-6" />
            </div>
            <div
              className="p-2 rounded-md bg-w-bg-2"
              onClick={() => {
                history.push("root.invitation_code");
              }}
            >
              <List className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between w-full px-4 py-2 space-x-4">
          <div className="relative w-full">
            <Input store={$page.ui.$searchInput} prefix={<Search className="w-5 h-5" />} />
          </div>
        </div>
      </div>
      <ScrollView store={$page.ui.$scroll} className="z-10 absolute left-[0] top-[112px] bottom-0 w-full h-auto">
        <ListView
          store={$page.$list}
          className="relative grid grid-cols-1 pt-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
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
                    <div className="operations mt-2">
                      <Show when={tokens.length !== 0}>
                        {tokens.map((link) => {
                          const { id, used } = link;
                          return (
                            <div key={id} className="flex space-x-2">
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
                                const url = `${history.$router.location.origin}${prefix}${id}`;
                                return (
                                  <div key={prefix} className="flex space-x-2">
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
                                    </div>
                                    <Show when={qrcode}>
                                      <div className="">
                                        <div
                                          className="p-2 rounded bg-w-bg-1"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            // qrcodeDialog.show();
                                            // qrcodeCore.setText(url);
                                          }}
                                        >
                                          <QrCode className="w-5 h-5" />
                                        </div>
                                      </div>
                                    </Show>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </Show>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </ListView>
      </ScrollView>
      <Dialog store={$page.ui.$inviteDialog}>
        <p>输入好友备注（该备注仅自己可见）</p>
        <div className="mt-4">
          <Input prefix={<Pen className="w-4 h-4" />} store={$page.ui.$remarkInput} />
        </div>
      </Dialog>
      <Dialog store={$page.ui.$memberLinkDialog}>
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
      <Dialog store={$page.ui.$qrcodeDialog}>
        <div className="flex justify-center mt-4 p-2">
          {/* <QrcodeWithStore className="w-[120px] h-[120px]" store={qrcodeCore} /> */}
        </div>
      </Dialog>
      <Dialog store={$page.ui.$invitationCodeDialog}>
        <div className="mb-4">请填写邀请码数量</div>
        <Input store={$page.ui.$invitationCodeInput} />
      </Dialog>
      <Dialog store={$page.ui.$invitationCodeResultDialog}>
        <div className="text-left">注册地址</div>
        <div className="text-left">https://media.funzm.com/mobile/register</div>
        <div className="mt-4 text-left">邀请码</div>
        <div className="h-[120px] overflow-y-auto space-y-1 text-left">
          {codes?.list.map((code) => {
            return <div>{code.code}</div>;
          })}
        </div>
        <div
          className="flex items-center mt-4 space-x-2"
          onClick={() => {
            const text = `注册地址
https://media.funzm.com/mobile/register
            
邀请码
${codes?.list.map((code) => code).join("\n")}
`;
            app.copy(text);
          }}
        >
          <Copy className="w-4 h-4" />
          <div>点击复制</div>
        </div>
      </Dialog>
    </>
  );
});
