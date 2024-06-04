import React from "react";

import { ViewComponent } from "@/store/types";
import { useInitialize, useInstance } from "@/hooks";
import { SeasonMediaSettings } from "@/components/season-media-settings";
import { Node, Sheet } from "@/components/ui";
import { SeasonMediaCore } from "@/biz/media/season";
import { PlayerCore } from "@/domains/player";
import { MediaResolutionTypes } from "@/biz/source/constants";
import { DialogCore, NodeCore } from "@/domains/ui";
import { sleep } from "@/utils/index";

export const TestPage: ViewComponent = React.memo((props) => {
  const { app, client } = props;

  const dialog = useInstance(() => new DialogCore({}));
  const media = useInstance(() => new SeasonMediaCore({ client }));
  const player = useInstance(() => new PlayerCore({ app }));
  const node = useInstance(() => new NodeCore());

  useInitialize(() => {
    media.fetchProfile("uqvNeD0v6QHMWHT");
    media.onProfileLoaded((profile) => {
      console.log(profile);
      if (!profile.curSource) {
        return;
      }
      media.playEpisode(profile.curSource, { currentTime: profile.curSource.currentTime });
    });
    // (async () => {
    //   await sleep(3000);
    //   node.setStyles("height: 240px; transform: translate(-50%, -50%);");
    // })();
  });

  return (
    <>
      <div>
        <div className="grid grid-cols-4 gap-4">
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
          <div className="w-6 h-6 bg-w-bg-2"></div>
        </div>
      </div>
    </>
  );
});
