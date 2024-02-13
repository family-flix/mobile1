import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

import { ViewComponentProps } from "@/store/types";
import { reportSomething, shareMediaToInvitee } from "@/services";
import { fetchMemberToken } from "@/services/media";
import { DialogCore, NodeCore, ScrollViewCore } from "@/domains/ui";
import { Show } from "@/packages/ui/show";
import { Dialog, ListView, Node, ScrollView, Skeleton } from "@/components/ui";
import { DynamicContent } from "@/components/dynamic-content";
import { InviteeSelectCore } from "@/components/member-select/store";
import { DynamicContentInListCore } from "@/domains/ui/dynamic-content";
import { PlayerCore } from "@/domains/player";
import { RefCore } from "@/domains/cur";
import { MovieMediaCore } from "@/domains/media/movie";
import { SeasonMediaCore } from "@/domains/media/season";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ReportTypes, SeasonReportList, MovieReportList } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { cn, sleep } from "@/utils";

enum MediaSettingsMenuKey {
  Resolution = 1,
  SourceFile = 2,
  Subtitle = 3,
  Rate = 4,
  Share = 5,
  Report = 6,
}
const menus = [
  {
    value: MediaSettingsMenuKey.Resolution,
    title: "分辨率",
  },
  {
    value: MediaSettingsMenuKey.SourceFile,
    title: "视频源",
  },
  {
    value: MediaSettingsMenuKey.Subtitle,
    title: "字幕列表",
  },
  {
    value: MediaSettingsMenuKey.Rate,
    title: "播放倍率",
  },
  {
    value: MediaSettingsMenuKey.Share,
    title: "分享",
  },
  {
    value: MediaSettingsMenuKey.Report,
    title: "反馈问题",
  },
];

export const MovieMediaSettings = (props: {
  store: MovieMediaCore;
  store2: PlayerCore;
  app: ViewComponentProps["app"];
  client: ViewComponentProps["client"];
  storage: ViewComponentProps["storage"];
  history: ViewComponentProps["history"];
}) => {
  const { store, app, client, history, storage, store2 } = props;

  const memberTokenRequest = useInstance(
    () =>
      new RequestCoreV2({
        client,
        fetch: fetchMemberToken,
        onLoading(loading) {
          inviteeSelect.submitBtn.setLoading(loading);
        },
        onSuccess(v) {
          const { name, token } = v;
          if (!store.profile) {
            app.tip({
              text: ["详情未加载"],
            });
            return;
          }
          const url = history.buildURLWithPrefix("root.movie_playing", { id: store.profile.id, token, tmp: "1" });
          shareDialog.show();
          const message = `➤➤➤ ${name}
${url}`;
          setShareLink(message);
        },
        onFailed(error) {
          app.tip({
            text: ["分享失败", error.message],
          });
        },
      })
  );
  const reportRequest = useInstance(
    () =>
      new RequestCoreV2({
        client: client,
        fetch: reportSomething,
        onLoading(loading) {
          reportConfirmDialog.okBtn.setLoading(loading);
        },
        onSuccess() {
          app.tip({
            text: ["提交成功"],
          });
          reportConfirmDialog.hide();
        },
        onFailed(error) {
          app.tip({
            text: ["提交失败", error.message],
          });
        },
      })
  );
  const wrap = useInstance(() => new NodeCore());
  const sourceIcon = useInstance(
    () =>
      new DynamicContentInListCore({
        value: 2,
      })
  );
  const fileIcon = useInstance(
    () =>
      new DynamicContentInListCore({
        value: 2,
      })
  );
  const rateIcon = useInstance(
    () =>
      new DynamicContentInListCore({
        value: 2,
      })
  );
  const subtitleIcon = useInstance(() => new DynamicContentInListCore({ value: 2 }));
  const scroll = useInstance(() => new ScrollViewCore());
  const inviteeSelect = useInstance(
    () =>
      new InviteeSelectCore({
        client,
        onSelect(v) {
          if (!store.profile) {
            app.tip({
              text: ["请选择要分享的影视剧"],
            });
            return;
          }
          shareDialog.show();
          memberTokenRequest.run({
            media_id: store.profile.id,
            target_member_id: v.id,
          });
        },
      })
  );
  const shareDialog = useInstance(
    () =>
      new DialogCore({
        footer: false,
      })
  );
  const curReport = useInstance(
    () =>
      new RefCore<string>({
        onChange(v) {
          setCurReportValue(v);
        },
      })
  );
  const reportConfirmDialog = useInstance(
    () =>
      new DialogCore({
        title: "发现问题",
        onOk() {
          if (!store.profile) {
            app.tip({
              text: ["影视剧信息还未加载"],
            });
            return;
          }
          if (!curReport.value) {
            app.tip({
              text: ["请先选择问题"],
            });
            return;
          }
          reportRequest.run({
            type: ReportTypes.Movie,
            data: curReport.value,
            media_id: store.profile.id,
            media_source_id: store.curSource?.id,
          });
        },
      })
  );

  const [menuIndex, setMenuIndex] = useState<MediaSettingsMenuKey>(MediaSettingsMenuKey.Resolution);
  const [state, setState] = useState(store.state);
  const [curSource, setCurSource] = useState(store.$source.profile);
  const [playerState, setPlayerState] = useState(store2.state);
  const [subtitle, setSubtitle] = useState(store.$source.subtitle);
  const [rate, setRate] = useState(store2._curRate);
  const [member, setMember] = useState(inviteeSelect.$list.response);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [curReportValue, setCurReportValue] = useState(curReport.value);

  const showMenuContent = (index: MediaSettingsMenuKey) => {
    setMenuIndex(index);
    wrap.setStyles(`transform: translate(-100%);`);
  };
  const returnMainContent = () => {
    wrap.setStyles(`transform: translate(0);`);
  };

  useInitialize(() => {
    store.onStateChange((v) => {
      setState(v);
    });
    store.onSourceFileChange((v) => {
      setCurSource(v);
    });
    store.$source.onSubtitleChange((v) => {
      setSubtitle(v);
    });
    store2.onRateChange((v) => {
      setRate(v.rate);
    });
    store2.onStateChange((v) => {
      setPlayerState(v);
    });
    inviteeSelect.onResponseChange((v) => {
      setMember(v);
    });
  });

  return (
    <div className="overflow-hidden h-full">
      <Node className="flex h-full transition-transform duration-500 ease-in-out" store={wrap}>
        <div className="panel__home w-full flex-shrink-0">
          <div className="space-x-2 px-4">
            <div className="flex items-center mt-2 h-12">
              <div className="text-xl">设置</div>
            </div>
          </div>
          <div className="h-[1px] bg-w-bg-1" />
          <div className="mt-2">
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(MediaSettingsMenuKey.Resolution);
              }}
            >
              <div>分辨率</div>
              <div className="flex items-center text-w-fg-1">
                <Show when={!!curSource?.typeText}>
                  <div className="px-2">{curSource?.typeText}</div>
                </Show>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(MediaSettingsMenuKey.SourceFile);
              }}
            >
              <div>视频源</div>
              <div className=" text-w-fg-1">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                if (subtitle === null) {
                  return;
                }
                showMenuContent(MediaSettingsMenuKey.Subtitle);
              }}
            >
              <div>字幕列表</div>
              <div className="flex items-center">
                <div
                  className="px-4"
                  onClick={(event) => {
                    event.stopPropagation();
                    store2.toggleSubtitleVisible();
                    store.$source.toggleSubtitleVisible();
                  }}
                >
                  {(() => {
                    if (subtitle === null) {
                      return <span className="text-w-fg-2">暂无字幕</span>;
                    }
                    if (subtitle.visible) {
                      return "禁用";
                    }
                    return "启用";
                  })()}
                </div>
                <div
                  className={cn(subtitle === null ? "text-w-fg-2" : "text-w-fg-1")}
                  onClick={() => {
                    if (subtitle === null) {
                      return;
                    }
                    showMenuContent(MediaSettingsMenuKey.Subtitle);
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(MediaSettingsMenuKey.Rate);
              }}
            >
              <div>播放倍率</div>
              <div className="flex items-center space-x-2 text-w-fg-1">
                <div className="px-2">{playerState.rate}x</div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(MediaSettingsMenuKey.Share);
                inviteeSelect.$list.init();
              }}
            >
              <div>分享</div>
              <div className="flex items-center space-x-2 text-w-fg-1">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(MediaSettingsMenuKey.Report);
              }}
            >
              <div>反馈问题</div>
              <div className="flex items-center space-x-2 text-w-fg-1">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        <div className="panel__second relative w-full h-full flex-shrink-0">
          <div className="flex items-center justify-between mt-2 h-12 px-4 bg-w-bg-2">
            <div
              className="flex items-center space-x-1"
              onClick={() => {
                returnMainContent();
              }}
            >
              <ChevronLeft className="w-6 h-6" />
              <div className="flex items-center space-x-2 text-lg">
                <div className="text-w-fg-2">设置</div>
                <div>/</div>
                <div>
                  {(() => {
                    const matched = menus.find((m) => m.value === menuIndex);
                    if (matched) {
                      return matched.title;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
            {/* {menuIndex === MediaSettingsMenuKey.Subtitle ? (
              <div
                className="flex items-center space-x-4"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div
                  className="rounded-md bg-w-bg-2"
                  onClick={() => {
                    store.minFixTime();
                  }}
                >
                  <Minus className="w-6 h-6" />
                </div>
                <div className="text-center">{state.fixTime}</div>
                <div
                  className="rounded-md bg-w-bg-2"
                  onClick={() => {
                    store.addFixTime();
                  }}
                >
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            ) : null} */}
          </div>
          <div className="h-[1px] bg-w-bg-1" />
          <ScrollView className="absolute inset-0 top-16" store={scroll}>
            {(() => {
              if (menuIndex === MediaSettingsMenuKey.Resolution) {
                return (
                  <div>
                    {(() => {
                      if (!curSource) {
                        return <div>Loading</div>;
                      }
                      const { typeText: curTypeText, resolutions } = curSource;
                      return (
                        <div className="max-h-full text-w-fg-1 px-4 overflow-y-auto">
                          <div className="pb-24">
                            {resolutions.map((r, i) => {
                              const { type, typeText } = r;
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between p-4 rounded-md cursor-pointer",
                                    curTypeText === typeText ? "bg-w-bg-active" : ""
                                  )}
                                  onClick={async () => {
                                    sourceIcon.select(type);
                                    sourceIcon.set(3);
                                    const result = await store.changeResolution(type);
                                    if (result.error) {
                                      sourceIcon.set(5);
                                      return;
                                    }
                                    sourceIcon.set(2);
                                    sourceIcon.clear();
                                    storage.merge("player_settings", {
                                      type,
                                    });
                                  }}
                                >
                                  <div>{typeText}</div>
                                  <DynamicContent
                                    className="ml-4"
                                    store={sourceIcon.bind(type)}
                                    options={[
                                      {
                                        value: 1,
                                        content: null,
                                      },
                                      {
                                        value: 2,
                                        content: (
                                          <Show when={curTypeText === typeText}>
                                            <div>
                                              <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                          </Show>
                                        ),
                                      },
                                      {
                                        value: 3,
                                        content: <Loader className="w-6 h-6 animate animate-spin" />,
                                      },
                                      {
                                        value: 4,
                                        content: <Check className="w-6 h-6" />,
                                      },
                                      {
                                        value: 5,
                                        content: <AlertTriangle className="w-6 h-6" />,
                                      },
                                    ]}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              if (menuIndex === MediaSettingsMenuKey.SourceFile) {
                return (
                  <div>
                    {(() => {
                      if (state === null) {
                        return <div className=" px-4">Loading</div>;
                      }
                      if (!state.curSource) {
                        return <div className=" px-4">Error</div>;
                      }
                      return (
                        <div className="max-h-full overflow-y-auto px-4 text-w-fg-1">
                          <div className="pb-24">
                            {state.curSource.files.map((s) => {
                              const { id, name, invalid } = s;
                              return (
                                <div
                                  key={id}
                                  className={cn(
                                    "flex items-center justify-between p-4 rounded-md cursor-pointer",
                                    curSource?.id === id ? "bg-w-bg-active" : ""
                                  )}
                                  onClick={async () => {
                                    fileIcon.select(id);
                                    fileIcon.set(3);
                                    const result = await store.changeSourceFile(s);
                                    if (result.error) {
                                      sourceIcon.set(5);
                                      fileIcon.clear();
                                      return;
                                    }
                                    fileIcon.set(2);
                                    fileIcon.clear();
                                  }}
                                >
                                  <div className="break-all">{name}</div>
                                  <DynamicContent
                                    className="ml-4"
                                    store={fileIcon.bind(id)}
                                    options={[
                                      {
                                        value: 1,
                                        content: null,
                                      },
                                      {
                                        value: 2,
                                        content: (
                                          <Show
                                            when={invalid}
                                            fallback={
                                              <Show when={curSource?.id === id}>
                                                <div>
                                                  <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                              </Show>
                                            }
                                          >
                                            <AlertTriangle className="w-6 h-6" />
                                          </Show>
                                        ),
                                      },
                                      {
                                        value: 3,
                                        content: <Loader className="w-6 h-6 animate animate-spin" />,
                                      },
                                      {
                                        value: 4,
                                        content: <Check className="w-6 h-6" />,
                                      },
                                      {
                                        value: 5,
                                        content: <AlertTriangle className="w-6 h-6" />,
                                      },
                                    ]}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              if (menuIndex === MediaSettingsMenuKey.Rate) {
                return (
                  <div>
                    {(() => {
                      return (
                        <div className="max-h-full overflow-y-auto px-4 text-w-fg-1">
                          <div className="pb-24">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rateOpt, index) => {
                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-center justify-between p-4 rounded-md cursor-pointer",
                                    rate === rateOpt ? "bg-w-bg-active" : ""
                                  )}
                                  onClick={() => {
                                    rateIcon.select(rateOpt);
                                    rateIcon.set(2);
                                    store2.changeRate(rateOpt);
                                    rateIcon.clear();
                                    storage.merge("player_settings", {
                                      rate: rateOpt,
                                    });
                                  }}
                                >
                                  <div className="break-all">{rateOpt}x</div>
                                  <DynamicContent
                                    className="ml-4"
                                    store={rateIcon.bind(rateOpt)}
                                    options={[
                                      {
                                        value: 1,
                                        content: null,
                                      },
                                      {
                                        value: 2,
                                        content: (
                                          <Show when={rate === rateOpt}>
                                            <div>
                                              <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                          </Show>
                                        ),
                                      },

                                      {
                                        value: 3,
                                        content: <Loader className="w-6 h-6 animate animate-spin" />,
                                      },
                                    ]}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              if (menuIndex === MediaSettingsMenuKey.Subtitle) {
                return (
                  <div className="max-h-full overflow-y-auto px-4 text-w-fg-1">
                    <div className="pb-24">
                      {store.$source.subtitles.map((sub, i) => {
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-md cursor-pointer",
                              sub.url === subtitle?.url ? "bg-w-bg-active" : ""
                            )}
                            onClick={async () => {
                              subtitleIcon.select(sub.id);
                              subtitleIcon.set(3);
                              const r = await store.$source.loadSubtitleFile(sub, store.currentTime);
                              if (r.error) {
                                subtitleIcon.set(5);
                                subtitleIcon.clear();
                                return;
                              }
                              subtitleIcon.set(4);
                              subtitleIcon.clear();
                            }}
                          >
                            <div className="w-full break-all truncate">{sub.language.join("&")}</div>
                            <DynamicContent
                              className="ml-4"
                              store={subtitleIcon.bind(sub.id)}
                              options={[
                                {
                                  value: 1,
                                  content: null,
                                },
                                {
                                  value: 2,
                                  content: (
                                    <Show when={sub.url === subtitle?.url}>
                                      <div>
                                        <CheckCircle2 className="w-6 h-6" />
                                      </div>
                                    </Show>
                                  ),
                                },
                                {
                                  value: 3,
                                  content: <Loader className="w-6 h-6 animate animate-spin" />,
                                },
                                {
                                  value: 4,
                                  content: <Check className="w-6 h-6" />,
                                },
                                {
                                  value: 5,
                                  content: <AlertTriangle className="w-6 h-6" />,
                                },
                              ]}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (menuIndex === MediaSettingsMenuKey.Share) {
                return (
                  <div className="max-h-full overflow-y-auto px-4 text-w-fg-1">
                    <div className="pb-24">
                      <ListView
                        wrapClassName="flex-1 overflow-y-auto"
                        className="max-h-full flex flex-col h-full"
                        store={inviteeSelect.$list}
                        skeleton={
                          <div className="flex items-center justify-between space-x-2 p-4 rounded-md cursor-pointer">
                            <div className="w-8 h-8 bg-slate-300 rounded-full">
                              <Skeleton className="w-[32px] h-[32px]" />
                            </div>
                            <div className="flex-1">
                              <Skeleton className="h-[32px] w-[180px]"></Skeleton>
                            </div>
                          </div>
                        }
                      >
                        <div className="space-y-4 flex-1 overflow-y-auto">
                          {member.dataSource.map((member) => {
                            const { id, remark } = member;
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between space-x-2 p-4 rounded-md cursor-pointer"
                                onClick={() => {
                                  inviteeSelect.select(member);
                                }}
                              >
                                <div className="flex items-center justify-between bg-slate-300 rounded-full">
                                  <div className="w-8 h-8 text-xl text-center text-slate-500">
                                    {remark.slice(0, 1).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 w-0">
                                  <h2 className="">{remark}</h2>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ListView>
                    </div>
                  </div>
                );
              }
              if (menuIndex === MediaSettingsMenuKey.Report) {
                return (
                  <div className="max-h-full overflow-y-auto px-4 text-w-fg-1">
                    <div className="pb-24">
                      {MovieReportList.map((question, i) => {
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-4 rounded-md cursor-pointer"
                            onClick={() => {
                              curReport.select(question);
                              reportConfirmDialog.show();
                            }}
                          >
                            <div>{question}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            })()}
          </ScrollView>
        </div>
      </Node>
      <Dialog store={shareDialog}>
        <div
          className="relative w-full h-[160px]"
          onClick={() => {
            if (!shareLink) {
              return;
            }
            app.copy(shareLink);
            app.tip({
              text: ["已复制至粘贴板"],
            });
            shareDialog.hide();
          }}
        >
          {(() => {
            if (!shareLink) {
              return (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate animate-spin" />
                </div>
              );
            }
            return (
              <div className="text-center">
                <div>点击复制该信息至粘贴板</div>
                <div className="mt-4 rounded-md p-4 bg-w-bg-2">
                  <pre className="text-left break-all whitespace-normal text-w-fg-1">{shareLink}</pre>
                </div>
              </div>
            );
          })()}
        </div>
      </Dialog>
      <Dialog store={reportConfirmDialog}>
        <div className="text-w-fg-1">
          <p>提交你发现的该电影的问题</p>
          <p className="mt-2 text-xl">「{curReportValue}」</p>
        </div>
      </Dialog>
    </div>
  );
};
