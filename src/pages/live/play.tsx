/**
 * @file 电视频道 播放
 */
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { useInitialize, useInstance } from "@/hooks/index";
import { ScrollView, Video } from "@/components/ui";
import { ScrollViewCore, DialogCore, ToggleCore, PresenceCore } from "@/domains/ui";
import { MediaResolutionTypes } from "@/biz/source/constants";
import { RefCore } from "@/domains/cur/index";
import { PlayerCore } from "@/domains/player/index";
import { OrientationTypes } from "@/domains/app/index";
import { Presence } from "@/components/ui/presence";
import { cn } from "@/utils/index";

function TVChannelPlayingPageLogic(props: ViewComponentProps) {
  const { app, storage, view } = props;

  const values = storage.get("player_settings");
  const { name, url, hide_menu } = view.query;

  const settingsRef = new RefCore<{
    volume: number;
    rate: number;
    type: MediaResolutionTypes;
  }>({
    value: values,
  });
  const scrollView = new ScrollViewCore({
    os: app.env,
  });
  const { volume, rate } = values;
  const player = new PlayerCore({ app, volume });
  const fullscreenDialog = new DialogCore({
    title: "进入全屏播放",
    cancel: false,
    onOk() {
      fullscreenDialog.hide();
      player.requestFullScreen();
    },
  });
  const errorTipDialog = new DialogCore({
    title: "视频加载错误",
    cancel: false,
    onOk() {
      errorTipDialog.hide();
    },
  });
  const cover = new ToggleCore({ boolean: true });
  const topOperation = new PresenceCore({ mounted: true, visible: true });
  const bottomOperation = new PresenceCore({});

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
  // if (!hide_menu) {
  //   scrollView.onPullToBack(() => {
  //     history.back();
  //   });
  // }
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
    (() => {
      if (error.message.includes("格式")) {
        errorTipDialog.show();
        return;
      }
      app.tip({ text: ["视频加载错误", error.message] });
    })();
    player.pause();
  });
  player.onUrlChange(async ({ url, thumbnail }) => {
    const $video = player.node()!;
    const mod = await import("hls.js");
    const Hls2 = mod.default;
    if (Hls2.isSupported()) {
      const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
      Hls.attachMedia($video as HTMLVideoElement);
      Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
        Hls.loadSource(url);
      });
      return;
    }
    player.load(url);
  });

  setTimeout(() => {
    player.loadSource({ url });
    player.setSize({ width: app.screen.width, height: 360 });
  }, 1000);

  return {
    scrollView,
    player,
    topOperation,
    bottomOperation,
    errorTipDialog,
    ready() {},
  };
}

export const TVChannelPlayingPage: ViewComponent = React.memo((props) => {
  const { app, storage, history, client, view } = props;

  const $logic = useInstance(() => TVChannelPlayingPageLogic(props));

  useInitialize(() => {
    $logic.ready();
  });

  return (
    <>
      <ScrollView store={$logic.scrollView} className="fixed">
        <div className="h-screen">
          <div className="operations text-w-fg-1">
            <div
              className={cn("z-10 absolute inset-0")}
              onClick={() => {
                $logic.topOperation.toggle();
                $logic.bottomOperation.toggle();
              }}
            >
              <div className="flex items-center justify-between">
                <Presence
                  store={$logic.topOperation}
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
                          history.back();
                        }}
                        // onTouchEnd={() => {
                        //   history.back();
                        // }}
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </div>
                      {/* <div>{view.query.name}</div> */}
                    </div>
                  )}
                </Presence>
              </div>
            </div>
          </div>
          <div className="video z-20 fixed w-full top-[12%]">
            {(() => {
              return <Video store={$logic.player} />;
            })()}
          </div>
        </div>
      </ScrollView>
    </>
  );
});
