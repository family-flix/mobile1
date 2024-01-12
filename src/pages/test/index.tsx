import { SeasonMediaSettings } from "@/components/season-media-settings";
import { Node, Sheet } from "@/components/ui";
import { SeasonMediaCore } from "@/domains/media/season";
import { PlayerCore } from "@/domains/player";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { DialogCore, NodeCore } from "@/domains/ui";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { sleep } from "@/utils";

export const TestPage: ViewComponent = (props) => {
  const { app } = props;

  const dialog = useInstance(() => new DialogCore({}));
  const media = useInstance(() => new SeasonMediaCore());
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
        <div
          onClick={() => {
            dialog.show();
          }}
        >
          open
        </div>
        {/* <Node
          className="absolute top-[36%] left-[50%] w-full h-[120px] bg-w-fg-2 transition-all"
          style={{ transform: "translate(-50%, -50%)" }}
          store={node}
        ></Node>
        <div className="absolute top-[50%] left-[50%]" style={{ transform: "translate(-50%, -50%)" }}>
          <Loader2 className="w-10 h-10 text-w-bg-0 dark:text-w-fg-0 animate animate-spin" />
        </div> */}
        <Sheet store={dialog} hideTitle>
          <SeasonMediaSettings store={media} app={app} store2={player} />
        </Sheet>
      </div>
    </>
  );
};
