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
import { Sheet, ScrollView, Video } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { PlayingIcon } from "@/components/playing";
import { PlayerProgressBar } from "@/components/ui/video-progress-bar";
import { SeasonMediaSettings } from "@/components/season-media-settings";
import { DynamicContent } from "@/components/dynamic-content";
import { SeasonMediaCore } from "@/biz/media/season";
import { createVVTSubtitle } from "@/biz/subtitle/utils";
import { ScrollViewCore, DialogCore, PresenceCore } from "@/domains/ui";
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
  $tv.onProfileLoaded((profile) => {
    app.setTitle($tv.getTitle().join(" - "));
    const { curSource: curEpisode } = profile;
    // const episodeIndex = tv.curGroup ? tv.curGroup.list.findIndex((e) => e.id === curEpisode.id) : -1;
    // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name, episodeIndex);
    // const EPISODE_CARD_WIDTH = 120;
    // if (episodeIndex !== -1) {
    //   episodeView.scrollTo({ left: episodeIndex * (EPISODE_CARD_WIDTH + 8) });
    // }
    $tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime ?? 0 });
    $player.setCurrentTime(curEpisode.currentTime);
    // bottomOperation.show();
  });
  $tv.$source.onSubtitleLoaded((subtitle) => {
    $player.showSubtitle(createVVTSubtitle(subtitle));
  });
  $tv.onEpisodeChange((curEpisode) => {
    app.setTitle($tv.getTitle().join(" - "));
    const { currentTime } = curEpisode;
    // nextEpisodeLoader.unload();
    $player.setCurrentTime(currentTime);
    // const episodeIndex = tv.curGroup ? tv.curGroup.list.findIndex((e) => e.id === curEpisode.id) : -1;
    // const EPISODE_CARD_WIDTH = 120;
    // if (episodeIndex !== -1) {
    //   episodeView.scrollTo({ left: episodeIndex * (EPISODE_CARD_WIDTH + 8) });
    // }
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
    console.log("[PAGE]play - player.onCanPlay", $player.hasPlayed, currentTime);
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
  // console.log("[PAGE]play - before player.onError");
  $player.onError(async (error) => {
    console.log("[PAGE]play - player.onError", error);
    await (async () => {
      if (!$tv.curSource) {
        return;
      }
      const files = $tv.curSource.files;
      const curFileId = $tv.curSource.curFileId;
      const curFileIndex = files.findIndex((f) => f.id === curFileId);
      const nextIndex = curFileIndex + 1;
      const nextFile = files[nextIndex];
      if (!nextFile) {
        app.tip({ text: ["视频加载错误", error.message] });
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
  // $logic.$player.onCanPlay((v) => {
  //   $page.prepareHide();
  // });
  // if (!view.query.hide_menu) {
  //   scrollView.onPullToBack(() => {
  //     app.back();
  //   });
  // }

  return {
    $tv,
    $player,
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

  show() {
    this.$top.show();
    this.$bottom.show();
    this.$control.show();
    this.$mask.show();
    this.visible = true;
  }
  hide() {
    this.$top.hide();
    this.$bottom.hide();
    this.$control.hide();
    this.$mask.hide();
    this.visible = false;
  }
  toggle() {
    this.$top.toggle();
    this.$bottom.toggle();
    this.$control.toggle();
    this.$mask.toggle();
    this.visible = !this.visible;
  }
  attemptToShow() {
    if (this.timer !== null) {
      this.hide();
      clearTimeout(this.timer);
      this.timer = null;
      return false;
    }
    this.show();
    return true;
  }
  prepareHide() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.hide();
      this.timer = null;
    }, 3000);
  }
  prepareToggle() {
    if (this.timer === null) {
      this.toggle();
      return;
    }
    clearTimeout(this.timer);
    this.toggle();
  }
  stopHide() {
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
  const [state, setProfile] = useState($logic.$tv.state);
  const [playerState, setPlayerState] = useState($logic.$player.state);

  const handleClickElm = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget as HTMLDivElement | null;
    if (target === null) {
      return;
    }
    // console.log("[PAGE]media/season_playing - handleClickElm", target);
    const { elm, value } = target.dataset;
    if (!elm) {
      return;
    }
    $logic.handleClickElm({ elm, value });
  }, []);

  useInitialize(() => {
    $logic.$player.onStateChange((v) => setPlayerState(v));
    $logic.$tv.onStateChange((v) => setProfile(v));
    $logic.$player.beforeAdjustCurrentTime(() => {
      $page.stopHide();
    });
    $logic.$player.afterAdjustCurrentTime(() => {
      $page.prepareHide();
    });
    $logic.$player.onExitFullscreen(() => {
      $page.show();
    });
    $logic.ready();
  });

  return (
    <>
      <ScrollView
        store={$page.$scroll}
        className="fixed h-screen bg-w-bg-0 scroll--hidden"
        onClick={() => {
          $page.prepareToggle();
        }}
      >
        <div className="absolute z-10 top-[36%] left-[50%] w-full min-h-[120px] -translate-x-1/2 -translate-y-1/2">
          <Video store={$logic.$player} />
          <Presence enterClassName="animate-in fade-in" exitClassName="animate-out fade-out" store={$page.$mask}>
            <div className="absolute z-20 inset-0 bg-w-fg-1 dark:bg-black opacity-20"></div>
          </Presence>
          <div className="absolute z-30 top-[50%] left-[50%] min-h-[64px] text-w-bg-0 dark:text-w-fg-0 -translate-x-1/2 -translate-y-1/2">
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
                    <div
                      className="mt-4 text-center text-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        if ($logic.$tv.$source.profile) {
                          app.copy($logic.$tv.$source.profile?.url);
                          app.tip({
                            text: ["复制成功"],
                          });
                          return;
                        }
                        app.tip({
                          text: ["暂无播放地址"],
                        });
                      }}
                    >
                      复制播放地址
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
                        $page.prepareHide();
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
                              $page.prepareHide();
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
                        $page.prepareHide();
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
        <div className="absolute z-0 inset-0 text-w-fg-0">
          <div
            className="absolute top-0 z-40 w-full"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Presence
              store={$page.$top}
              className={cn("flex items-center justify-between")}
              enterClassName="animate-in fade-in slide-in-from-top"
              exitClassName="animate-out slide-out-to-top fade-out"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="flex items-center">
                <div
                  className="inline-block p-4"
                  onClick={() => {
                    history.back();
                  }}
                >
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
                <div
                  className="relative p-2 rounded-md cursor-pointer"
                  data-elm="skip-menu"
                  onClick={handleClickElm}
                >
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
        </div>
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
                      className={cn("p-2", state.curGroup?.text === text ? "underline" : "")}
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
    </>
  );
});
