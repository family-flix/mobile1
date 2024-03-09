/**
 * @file 电视剧播放页面
 */
import React, { useMemo, useState } from "react";
import {
  Airplay,
  AlertTriangle,
  ArrowLeft,
  FastForward,
  Layers,
  Loader,
  Loader2,
  Maximize,
  Pause,
  Play,
  Rewind,
  Settings,
  SkipForward,
} from "lucide-react";

import { GlobalStorageValues, ViewComponent } from "@/store/types";
import { Show } from "@/packages/ui/show";
import { Sheet, ScrollView, Video } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { PlayingIcon } from "@/components/playing";
import { PlayerProgressBar } from "@/components/ui/video-progress-bar";
import { SeasonMediaSettings } from "@/components/season-media-settings";
import { DynamicContent } from "@/components/dynamic-content";
import { ScrollViewCore, DialogCore, PresenceCore } from "@/domains/ui";
import { SeasonMediaCore } from "@/domains/media/season";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { RefCore } from "@/domains/cur";
import { PlayerCore } from "@/domains/player";
import { createVVTSubtitle } from "@/domains/subtitle/utils";
import { Application, OrientationTypes } from "@/domains/app";
import { RouteViewCore } from "@/domains/route_view";
import { DynamicContentCore, DynamicContentInListCore } from "@/domains/ui/dynamic-content";
import { StorageCore } from "@/domains/storage";
import { HttpClientCore } from "@/domains/http_client";
import { useInitialize, useInstance } from "@/hooks";
import { cn, seconds_to_hour } from "@/utils";

class SeasonPlayingPageLogic<
  P extends { app: Application; client: HttpClientCore; storage: StorageCore<GlobalStorageValues> }
> {
  $app: P["app"];
  $storage: P["storage"];
  $client: P["client"];
  $tv: SeasonMediaCore;
  $player: PlayerCore;
  $settings: RefCore<{
    volume: number;
    rate: number;
    type: MediaResolutionTypes;
  }>;

  settings: {
    volume: number;
    rate: number;
    type: MediaResolutionTypes;
  };

  constructor(props: P) {
    const { app, storage, client } = props;

    this.$app = app;
    this.$storage = storage;
    this.$client = client;

    const settings = storage.get("player_settings");
    this.settings = settings;
    this.$settings = new RefCore({
      value: settings,
    });
    const { type: resolution, volume, rate } = settings;
    const tv = new SeasonMediaCore({
      client,
      resolution,
    });
    this.$tv = tv;
    const player = new PlayerCore({ app, volume, rate });
    this.$player = player;
    console.log("[PAGE]play - useInitialize");

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
          // fullscreenDialog.show();
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
        // fullscreenDialog.hide();
        // console.log("[PAGE]tv/play - app.onOrientationChange", tv.curSourceFile?.width, tv.curSourceFile?.height);
        if (tv.$source.profile) {
          const { width, height } = tv.$source.profile;
          player.setSize({ width, height });
        }
      }
    });
    player.onExitFullscreen(() => {
      player.pause();
      // if (tv.curSourceFile) {
      //   player.setSize({ width: tv.curSourceFile.width, height: tv.curSourceFile.height });
      // }
      if (app.orientation === OrientationTypes.Vertical) {
        player.disableFullscreen();
      }
    });
    tv.onProfileLoaded((profile) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curSource: curEpisode } = profile;
      // const episodeIndex = tv.curGroup ? tv.curGroup.list.findIndex((e) => e.id === curEpisode.id) : -1;
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name, episodeIndex);
      // const EPISODE_CARD_WIDTH = 120;
      // if (episodeIndex !== -1) {
      //   episodeView.scrollTo({ left: episodeIndex * (EPISODE_CARD_WIDTH + 8) });
      // }
      tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime ?? 0 });
      player.setCurrentTime(curEpisode.currentTime);
      // bottomOperation.show();
    });
    tv.$source.onSubtitleLoaded((subtitle) => {
      player.showSubtitle(createVVTSubtitle(subtitle));
    });
    tv.onEpisodeChange((curEpisode) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { currentTime } = curEpisode;
      // nextEpisodeLoader.unload();
      player.setCurrentTime(currentTime);
      // const episodeIndex = tv.curGroup ? tv.curGroup.list.findIndex((e) => e.id === curEpisode.id) : -1;
      // const EPISODE_CARD_WIDTH = 120;
      // if (episodeIndex !== -1) {
      //   episodeView.scrollTo({ left: episodeIndex * (EPISODE_CARD_WIDTH + 8) });
      // }
      player.pause();
    });
    tv.onTip((msg) => {
      app.tip(msg);
    });
    tv.onBeforeNextEpisode(() => {
      player.pause();
    });
    tv.onSourceFileChange((mediaSource) => {
      console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
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
      const _self = this;
      function applySettings() {
        player.setCurrentTime(currentTime);
        const { rate } = _self.settings;
        if (rate) {
          player.changeRate(Number(rate));
        }
      }
      (() => {
        if (app.env.android) {
          setTimeout(() => {
            applySettings();
          }, 1000);
          return;
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
      // console.log("[PAGE]tv/play_v2 - onProgress", currentTime, !player._canPlay);
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
    player.onEnd(() => {
      console.log("[PAGE]play - player.onEnd");
      tv.playNextEpisode();
    });
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
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError(async (error) => {
      console.log("[PAGE]play - player.onError", error);
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
      const $video = player.node()!;
      console.log("[]player.onUrlChange", url, player.canPlayType("application/vnd.apple.mpegurl"), $video);
      if (player.canPlayType("application/vnd.apple.mpegurl")) {
        player.load(url);
        return;
      }
      const mod = await import("hls.js");
      const Hls2 = mod.default;
      if (Hls2.isSupported() && url.includes("m3u8")) {
        const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
        Hls.attachMedia($video);
        Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
          Hls.loadSource(url);
        });
        return;
      }
      player.load(url);
    });
  }
}
class SeasonPlayingPageView {
  $view: RouteViewCore;
  $scroll = new ScrollViewCore({});

  $mask = new PresenceCore({ mounted: true, open: true });
  $top = new PresenceCore({ mounted: true, open: true });
  $bottom = new PresenceCore({ mounted: true, open: true });
  $control = new PresenceCore({ mounted: true, open: true });
  $time = new PresenceCore({});
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

  constructor(props: { view: RouteViewCore }) {
    const { view } = props;
    this.$view = view;
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

export const SeasonPlayingPageV2: ViewComponent = React.memo((props) => {
  const { app, client, history, storage, view } = props;

  // const loadingPresence = useInstance(() => new PresenceCore());
  // const fullscreenDialog = useInstance(
  //   () =>
  //     new DialogCore({
  //       title: "进入全屏播放",
  //       cancel: false,
  //       onOk() {
  //         fullscreenDialog.hide();
  //         player.requestFullScreen();
  //       },
  //     })
  // );
  // const errorTipDialog = useInstance(() => {
  //   const dialog = new DialogCore({
  //     title: "视频加载错误",
  //     cancel: false,
  //     onOk() {
  //       dialog.hide();
  //     },
  //   });
  //   dialog.okBtn.setText("我知道了");
  //   return dialog;
  // });
  const $logic = useInstance(() => new SeasonPlayingPageLogic({ app, client, storage }));
  const $page = useInstance(() => new SeasonPlayingPageView({ view }));

  const [state, setProfile] = useState($logic.$tv.state);
  // const [curSource, setCurSource] = useState($logic.$tv.$source.profile);
  const [subtitleState, setCurSubtitleState] = useState($logic.$tv.$source.subtitle);
  const [targetTime, setTargetTime] = useState<null | string>(null);
  const [playerState, setPlayerState] = useState($logic.$player.state);
  // const [shareLink, setShareLink] = useState("");
  // const [curReportValue, setCurReportValue] = useState(curReport.value);

  useInitialize(() => {
    if (view.query.rate) {
      $logic.$player.changeRate(Number(view.query.rate));
      return;
    }
    view.onHidden(() => {
      $logic.$player.pause();
    });
    $logic.$tv.onStateChange((v) => {
      setProfile(v);
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
    $logic.$player.onExitFullscreen(() => {
      $page.show();
    });
    // $logic.$player.onCanPlay((v) => {
    //   $page.prepareHide();
    // });
    // if (!view.query.hide_menu) {
    //   scrollView.onPullToBack(() => {
    //     app.back();
    //   });
    // }
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
        className="fixed h-screen bg-w-bg-0"
        onClick={() => {
          $page.prepareToggle();
        }}
      >
        <div className="absolute z-10 top-[36%] left-[50%] w-full min-h-[120px] -translate-x-1/2 -translate-y-1/2">
          <Video store={$logic.$player} />
          <Presence
            className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
            store={$page.$mask}
          >
            <div className="absolute z-20 inset-0 bg-w-fg-1 dark:bg-black opacity-20"></div>
          </Presence>
          <div className="absolute z-30 top-[50%] left-[50%] min-h-[64px] text-w-bg-0 dark:text-w-fg-0  -translate-x-1/2 -translate-y-1/2">
            <Presence
              className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
              store={$page.$control}
            >
              <Show
                when={!playerState.error}
                fallback={
                  <div className="flex flex-col justify-center items-center">
                    <AlertTriangle className="w-16 h-16" />
                    <div className="mt-4 text-center">{playerState.error}</div>
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
                    <Rewind
                      className="w-8 h-8"
                      onClick={() => {
                        $logic.$player.rewind();
                        $page.prepareHide();
                      }}
                    />
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
                          }}
                        >
                          <Pause className="w-16 h-16" />
                        </div>
                      </Show>
                    </div>
                    <FastForward
                      className="w-8 h-8"
                      onClick={() => {
                        $logic.$player.speedUp();
                        $page.prepareHide();
                      }}
                    />
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
              className={cn(
                "flex items-center justify-between",
                "animate-in fade-in slide-in-from-top",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:fade-out"
              )}
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
              {app.env.ios ? (
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
              ) : null}
            </Presence>
          </div>
          <div
            className="absolute bottom-12 z-40 w-full safe-bottom"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Presence store={$page.$time}>
              <div className="text-center text-xl">{targetTime}</div>
            </Presence>
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
              className={cn(
                "animate-in fade-in slide-in-from-bottom",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:fade-out"
              )}
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
                        key={id}
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
          store={$logic.$tv}
          app={app}
          client={client}
          storage={storage}
          history={history}
          store2={$logic.$player}
        />
      </Sheet>
      {/* <Dialog store={errorTipDialog}>
        <div className=" text-w-fg-1">
          <div>该问题是因为手机无法解析视频</div>
          <div>可以尝试如下解决方案</div>
          <div className="mt-4 text-left space-y-4">
            <div>1、「切换源」或者「分辨率」</div>
            <div>
              <div>2、使用电脑观看</div>
              <div
                className="mt-2 break-all"
                onClick={() => {
                  app.copy(window.location.href.replace(/mobile/, "pc"));
                  app.tip({
                    text: ["已复制到剪贴板"],
                  });
                }}
              >
                {window.location.href.replace(/mobile/, "pc")}
              </div>
            </div>
            <div>
              <div>3、使用手机外部播放器</div>
              <div className="flex items-center mt-2 space-x-2">
                {players.map((player) => {
                  const { icon, name, scheme } = player;
                  const url = (() => {
                    if (!curSource) {
                      return null;
                    }
                    return scheme
                      .replace(/\$durl/, curSource.url)
                      .replace(/\$name/, state.profile ? state.profile.name : encodeURIComponent(curSource.url));
                  })();
                  if (!url) {
                    return null;
                  }
                  return (
                    <a key={name} className="flex justify-center relative px-4 h-14" href={url}>
                      <LazyImage className="w-8 h-8 rounded-full" src={icon} />
                      <div className="absolute bottom-0 w-full text-center">{name}</div>
                    </a>
                  );
                })}
              </div>
              <div className="mt-2 font-sm text-w-fg-2">
                <div>需要至少安装了一款上述软件，推荐安装 VLC</div>
                <div>点击仍没有反应请点击右上角，并选择「在浏览器中打开」</div>
              </div>
            </div>
          </div>
        </div>
      </Dialog> */}
    </>
  );
});
