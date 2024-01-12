import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, Loader } from "lucide-react";

import { DialogCore, NodeCore, ScrollViewCore } from "@/domains/ui";
import { Show } from "@/packages/ui/show";
import { Node, ScrollView } from "@/components/ui";
import { DynamicContent } from "@/components/dynamic-content";
import { SeasonMediaCore } from "@/domains/media/season";
import { DynamicContentInListCore } from "@/domains/ui/dynamic-content";
import { PlayerCore } from "@/domains/player";
import { Application } from "@/domains/app";
import { useInitialize, useInstance } from "@/hooks";
import { cn, sleep } from "@/utils";

export const SeasonMediaSettings = (props: { store: SeasonMediaCore; app: Application; store2: PlayerCore }) => {
  const { store, app, store2 } = props;

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
  const scroll = useInstance(() => new ScrollViewCore());

  const [state, setState] = useState(store.state);
  const [curSource, setCurSource] = useState(store.$source.profile);
  const [playerState, setPlayerState] = useState(store2.state);
  const [rate, setRate] = useState(store2._curRate);
  const [menuIndex, setMenuIndex] = useState(0);

  const showMenuContent = (index: number) => {
    setMenuIndex(index);
    wrap.setStyles(`transform: translate(-375px);`);
  };
  const returnMainContent = () => {
    wrap.setStyles(`transform: translate(0);`);
  };

  useInitialize(() => {
    store.onStateChange((v) => {
      setState(v);
    });
    store.onSourceFileChange((v) => {
      console.log(v);
      setCurSource(v);
    });
    store2.onRateChange((v) => {
      setRate(v.rate);
    });
    store2.onStateChange((v) => {
      setPlayerState(v);
    });
  });

  return (
    <div className="overflow-hidden h-full">
      <Node className="flex h-full transition-transform duration-500 ease-in-out" store={wrap}>
        <div className="panel__home w-full flex-shrink-0">
          <div className="space-x-2 px-4">
            <div className="flex items-center mt-4 h-12">
              <div className="text-xl">设置</div>
            </div>
          </div>
          <div className="h-[1px] bg-w-bg-1" />
          <div className="mt-2">
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(0);
              }}
            >
              <div>分辨率</div>
              <div className="flex items-center text-w-fg-1">
                <Show when={!!curSource?.typeText}>
                  <div>{curSource?.typeText}</div>
                </Show>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(1);
              }}
            >
              <div>视频源</div>
              <div className=" text-w-fg-1">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            {/* <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(2);
              }}
            >
              <div>启用字幕</div>
              <div className=" text-w-fg-1">
                <input type="checkbox" />
              </div>
            </div>
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(3);
              }}
            >
              <div>字幕</div>
              <div className=" text-w-fg-1">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div> */}
            <div
              className="flex items-center justify-between py-2 px-4"
              onClick={() => {
                showMenuContent(4);
              }}
            >
              <div>播放倍率</div>
              <div className="flex items-center space-x-2 text-w-fg-1">
                <div>{playerState.rate}x</div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        <div className="panel__second relative w-full h-full flex-shrink-0">
          <div
            className="flex items-center mt-4 h-12 space-x-1 px-4 bg-w-bg-2"
            onClick={() => {
              returnMainContent();
            }}
          >
            <ChevronLeft className="w-6 h-6" />
            <div className="text-lg">设置</div>
          </div>
          <div className="h-[1px] bg-w-bg-1" />
          <ScrollView className="absolute inset-0 top-16 px-4" store={scroll}>
            {(() => {
              if (menuIndex === 0) {
                return (
                  <div>
                    {(() => {
                      if (!curSource) {
                        return <div>Loading</div>;
                      }
                      const { typeText: curTypeText, resolutions } = curSource;
                      return (
                        <div className="max-h-full text-w-fg-1 overflow-y-auto">
                          <div className="pb-24">
                            {resolutions.map((r, i) => {
                              const { type, typeText } = r;
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between p-4 cursor-pointer",
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
                                    app.cache.merge("player_settings", {
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
              if (menuIndex === 1) {
                return (
                  <div>
                    {(() => {
                      if (state === null) {
                        return <div>Loading</div>;
                      }
                      if (!state.curSource) {
                        return <div>Error</div>;
                      }
                      return (
                        <div className="max-h-full overflow-y-auto text-w-fg-1">
                          <div className="pb-24">
                            {state.curSource.files.map((s) => {
                              const { id, file_name, parent_paths } = s;
                              return (
                                <div
                                  key={id}
                                  className={cn(
                                    "flex items-center justify-between p-4 cursor-pointer",
                                    curSource?.id === id ? "bg-w-bg-active" : ""
                                  )}
                                  onClick={async () => {
                                    // loadingPresence.show();
                                    // loadingPresence.hide();
                                    fileIcon.select(id);
                                    fileIcon.set(3);
                                    const result = await store.changeSourceFile(s);
                                    if (result.error) {
                                      sourceIcon.set(5);
                                      return;
                                    }
                                    fileIcon.set(2);
                                    fileIcon.clear();
                                  }}
                                >
                                  <div className="break-all">
                                    {parent_paths}/{file_name}
                                  </div>
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
                                          <Show when={curSource?.id === id}>
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
              if (menuIndex === 4) {
                return (
                  <div>
                    {(() => {
                      return (
                        <div className="max-h-full overflow-y-auto text-w-fg-1">
                          <div className="pb-24">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rateOpt, index) => {
                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-center justify-between p-4 cursor-pointer",
                                    rate === rateOpt ? "bg-w-bg-active" : ""
                                  )}
                                  onClick={() => {
                                    rateIcon.select(rateOpt);
                                    rateIcon.set(2);
                                    store2.changeRate(rateOpt);
                                    rateIcon.clear();
                                    app.cache.merge("player_settings", {
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
            })()}
          </ScrollView>
        </div>
        <div className="panel-2 w-full flex-shrink-0">
          {/* <div className="max-h-full text-w-fg-1 pb-24 overflow-y-auto">
            {(() => {
              return (
                <div
                  className="px-4"
                  onClick={() => {
                    $logic.$player.toggleSubtitleVisible();
                    $logic.$tv.$source.toggleSubtitleVisible();
                  }}
                >
                  {subtileState?.visible ? "隐藏字幕" : "显示字幕"}
                </div>
              );
            })()}
            <div className="pt-4 text-w-fg-1">
              {$logic.$tv.$source.subtitles.map((subtitle, i) => {
                return (
                  <div
                    key={i}
                    onClick={() => {
                      $logic.$tv.$source.loadSubtitleFile(subtitle, $logic.$tv.currentTime);
                    }}
                  >
                    <div className={cn("py-2 px-4 cursor-pointer", subtitle.cur ? "bg-w-bg-active" : "")}>
                      {subtitle.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}
        </div>
      </Node>
    </div>
  );
};
