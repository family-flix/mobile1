/**
 * @file 电影播放页面
 */
import React, { useState } from "react";
import {
  Airplay,
  AlertTriangle,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Loader2,
  Maximize,
  Pause,
  Play,
  Settings,
} from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Show } from "@/packages/ui/show";
import { Sheet, ScrollView, Video } from "@/components/ui";
import { MovieMediaSettings } from "@/components/movie-media-settings";
import { Presence } from "@/components/ui/presence";
import { PlayerProgressBar } from "@/components/ui/video-progress-bar";
import { ScrollViewCore, DialogCore, PresenceCore } from "@/domains/ui";
import { RouteViewCore } from "@/domains/route_view";
import { MovieMediaCore } from "@/domains/media/movie";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { RefCore } from "@/domains/cur";
import { PlayerCore } from "@/domains/player";
import { createVVTSubtitle } from "@/domains/subtitle/utils";
import { OrientationTypes } from "@/domains/app";
import { useInitialize, useInstance } from "@/hooks/index";
import { cn, seconds_to_hour, sleep } from "@/utils/index";

function MoviePlayingPageLogic(props: ViewComponentProps) {
  const { app, client, storage } = props;

  const settings = storage.get("player_settings");
  const $settings = new RefCore<{
    volume: number;
    rate: number;
    type: MediaResolutionTypes;
  }>({
    value: settings,
  });
  const { type: resolution, volume, rate } = settings;
  const tv = new MovieMediaCore({
    resolution,
    client,
  });
  const $tv = tv;
  const player = new PlayerCore({ app, volume, rate });
  const $report = new RefCore<string>();
  const $player = player;

  app.onHidden(() => {
    player.pause();
  });
  app.onShow(() => {
    console.log("[PAGE]play - app.onShow", player.currentTime);
    // 锁屏后 currentTime 不是锁屏前的
    player.setCurrentTime(player.currentTime);
  });
  app.onOrientationChange((orientation) => {
    console.log("[PAGE]tv/play - app.onOrientationChange", orientation, app.screen.width);
    if (orientation === "horizontal") {
      if (!player.hasPlayed && app.env.ios) {
        //   $$fullscreenDialog.show();
        return;
      }
      if (player.isFullscreen) {
        return;
      }
      player.requestFullScreen();
      player.isFullscreen = true;
    }
    if (orientation === "vertical") {
      player.disableFullscreen();
      // $$fullscreenDialog.hide();
    }
  });
  player.onExitFullscreen(() => {
    player.pause();
    if (app.orientation === OrientationTypes.Vertical) {
      player.disableFullscreen();
    }
  });
  tv.onProfileLoaded((profile) => {
    app.setTitle(tv.getTitle().join(" - "));
    const { curSource } = profile;
    // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
    tv.playSource(curSource, { currentTime: curSource.currentTime ?? 0 });
    player.setCurrentTime(curSource.currentTime);
    //       bottomOperation.show();
  });
  $tv.beforeLoadSubtitle(() => {
    // console.log("[PAGE]season - $tv.beforeLoadSubtitle");
    $player.clearSubtitle();
  });
  tv.$source.onSubtitleLoaded((subtitle) => {
    player.showSubtitle(createVVTSubtitle(subtitle));
  });
  tv.onTip((msg) => {
    app.tip(msg);
  });
  tv.onSourceFileChange((mediaSource) => {
    // console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
    player.pause();
    player.setSize({ width: mediaSource.width, height: mediaSource.height });
    storage.merge("player_settings", {
      type: mediaSource.type,
    });
    // loadSource 后开始 video loadstart 事件
    player.loadSource(mediaSource);
  });
  player.onReady(() => {
    player.disableFullscreen();
  });
  player.onCanPlay(() => {
    const { currentTime } = tv;
    console.log("[PAGE]play - player.onCanPlay", player.hasPlayed, currentTime);
    function applySettings() {
      player.setCurrentTime(currentTime);
      const { rate } = $settings.value!;
      if (rate) {
        player.changeRate(Number(rate));
      }
    }
    (async () => {
      if (app.env.android) {
        await sleep(1000);
      }
      applySettings();
    })();
    if (!player.hasPlayed) {
      return;
    }
    player.play();
  });
  player.onVolumeChange(({ volume }) => {
    storage.merge("player_settings", {
      volume,
    });
  });
  player.onProgress(({ currentTime, duration }) => {
    // console.log("[PAGE]TVPlaying - onProgress", currentTime);
    if (!player._canPlay) {
      return;
    }
    tv.handleCurTimeChange({
      currentTime,
      duration,
    });
  });
  player.onPause(({ currentTime, duration }) => {
    console.log("[PAGE]play - player.onPause", currentTime, duration);
    tv.updatePlayProgressForce({
      currentTime,
      duration,
    });
  });
  // player.onEnd(() => {
  //   console.log("[PAGE]play - player.onEnd");
  //   tv.playNextEpisode();
  // });
  player.onResolutionChange(({ type }) => {
    console.log("[PAGE]play - player.onResolutionChange", type, tv.currentTime);
    // player.setCurrentTime(tv.currentTime);
  });
  player.onSourceLoaded(() => {
    console.log("[PAGE]play - player.onSourceLoaded", tv.currentTime);
    player.setCurrentTime(tv.currentTime);
    if (!player.hasPlayed) {
      return;
    }
    //       episodesSheet.hide();
    //       sourcesSheet.hide();
    //       resolutionSheet.hide();
  });
  // console.log("[PAGE]play - before player.onError");
  player.onError(async (error) => {
    console.log("[PAGE]play - player.onError", tv.curSource?.name, tv.curSource?.curFileId);
    // router.replaceSilently(`/out_players?token=${token}&tv_id=${view.params.id}`);
    await (async () => {
      if (!tv.curSource) {
        return;
      }
      const files = tv.curSource.files;
      const curFileId = tv.curSource.curFileId;
      const curFileIndex = files.findIndex((f) => f.id === curFileId);
      const nextIndex = curFileIndex + 1;
      const nextFile = files[nextIndex];
      if (!nextFile) {
        app.tip({ text: ["视频加载错误", error.message] });
        player.setInvalid(error.message);
        return;
      }
      await tv.changeSourceFile(nextFile);
    })();
    player.pause();
  });
  player.onUrlChange(async ({ url }) => {
    player.load(url);
  });

  return {
    $tv,
    $player,
    $report,
  };
}

class MoviePlayingPageView {
  $view: RouteViewCore;
  $scroll: ScrollViewCore;

  $mask = new PresenceCore({ mounted: true, visible: true });
  $top = new PresenceCore({ mounted: true, visible: true });
  $bottom = new PresenceCore({ mounted: true, visible: true });
  $control = new PresenceCore({ mounted: true, visible: true });
  $time = new PresenceCore({});
  $subtitle = new PresenceCore({});
  $settings = new DialogCore();
  $episodes = new DialogCore();

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
    }, 5000);
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

export const MoviePlayingPageV2: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  const $logic = useInstance(() => MoviePlayingPageLogic(props));
  const $page = useInstance(() => new MoviePlayingPageView({ app, view }));

  const [state, setProfile] = useState($logic.$tv.state);
  // const [curSource, setCurSource] = useState($logic.$tv.$source.profile);
  // const [subtileState, setCurSubtitleState] = useState($logic.$tv.$source.subtitle);
  const [targetTime, setTargetTime] = useState<null | string>(null);
  const [playerState, setPlayerState] = useState($logic.$player.state);
  // const [shareLink, setShareLink] = useState("");
  // const [curReportValue, setCurReportValue] = useState($logic.$report.value);

  useInitialize(() => {
    if (view.query.rate) {
      $logic.$player.changeRate(Number(view.query.rate));
    }
    view.onHidden(() => {
      $logic.$player.pause();
    });
    // if (!view.query.hide_menu) {
    //   $page.$scrollView.onPullToBack(() => {
    //     app.back();
    //   });
    // }
    // if (view.query.hide_menu) {
    //   setTimeout(() => {
    //     topOperation.hide();
    //     bottomOperation.hide();
    //   }, 1000);
    // }
    $logic.$tv.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    $logic.$player.onStateChange((v) => {
      setPlayerState(v);
    });
    $logic.$player.onTargetTimeChange((v) => {
      setTargetTime(seconds_to_hour(v));
    });
    $logic.$player.beforeAdjustCurrentTime(() => {
      $page.$time.show();
      $page.stopHide();
    });
    $logic.$player.afterAdjustCurrentTime(() => {
      $page.prepareHide();
      $page.$time.hide();
    });
    $logic.$tv.fetchProfile(view.query.id);
  });

  // console.log("[PAGE]TVPlayingPage - render", tvId);

  // if (error) {
  //   return (
  //     <div className="w-full h-[100vh]">
  //       <div className="center text-center">{error}</div>
  //     </div>
  //   );
  // }

  return (
    <>
      <ScrollView
        store={$page.$scroll}
        className="fixed h-screen bg-w-bg-0 scroll--hidden"
        onClick={(event) => {
          $page.prepareToggle();
        }}
      >
        <div className="absolute z-10 top-[36%] left-[50%] w-full min-h-[120px] -translate-x-1/2 -translate-y-1/2">
          <Video store={$logic.$player} />
          <Presence
            // className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
            enterClassName="animate-in fade-in"
            exitClassName="animate-out fade-out"
            store={$page.$mask}
          >
            <div className="absolute z-20 inset-0 bg-w-fg-1 dark:bg-w-bg-1 opacity-20"></div>
          </Presence>
          <div className="absolute z-30 top-[50%] left-[50%] text-w-bg-0 dark:text-w-fg-0 -translate-x-1/2 -translate-y-1/2">
            <Presence
              // className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
              enterClassName="animate-in fade-in"
              exitClassName="animate-out fade-out"
              store={$page.$control}
            >
              <Show
                when={!playerState.error}
                fallback={
                  <div className="flex flex-col justify-center items-center">
                    <AlertTriangle className="w-16 h-16" />
                    <div className="flex items-center mt-4">
                      <div className="text-center">{playerState.error}</div>
                      <div
                        className="ml-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          history.push("root.help", { highlight: "" });
                        }}
                      >
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
                            <Play className="relative left-[6px] w-16 h-16" />
                          </div>
                        }
                      >
                        <div
                          onClick={() => {
                            $logic.$player.pause();
                            $page.prepareHide();
                          }}
                        >
                          <Pause className="w-16 h-16" />
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
            className=""
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Presence
              store={$page.$top}
              className={cn(
                "flex items-center justify-between",
                "animate-in fade-in slide-in-from-top",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:fade-out"
              )}
              enterClassName="animate-in fade-in slide-in-from-top"
              exitClassName="animate-out fade-out slide-out-to-top"
            >
              <div
                className="inline-block p-4"
                onClick={() => {
                  history.back();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
              <div className="flex items-center">
                {/* <div className="inline-block p-4">
                  <PictureInPicture className="w-6 h-6" />
                </div> */}
                <div
                  className="inline-block p-4"
                  onClick={() => {
                    $logic.$player.showAirplay();
                  }}
                >
                  <Airplay className="w-6 h-6" />
                </div>
              </div>
            </Presence>
          </div>
          <div
            className="absolute bottom-12 w-full safe-bottom"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Presence store={$page.$time}>
              <div className="text-center text-xl">{targetTime}</div>
            </Presence>
            {/* <Presence store={$page.$subtitle}>
              {(() => {
                if (subtileState === null) {
                  return;
                }
                return (
                  <div key={subtileState.index} className="mb-16 space-y-1">
                    {subtileState.texts.map((text) => {
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
      <Sheet store={$page.$settings} hideTitle>
        <MovieMediaSettings
          $media={$logic.$tv}
          $player={$logic.$player}
          app={app}
          client={client}
          history={history}
          storage={storage}
        />
      </Sheet>
      {/* <Dialog store={fullscreenDialog}>
        <div className="text-w-fg-1">点击进入全屏播放</div>
      </Dialog> */}
    </>
  );
});
