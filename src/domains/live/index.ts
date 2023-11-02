import axios from "axios";

import { BaseDomain, Handler } from "@/domains/base";
import { Result } from "@/types";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: LiveState;
};
type ChannelGroup = {
  title: string;
  logo: string;
  channels: {
    url: string;
  }[];
};
type LiveState = {
  groups: ChannelGroup[];
};

export class LiveCore extends BaseDomain<TheTypesOfEvents> {
  groups: ChannelGroup[] = [];
  get state(): LiveState {
    return {
      groups: this.groups,
    };
  }

  async fetchProfile() {
    const url = "https://live.fanmingming.com/tv/m3u/global.m3u";

    try {
      const r = await axios.get<string>(url);
      const { data } = r;
      const lines = data.split("\n");
      const groups: ChannelGroup[] = [];
      for (let i = 1; i < lines.length; i += 2) {
        (() => {
          const line = lines[i];
          console.log(line, lines[i + 1]);
          const channel = parseM3UInfoLine(line);
          if (channel === null) {
            return;
          }
          const { tvgName, tvgLogo } = channel;
          groups.push({
            title: tvgName,
            logo: tvgLogo,
            channels: [
              {
                url: lines[i + 1],
              },
            ],
          } as ChannelGroup);
        })();
      }
      this.groups = groups;
      console.log(groups);
      this.emit(Events.StateChange, { ...this.state });
    } catch (err) {
      // ...
      return Result.Err("获取列表失败");
    }
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events]>) {
    return this.on(Events.StateChange, handler);
  }
}

function parseM3UInfoLine(line: string) {
  const match = line.match(
    /#EXTINF:(-?\d+)\s*tvg-id="([^"]*)"\s*tvg-name="([^"]*)"\s*tvg-logo="([^"]*)"\s*group-title="([^"]*)",(.*)/
  );
  if (!match) {
    return null;
  }
  const info: {
    duration: number;
    tvgId: string;
    tvgName: string;
    tvgLogo: string;
    groupTitle: string;
    description: string;
  } = {
    duration: parseInt(match[1]),
    tvgId: match[2],
    tvgName: match[3],
    tvgLogo: match[4],
    groupTitle: match[5],
    description: match[6],
  };

  return info;
}
