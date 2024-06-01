/**
 * @file 使用外部播放器打开指定视频文件
 */
import React, { useState } from "react";

import { ViewComponent } from "@/store/types";
import { TVCore } from "@/domains/tv";
import { ScrollView } from "@/components/ui";
import { ScrollViewCore } from "@/domains/ui";
import { NavigatorCore } from "@/domains/navigator";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { useInitialize, useInstance } from "@/hooks";

const players: { icon: string; name: string; scheme: string }[] = [
  // { icon: "iina", name: "IINA", scheme: "iina://weblink?url=$durl" },
  // { icon: "potplayer", name: "PotPlayer", scheme: "potplayer://$durl" },
  { icon: "vlc", name: "VLC", scheme: "vlc://$durl" },
  { icon: "nplayer", name: "nPlayer", scheme: "nplayer-$durl" },
  {
    icon: "infuse",
    name: "Infuse",
    scheme: "infuse://x-callback-url/play?url=$durl",
  },
  // {
  //   icon: "mxplayer",
  //   name: "MX Player",
  //   scheme: "intent:$durl#Intent;package=com.mxtech.videoplayer.ad;S.title=$name;end",
  // },
  // {
  //   icon: "mxplayer-pro",
  //   name: "MX Player Pro",
  //   scheme: "intent:$durl#Intent;package=com.mxtech.videoplayer.pro;S.title=$name;end",
  // },
];
export const TVOuterPlayersPage: ViewComponent = React.memo((props) => {
  const { app, client, history, storage, view } = props;

  const tv = useInstance(() => {
    const { type: resolution } = storage.get("player_settings");
    const tv = new TVCore({
      resolution,
      client,
    });
    // @ts-ignore
    window.__tv__ = tv;
    return tv;
  });
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
        // onPullToBack() {
        //   history.back();
        // },
      })
  );

  const [profile, setProfile] = useState(tv.profile);
  const [source, setSource] = useState(tv.curSource);

  useInitialize(() => {
    history.replace("root.home_layout.home_index", {
      id: view.params.id,
      season_id: view.query.season_id,
      token: storage.get("token_id") ?? "",
      outer: "1",
    });
    tv.onProfileLoaded((profile) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curEpisode } = profile;
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
      tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime, thumbnail: curEpisode.thumbnail });
    });
    tv.onEpisodeChange((nextEpisode) => {
      app.setTitle(tv.getTitle().join(" - "));
      // const { currentTime, thumbnail } = nextEpisode;
    });
    tv.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    tv.onSourceChange((mediaSource) => {
      console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
      setSource(mediaSource);
    });
    tv.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      // storage.merge("player_settings", {
      //   type,
      // });
    });
    tv.onTip((msg) => {
      app.tip(msg);
    });
    tv.fetchProfile(view.params.id, {
      season_id: view.query.season_id,
    });
  });

  return (
    <ScrollView store={scrollView} className="h-screen">
      <div className="p-8">
        {(() => {
          if (profile === null) {
            return null;
          }
          const { name, overview } = profile;
          return (
            <div>
              <div className="text-xl">{name}</div>
              <div className="mt-4">{overview}</div>
            </div>
          );
        })()}
        <div>
          {players.map((player) => {
            const { name, scheme } = player;
            const url = (() => {
              if (!source) {
                return null;
              }
              return scheme
                .replace(/\$durl/, source.url)
                .replace(/\$name/, profile ? profile.name : encodeURIComponent(source.url));
            })();
            if (!url) {
              return null;
            }
            return (
              <div className="py-2">
                <a href={url}>{name}</a>
                <div>{url}</div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollView>
  );
});
