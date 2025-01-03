/**
 * @file 电视剧播放页面
 */
import React, { useCallback, useState } from "react";
import {
  Airplay,
  AlertTriangle,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Layers,
  Loader,
  Loader2,
  Maximize,
  Pause,
  Play,
  Settings,
  SkipForward,
} from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Show } from "@/packages/ui/show";
import { useInitialize, useInstance } from "@/hooks/index";
import { Sheet, ScrollView, Video, Dialog, Node } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { PlayingIcon } from "@/components/playing";
import { PlayerProgressBar } from "@/components/ui/video-progress-bar";
import { SeasonMediaSettings } from "@/components/season-media-settings";
import { DynamicContent } from "@/components/dynamic-content";
import { MediaReportCore } from "@/biz/report/index";
import { SeasonMediaCore } from "@/biz/media/season";
import { createVVTSubtitle } from "@/biz/subtitle/utils";
import { ScrollViewCore, DialogCore, PresenceCore, NodeCore } from "@/domains/ui";
import { PlayerCore } from "@/domains/player/index";
import { OrientationTypes } from "@/domains/app";
import { RouteViewCore } from "@/domains/route_view";
import { DynamicContentCore, DynamicContentInListCore } from "@/domains/ui/dynamic-content";
import { cn, seconds_to_hour, seconds_to_minute, sleep } from "@/utils/index";

function SeasonPlayingPageLogic(props: ViewComponentProps) {
  const { app, storage, client, view } = props;
  const settings = storage.get("player_settings");
  const { type: resolution, volume, rate, skip } = settings;

  const $tv = new SeasonMediaCore({
    client,
    resolution,
  });
  const $player = new PlayerCore({ app, volume, rate, skipTime: skip[view.query.id] });
  const $mediaReport = new MediaReportCore({ app, client });
  console.log("[PAGE]play - useInitialize");

  app.onHidden(() => {
    $player.pause();
  });
  app.onShow(() => {
    console.log("[PAGE]play - app.onShow", $player.currentTime);
    // 锁屏后 currentTime 不是锁屏前的
    $player.setCurrentTime($player.currentTime);
  });
  app.onOrientationChange((orientation) => {
    console.log("[PAGE]tv/play - app.onOrientationChange", orientation, app.screen.width);
    if (orientation === "horizontal") {
      if (!$player.hasPlayed && app.env.ios) {
        // fullscreenDialog.show();
        return;
      }
      if ($player.isFullscreen) {
        return;
      }
      $player.requestFullScreen();
      $player.isFullscreen = true;
    }
    if (orientation === "vertical") {
      $player.disableFullscreen();
      // fullscreenDialog.hide();
      // console.log("[PAGE]tv/play - app.onOrientationChange", tv.curSourceFile?.width, tv.curSourceFile?.height);
      if ($tv.$source.profile) {
        const { width, height } = $tv.$source.profile;
        $player.setSize({ width, height });
      }
    }
  });
  $player.onExitFullscreen(() => {
    $player.pause();
    // if (tv.curSourceFile) {
    //   player.setSize({ width: tv.curSourceFile.width, height: tv.curSourceFile.height });
    // }
    if (app.orientation === OrientationTypes.Vertical) {
      $player.disableFullscreen();
    }
  });
  $tv.screenshot = () => {
    return $player.screenshot();
  };
  $tv.onProfileLoaded((profile) => {
    app.setTitle($tv.getTitle().join(" - "));
    const { curSource: curEpisode } = profile;
    $tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime ?? 0 });
    $player.setCurrentTime(curEpisode.currentTime);
  });
  $tv.$source.onSubtitleLoaded((subtitle) => {
    $player.showSubtitle(createVVTSubtitle(subtitle));
  });
  $tv.onEpisodeChange((curEpisode) => {
    app.setTitle($tv.getTitle().join(" - "));
    const { currentTime } = curEpisode;
    $player.setCurrentTime(currentTime);
    $player.pause();
  });
  $tv.onTip((msg) => {
    app.tip(msg);
  });
  $tv.beforeNextEpisode(() => {
    $player.pause();
  });
  $tv.beforeLoadSubtitle(() => {
    // console.log("[PAGE]season - $tv.beforeLoadSubtitle");
    $player.clearSubtitle();
  });
  $tv.onSourceFileChange((mediaSource) => {
    console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
    $player.pause();
    $player.setSize({ width: mediaSource.width, height: mediaSource.height });
    storage.merge("player_settings", {
      type: mediaSource.type,
    });
    // loadSource 后开始 video loadstart 事件
    $player.loadSource(mediaSource);
  });
  $player.onReady(() => {
    $player.disableFullscreen();
  });
  $player.onCanPlay(() => {
    const { currentTime } = $tv;
    // console.log("[PAGE]play - player.onCanPlay", $player.hasPlayed, currentTime);
    function applySettings() {
      $player.setCurrentTime(currentTime === 0 ? $player.theTimeSkip : currentTime);
      if (settings.rate) {
        $player.changeRate(Number(rate));
      }
    }
    (async () => {
      if (app.env.android) {
        await sleep(1000);
      }
      applySettings();
    })();
    if (!$player.hasPlayed) {
      return;
    }
    $player.play();
  });
  $player.onVolumeChange(({ volume }) => {
    storage.merge("player_settings", {
      volume,
    });
  });
  $player.onProgress(({ currentTime, duration }) => {
    // console.log("[PAGE]tv/play_v2 - onProgress", currentTime, !player._canPlay);
    if (!$player._canPlay) {
      return;
    }
    // player.screenshot().then((url) => {
    //   console.log(url);
    // });
    $tv.handleCurTimeChange({
      currentTime,
      duration,
    });
  });
  $player.onPause(({ currentTime, duration }) => {
    console.log("[PAGE]play - player.onPause", currentTime, duration);
    $tv.updatePlayProgressForce({
      currentTime,
      duration,
    });
  });
  $player.onEnd(() => {
    console.log("[PAGE]play - player.onEnd");
    $tv.playNextEpisode();
  });
  $player.onResolutionChange(({ type }) => {
    console.log("[PAGE]play - player.onResolutionChange", type, $tv.currentTime);
    // player.setCurrentTime(tv.currentTime);
  });
  $player.onSourceLoaded(() => {
    console.log("[PAGE]play - player.onSourceLoaded", $tv.currentTime);
    $player.setCurrentTime($tv.currentTime);
    if (!$player.hasPlayed) {
      return;
    }
  });
  $player.onError(async (error) => {
    console.log("[PAGE]play - player.onError", error);
    $tv.setSourceFileInvalid();
    await (async () => {
      if (!$tv.profile) {
        return;
      }
      if (!$tv.curSource) {
        return;
      }
      const files = $tv.curSource.files;
      const curFileId = $tv.curSource.curFileId;
      const curFileIndex = files.findIndex((f) => f.id === curFileId);
      const nextIndex = curFileIndex + 1;
      const nextFile = files[nextIndex];
      if (!nextFile) {
        $mediaReport.$ref.select("无法播放");
        $mediaReport.$media.select({
          media_id: $tv.profile.id,
          media_source_id: $tv.curSource.id,
        });
        $player.setInvalid(error.message);
        return;
      }
      await $tv.changeSourceFile(nextFile);
    })();
    $player.pause();
  });
  $player.onUrlChange(async ({ url }) => {
    $player.load(url);
  });
  if (view.query.rate) {
    $player.changeRate(Number(view.query.rate));
  }
  view.onHidden(() => {
    $player.pause();
  });
  // $logic.$tv.$source.onSubtitleLoaded(() => {
  //   $page.$subtitle.show();
  // });
  // $logic.$tv.$source.onSubtitleChange((v) => {
  //   setCurSubtitleState(v);
  // });
  // $logic.$player.onRateChange(({ rate }) => {
  //   setRate(rate);
  // });

  return {
    $tv,
    $player,
    $mediaReport,
    ready() {
      $tv.fetchProfile(view.query.id);
    },
    changeSkipTime(v: number) {
      $player.changeSkipTime(v);
      const nextSkip = {
        ...skip,
        [view.query.id]: v,
      };
      storage.merge("player_settings", {
        skip: nextSkip,
      });
    },
    handleClickElm(action: { elm: string; value: unknown }) {
      // console.log("[PAGE]media/season_playing - handleClickElm", target);
      const { elm, value } = action;
      if (!elm) {
        return;
      }
      if (elm === "play-menu") {
        $player.play();
        return;
      }
      if (elm === "pause-menu") {
        $player.pause();
        return;
      }
      if (elm === "arrow-left-menu") {
        history.back();
        return;
      }
      if (elm === "skip-forward-menu") {
        $tv.playNextEpisode();
        return;
      }
      if (elm === "subtitle-menu") {
        if ($tv.$source.subtitle === null) {
          return;
        }
        $player.toggleSubtitleVisible();
        $tv.$source.toggleSubtitleVisible();
        return;
      }
      if (elm === "skip-menu") {
        const currentTime = $tv.currentTime;
        const v = Number(currentTime);
        this.changeSkipTime(v);
        app.tip({
          text: [`设置片头跳过 ${seconds_to_minute(v)}`],
        });
        return;
      }
      if (elm === "copy-media-url-btn") {
        if ($tv.$source.profile) {
          app.copy($tv.$source.profile?.url);
          app.tip({
            text: ["复制成功"],
          });
          return;
        }
        app.tip({
          text: ["暂无播放地址"],
        });
        return;
      }
      if (elm === "report-media-error-btn") {
        $mediaReport.$dialog.show();
      }
    },
  };
}

class SeasonPlayingPageView {
  $view: RouteViewCore;
  $scroll: ScrollViewCore;

  $mask = new PresenceCore({ mounted: true, visible: true });
  $top = new PresenceCore({ mounted: true, visible: true });
  $bottom = new PresenceCore({ mounted: true, visible: true });
  $control = new PresenceCore({ mounted: true, visible: true });
  $subtitle = new PresenceCore({});
  $tmpRateTip = new PresenceCore({});
  $settings = new DialogCore();
  $episodes = new DialogCore();
  $nextEpisode = new DynamicContentCore({
    value: 1,
  });
  $icon = new DynamicContentCore({
    value: 1,
  });
  $episode = new DynamicContentInListCore({
    value: 1,
  });

  visible = true;
  timer: null | NodeJS.Timeout = null;

  constructor(props: Pick<ViewComponentProps, "app" | "view">) {
    const { app, view } = props;
    this.$view = view;
    this.$scroll = new ScrollViewCore({
      os: app.env,
    });
  }

  showControls() {
    this.visible = true;
    this.$top.show();
    this.$bottom.show();
    this.$control.show();
    this.$mask.show();
  }
  hideControls() {
    this.visible = false;
    this.$top.hide({ destroy: false });
    this.$bottom.hide({ destroy: false });
    this.$control.hide();
    this.$mask.hide();
  }
  toggleControls() {
    if (this.visible) {
      this.hideControls();
      return;
    }
    this.showControls();
  }
  attemptToShowControls() {
    if (this.timer !== null) {
      this.hideControls();
      clearTimeout(this.timer);
      this.timer = null;
      return false;
    }
    this.showControls();
    return true;
  }
  prepareHideControls() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.hideControls();
      this.timer = null;
    }, 3000);
  }
  prepareToggleControls() {
    if (this.timer === null) {
      this.toggleControls();
      return;
    }
    clearTimeout(this.timer);
    this.toggleControls();
  }
  stopHideControls() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const SeasonPlayingPageV2: ViewComponent = React.memo((props) => {
  const { app, client, history, storage, view } = props;

  const $logic = useInstance(() => SeasonPlayingPageLogic(props));
  const $page = useInstance(() => new SeasonPlayingPageView({ app, view }));
  const $node = useInstance(
    () =>
      new NodeCore({
        onLongPress() {
          if (!$logic.$tv.playing) {
            return;
          }
          $page.$tmpRateTip.show();
          $logic.$player.changeRateTmp(2);
        },
        onLongPressFinish() {
          $page.$tmpRateTip.hide();
          $logic.$player.recoverRate();
        },
      })
  );
  const [state, setProfile] = useState($logic.$tv.state);
  const [playerState, setPlayerState] = useState($logic.$player.state);

  const handleClickElm = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget as HTMLDivElement | null;
    if (target === null) {
      return;
    }
    // console.log("[PAGE]media/season_playing - handleClickElm", target);
    const { elm, stop, value } = target.dataset;
    if (!elm) {
      return;
    }
    if (stop) {
      event.stopPropagation();
    }
    $logic.handleClickElm({ elm, value });
  }, []);

  useInitialize(() => {
    $logic.$player.onStateChange((v) => setPlayerState(v));
    $logic.$tv.onStateChange((v) => setProfile(v));
    $logic.$player.beforeAdjustCurrentTime(() => {
      $page.stopHideControls();
    });
    // $logic.$player.afterAdjustCurrentTime(() => {
    //   $page.prepareHideControls();
    // });
    $logic.$player.onExitFullscreen(() => {
      $page.showControls();
    });
    $logic.ready();
  });

  return (
    <>
      <ScrollView
        store={$page.$scroll}
        className="fixed h-screen bg-w-bg-0 scroll--hidden"
        onClick={() => {
          // console.log('[PAGE]season/play - before $page.prepareToggleControls');
          $page.prepareToggleControls();
        }}
      >
        <div className="absolute z-10 top-[36%] left-[50%] w-full min-h-[120px] -translate-x-1/2 -translate-y-1/2">
          <Video store={$logic.$player} />
          <Presence
            className="z-20 absolute inset-0"
            enterClassName="animate-in fade-in"
            exitClassName="animate-out fade-out"
            store={$page.$mask}
          >
            <div className="absolute inset-0 bg-w-fg-1 dark:bg-black opacity-20"></div>
          </Presence>
          <div
            className="absolute z-30 top-[50%] left-[50%] min-h-[64px] text-w-bg-0 dark:text-w-fg-0 -translate-x-1/2 -translate-y-1/2"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Presence enterClassName="animate-in fade-in" exitClassName="animate-out fade-out" store={$page.$control}>
              <Show
                when={!playerState.error}
                fallback={
                  <div className="flex flex-col justify-center items-center">
                    <AlertTriangle className="w-16 h-16" />
                    <div
                      className="flex items-center mt-4"
                      onClick={(event) => {
                        event.stopPropagation();
                        history.push("root.help", { highlight: "" });
                      }}
                    >
                      <div className="text-center">{playerState.error}</div>
                      <div className="ml-2">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4 space-x-4 text-center text-sm">
                      <div data-elm="report-media-error-btn" data-stop="1" onClick={handleClickElm}>
                        反馈问题
                      </div>
                      <div data-elm="copy-media-url-btn" data-stop="1" onClick={handleClickElm}>
                        复制播放地址
                      </div>
                    </div>
                  </div>
                }
              >
                <Show when={!!playerState.ready} fallback={<Loader2 className="w-16 h-16 animate animate-spin" />}>
                  <div
                    className="flex items-center space-x-8"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div
                      className="relative"
                      onClick={() => {
                        $logic.$player.rewind();
                        $page.prepareHideControls();
                      }}
                    >
                      <ChevronsLeft className="w-12 h-12" />
                      <div className="absolute left-1/2 transform -translate-x-1/2 text-center text-sm">10s</div>
                    </div>
                    <div className="p-2">
                      <Show
                        when={playerState.playing}
                        fallback={
                          <div
                            onClick={() => {
                              $logic.$player.play();
                              $page.prepareHideControls();
                            }}
                          >
                            <Play className="relative left-[6px] w-20 h-20" />
                          </div>
                        }
                      >
                        <div
                          onClick={() => {
                            $logic.$player.pause();
                          }}
                        >
                          <Pause className="w-20 h-20" />
                        </div>
                      </Show>
                    </div>
                    <div
                      className="relative"
                      onClick={() => {
                        $logic.$player.speedUp();
                        $page.prepareHideControls();
                      }}
                    >
                      <ChevronsRight className="w-12 h-12" />
                      <div className="absolute left-1/2 transform -translate-x-1/2 text-center text-sm">10s</div>
                    </div>
                  </div>
                </Show>
              </Show>
            </Presence>
          </div>
        </div>
        <Node store={$node} className="__a absolute z-0 inset-0 text-w-fg-0">
          <div
            className="absolute top-0 z-40 w-full"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Presence
              store={$page.$top}
              className=""
              enterClassName="animate-in fade-in slide-in-from-top"
              exitClassName="animate-out slide-out-to-top fade-out"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center"
                  onClick={() => {
                    history.back();
                  }}
                  // onTouchEnd={() => {
                  //   history.back();
                  // }}
                >
                  <div className="inline-block p-4">
                    <ArrowLeft className="w-6 h-6" />
                  </div>
                  <Show when={!!state.curSource}>
                    <div className="max-w-[248px] truncate break-all">
                      {state.curSource?.order}、{state.curSource?.name}
                    </div>
                  </Show>
                </div>
                <Show when={app.env.ios}>
                  <div className="flex items-center">
                    <div
                      className="inline-block p-4"
                      onClick={(event) => {
                        $logic.$player.showAirplay();
                      }}
                    >
                      <Airplay className="w-6 h-6" />
                    </div>
                  </div>
                </Show>
              </div>
            </Presence>
          </div>
          <div
            className="absolute bottom-12 z-40 w-full safe-bottom"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* <Presence store={$page.$subtitle}>
              {(() => {
                if (subtitleState === null) {
                  return null;
                }
                if (!subtitleState.visible) {
                  return null;
                }
                return (
                  <div key={subtitleState.index} className="mb-16 space-y-1">
                    {subtitleState.texts.map((text) => {
                      return (
                        <div key={text} className="text-center text-lg">
                          {text}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Presence> */}
            <Presence
              className=""
              enterClassName="animate-in slide-in-from-bottom fade-in"
              exitClassName="animate-out slide-out-to-bottom fade-out"
              store={$page.$bottom}
            >
              <div className="px-4">
                <PlayerProgressBar store={$logic.$player} />
              </div>
              <div
                className="flex items-center flex-reverse space-x-4 mt-6 w-full px-2"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <div
                  className="flex items-center p-2 rounded-md space-x-2"
                  onClick={() => {
                    $page.$episodes.show();
                  }}
                >
                  <Layers className="w-6 h-6" />
                  <div className="">选集</div>
                </div>
                <div
                  className="relative p-2 rounded-md space-x-2"
                  onClick={async () => {
                    $page.$nextEpisode.set(2);
                    await $logic.$tv.playNextEpisode();
                    $page.$nextEpisode.set(1);
                  }}
                >
                  <DynamicContent
                    store={$page.$nextEpisode}
                    options={[
                      {
                        value: 1,
                        content: <SkipForward className="w-6 h-6" />,
                      },
                      {
                        value: 2,
                        content: (
                          <div>
                            <Loader className="w-6 h-6 animate animate-spin" />
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
                <div className="relative p-2 rounded-md cursor-pointer" data-elm="skip-menu" onClick={handleClickElm}>
                  {playerState?.skipText ? <div>{playerState?.skipText}</div> : <div>片头时间</div>}
                </div>
                <div
                  className="relative p-2 rounded-md"
                  onClick={() => {
                    $page.$settings.show();
                  }}
                >
                  <Settings className="w-6 h-6" />
                </div>
                <div
                  className="relative p-2 rounded-md"
                  onClick={() => {
                    $logic.$player.requestFullScreen();
                  }}
                >
                  <Maximize className="w-6 h-6" />
                </div>
              </div>
            </Presence>
          </div>
          <Presence store={$page.$tmpRateTip}>
            <div className="absolute left-1/2 bottom-[24%] -translate-x-1/2 text-center">
              <div className="flex flex-col items-center">
                <ChevronsRight className="w-8 h-8" />
                <div>2x速 快进中</div>
              </div>
            </div>
          </Presence>
        </Node>
      </ScrollView>
      <Sheet store={$page.$episodes} className="" size="lg">
        {(() => {
          if (state.profile === null) {
            return <div>Loading</div>;
          }
          if (state.groups.length === 0) {
            return null;
          }
          return (
            <div className="relative box-border h-full px-4 safe-bottom">
              <div className="flex space-x-2 max-w-full overflow-x-auto scroll--hidden">
                {state.groups.map((group) => {
                  const { text, list } = group;
                  return (
                    <div
                      key={text}
                      className={cn("p-2 whitespace-nowrap", state.curGroup?.text === text ? "underline" : "")}
                      onClick={() => {
                        $logic.$tv.fetchEpisodeOfGroup(group);
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-2 grid-cols-6">
                {(() => {
                  if (!state.curGroup) {
                    return null;
                  }
                  return state.curGroup.list.map((episode) => {
                    const { id, order } = episode;
                    return (
                      <div
                        key={order}
                        className={cn(
                          "relative flex justify-center items-center w-12 h-12 p-2 rounded-md bg-w-fg-3",
                          {}
                        )}
                        onClick={async () => {
                          // 这种情况是缺少了该集，但仍返回了 order 用于提示用户「这里本该有一集，但缺少了」
                          if (!id) {
                            app.tip({
                              text: ["该集无法播放，请反馈后等待处理"],
                            });
                            return;
                          }
                          $page.$episode.select(id);
                          $page.$episode.set(2);
                          await $logic.$tv.switchEpisode(episode);
                          $page.$episode.set(1);
                          $page.$episode.clear();
                          $page.$episodes.hide();
                        }}
                      >
                        {!id ? (
                          <div className="opacity-20">{order}</div>
                        ) : (
                          <DynamicContent
                            store={$page.$episode.bind(id)}
                            options={[
                              {
                                value: 1,
                                content: (
                                  <Show when={state.curSource?.id === id} fallback={<div>{order}</div>}>
                                    <div>
                                      <div className="absolute right-1 top-1 text-w-fg-1" style={{ fontSize: 10 }}>
                                        {order}
                                      </div>
                                      <PlayingIcon />
                                    </div>
                                  </Show>
                                ),
                              },
                              {
                                value: 2,
                                content: (
                                  <div>
                                    <Loader className="w-5 h-5 animate animate-spin" />
                                  </div>
                                ),
                              },
                            ]}
                          />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={$page.$settings} hideTitle size="lg">
        <SeasonMediaSettings
          $media={$logic.$tv}
          app={app}
          client={client}
          storage={storage}
          history={history}
          $player={$logic.$player}
        />
      </Sheet>
      <Dialog store={$logic.$mediaReport.$dialog}>
        <div className="text-w-fg-1">
          <p className="mt-2">「无法播放」</p>
        </div>
      </Dialog>
    </>
  );
});
