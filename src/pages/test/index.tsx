import React, { useEffect, useState } from "react";

import { ViewComponent } from "@/store/types";
import { useInitialize, useInstance } from "@/hooks";
import { SeasonMediaSettings } from "@/components/season-media-settings";
import { Node, Sheet, Video } from "@/components/ui";
import { SeasonMediaCore } from "@/biz/media/season";
import { PlayerCore } from "@/domains/player";
import { MediaResolutionTypes } from "@/biz/source/constants";
import { DialogCore, NodeCore } from "@/domains/ui";
import { sleep } from "@/utils/index";

export const TestPage: ViewComponent = React.memo((props) => {
  const { app, client } = props;

  const player = useInstance(() => new PlayerCore({ app }));
  const [v, setV] = useState({ duration: 0 });

  useEffect(() => {
    player.setSize({
      width: 1280,
      height: 640,
    });
    player.onSourceLoaded((v) => {
      setV(v);
      const { width, height } = v;
      if (!width || !height) {
        return;
      }
      player.setSize({
        width,
        height,
      });
    });
    console.log("invoke1");
    // const url =
    //   "http://wxsnsdy.tc.qq.com/105/20210/snsdyvideodownload?filekey=30280201010421301f0201690402534804102ca905ce620b1241b726bc41dcff44e00204012882540400&bizid=1023&hy=SH&fileparam=302c020101042530230204136ffd93020457e3c4ff02024ef202031e8d7f02030f42400204045a320a0201000400";
    const url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
    player.onReady(() => {
      player.load(url);
    });
    // player.loadSource({
    //   url: "http://wxsnsdy.tc.qq.com/105/20210/snsdyvideodownload?filekey=30280201010421301f0201690402534804102ca905ce620b1241b726bc41dcff44e00204012882540400&bizid=1023&hy=SH&fileparam=302c020101042530230204136ffd93020457e3c4ff02024ef202031e8d7f02030f42400204045a320a0201000400",
    // });
  }, []);

  return (
    <>
      <div>
        <div className="w-full min-h-[240px]">
          <Video store={player} />
        </div>
        {v.duration}
      </div>
    </>
  );
});
