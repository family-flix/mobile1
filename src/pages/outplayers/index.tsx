/**
 * @file 使用外部播放器打开指定视频文件
 */
import React, { useState } from "react";

import { ViewComponent } from "@/store/types";
import { SeasonMediaCore } from "@/domains/media/season";
import { useInitialize, useInstance } from "@/hooks";

const players: { icon: string; name: string; scheme: string }[] = [
  { icon: "iina", name: "IINA", scheme: "iina://weblink?url=$durl" },
  { icon: "potplayer", name: "PotPlayer", scheme: "potplayer://$durl" },
  { icon: "vlc", name: "VLC", scheme: "vlc://$durl" },
  { icon: "nplayer", name: "nPlayer", scheme: "nplayer-$durl" },
  {
    icon: "infuse",
    name: "Infuse",
    scheme: "infuse://x-callback-url/play?url=$durl",
  },
  {
    icon: "mxplayer",
    name: "MX Player",
    scheme: "intent:$durl#Intent;package=com.mxtech.videoplayer.ad;S.title=$name;end",
  },
  {
    icon: "mxplayer-pro",
    name: "MX Player Pro",
    scheme: "intent:$durl#Intent;package=com.mxtech.videoplayer.pro;S.title=$name;end",
  },
];
export const OuterPlayersPage: ViewComponent = React.memo((props) => {
  const { app, client, view } = props;

  const tv = useInstance(() => new SeasonMediaCore({ client }));
  const [profile, setProfile] = useState(tv.profile);
  const [source, setSource] = useState(tv.$source.profile);

  useInitialize(() => {
    tv.onProfileLoaded((data) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curSource: curEpisode } = data;
      setProfile(data.profile);
      tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime });
    });
    tv.onEpisodeChange(() => {
      app.setTitle(tv.getTitle().join(" - "));
    });
    // tv.onStateChange((nextProfile) => {
    //   setProfile(nextProfile);
    // });
    tv.onSourceFileChange((mediaSource) => {
      setSource(mediaSource);
    });
    tv.onTip((msg) => {
      app.tip(msg);
    });
    tv.fetchProfile(view.query.tv_id);
  });

  return (
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
          return (
            <div className="py-2">
              <a href={`vlc://${source?.url}`}>{name}</a>
            </div>
          );
        })}
      </div>
    </div>
  );
});
