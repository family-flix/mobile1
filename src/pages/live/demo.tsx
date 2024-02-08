/**
 * @file 直播
 */
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ViewComponent } from "@/store/types";
import { Dialog, ScrollView, Video } from "@/components/ui";
import { ScrollViewCore, DialogCore, ToggleCore, PresenceCore } from "@/domains/ui";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { RefCore } from "@/domains/cur";
import { PlayerCore } from "@/domains/player";
import { OrientationTypes } from "@/domains/app";
import { useInitialize, useInstance } from "@/hooks";
import { LiveCore } from "@/domains/live";
import { cn } from "@/utils";

export const TVChannelTestPlayingPage: ViewComponent = React.memo((props) => {
  const { app, storage, view } = props;

  const settingsRef = useInstance(() => {
    const r = new RefCore<{
      volume: number;
      rate: number;
      type: MediaResolutionTypes;
    }>({
      value: storage.get("player_settings"),
    });
    return r;
  });
  const scrollView = useInstance(() => new ScrollViewCore({}));
  const live = useInstance(() => new LiveCore());
  const player = useInstance(() => {
    const { volume, rate } = settingsRef.value!;
    const player = new PlayerCore({ app, volume });
    // @ts-ignore
    window.__player__ = player;
    return player;
  });
  const fullscreenDialog = useInstance(
    () =>
      new DialogCore({
        title: "进入全屏播放",
        cancel: false,
        onOk() {
          fullscreenDialog.hide();
          player.requestFullScreen();
        },
      })
  );
  const errorTipDialog = useInstance(() => {
    const dialog = new DialogCore({
      title: "视频加载错误",
      cancel: false,
      onOk() {
        dialog.hide();
      },
    });
    dialog.okBtn.setText("我知道了");
    return dialog;
  });
  const cover = useInstance(() => new ToggleCore({ boolean: true }));
  const topOperation = useInstance(() => new PresenceCore({ mounted: true, open: true }));
  const bottomOperation = useInstance(() => new PresenceCore({}));

  const [profile, setProfile] = useState(live.state);

  useInitialize(() => {
    const { hide_menu } = view.query;
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
          fullscreenDialog.show();
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
        fullscreenDialog.hide();
        console.log("[PAGE]tv/play - app.onOrientationChange");
      }
    });
    view.onHidden(() => {
      player.pause();
    });
    if (!hide_menu) {
      scrollView.onPullToBack(() => {
        history.back();
      });
    }
    player.onExitFullscreen(() => {
      player.pause();
      if (app.orientation === OrientationTypes.Vertical) {
        player.disableFullscreen();
      }
    });
    player.onReady(() => {
      player.disableFullscreen();
    });
    player.onCanPlay(() => {
      console.log("[PAGE]play - player.onCanPlay", player.hasPlayed, view.state.visible);
      if (!view.state.visible) {
        return;
      }
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
    player.onPause(({ currentTime, duration }) => {
      console.log("[PAGE]play - player.onPause", currentTime, duration);
    });
    player.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      // player.setCurrentTime(tv.currentTime);
    });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded");
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      console.log("[PAGE]play - player.onError", error);
      // router.replaceSilently(`/out_players?token=${token}&tv_id=${view.params.id}`);
      app.tip({ text: ["视频加载错误", error.message] });
      player.pause();
    });
    player.onUrlChange(async ({ url, thumbnail }) => {
      const $video = player.node()!;
      // if (player.canPlayType("application/vnd.apple.mpegurl")) {
      //   player.load(url);
      //   return;
      // }
      const mod = await import("hls.js");
      const Hls2 = mod.default;
      console.log("support", Hls2.isSupported());
      if (Hls2.isSupported()) {
        const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
        Hls.attachMedia($video);
        Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
          Hls.loadSource(url);
        });
        return;
      }
      player.load(url);
    });
    live.onStateChange((v) => {
      setProfile(v);
    });
    if (hide_menu) {
      setTimeout(() => {
        topOperation.hide();
        bottomOperation.hide();
      }, 1000);
    }
    live.fetchProfile();
    // app.setTitle(name);
    // setTimeout(() => {
    //   player.loadSource({ url: build(url) });
    // }, 1000);
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
      <div className="">
        {/* <div className="operations text-w-fg-1">
          <div
            className={cn("z-10 absolute inset-0")}
            onClick={() => {
              topOperation.toggle();
              bottomOperation.toggle();
            }}
          >
            <div className="flex items-center justify-between">
              <Presence
                store={topOperation}
                className={cn(
                  "animate-in fade-in slide-in-from-top",
                  "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:fade-out"
                )}
              >
                {!view.query.hide_menu && (
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div
                      className="inline-block p-4"
                      onClick={() => {
                        app.back();
                      }}
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </Presence>
            </div>
          </div>
        </div> */}
        <div className="video z-20 fixed w-full top-[12%]">
          {(() => {
            return <Video store={player} />;
          })()}
        </div>
        <div className="h-screen overflow-y-auto">
          {profile.groups.map((group, i) => {
            const { title, channels } = group;
            return (
              <div key={i}>
                <div>{title}</div>
                {channels.map((channel) => {
                  const { url } = channel;
                  return (
                    <div
                      key={url}
                      onClick={() => {
                        player.loadSource({ url: build(url) });
                        player.setSize({ width: 750, height: 360 });
                      }}
                    >
                      {url}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

function build(url: string) {
  const prefix = "https://proxy.f1x.fun/api/proxy/?u=";
  // return prefix + encodeURIComponent(url);
  return url;
}
