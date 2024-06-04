import { describe, it, expect, vi } from "vitest";

import { MediaOriginCountry } from "@/constants";

import { SeasonMediaCore } from "@/biz/media/season";
import { Result } from "@/domains/result/index";
import { originalEpisodes, processedEpisodes, processedEpisodes2 } from "./episodes";
import { HttpClientCore } from "@/domains/http_client";
import { UserCore } from "@/biz/user";

// const spy = vi.spyOn(window, "open");
// const window = vi.fn(() => ({
//   location: {
//     origin: "",
//   },
//   locationStorage: {
//     getItem: vi.fn(),
//   },
// }));
vi.mock("@/store/request", async () => {
  return {
    __esModule: true,
    request: {
      post(url: string) {
        if (url === "/api/v2/wechat/media/episode") {
          return Result.Ok({
            list: originalEpisodes,
          });
        }
      },
      get() {},
    },
  };
});
const client = new HttpClientCore({
  hostname: "",
});
const user = new UserCore(
  {
    id: "",
    username: "",
    email: "",
    avatar: "",
    token: "",
  },
  client
);

describe("播放下一集", () => {
  it("只有一个分组，第一集", async () => {
    const sourceGroups = [
      {
        text: "1-4",
        cur: true,
        media_id: "HlqLEtf6b3ZrBiZ",
        start: 1,
        end: 4,
        list: processedEpisodes,
      },
    ];
    const curSource = {
      id: "7TDa2SFyaTN7Qib",
      name: "清汤锅与挞",
      overview:
        "莱欧斯所带领的冒险团队在迷宫深处讨伐红龙时，因为饥饿遭到团灭。他的妹妹法琳拼死将全团传送到地面，自己却被红龙吞食。为了赶在妹妹被消化前打败红龙及时将妹妹复活，莱欧斯决定尝试完全「自给自足」的冒险：直接在迷宫中获取食物……",
      seasonId: "HlqLEtf6b3ZrBiZ",
      order: 1,
      runtime: "00:26",
      stillPath: "https://www.themoviedb.org/t/p/w227_and_h127_bestv2/ael2MBZSYR7EwFFmCC77jFgPzg.jpg",
      files: [
        {
          id: "av6NEI8SmbD7AML",
          name: "源1",
          invalid: false,
          order: 1,
        },
        {
          id: "7gKJlbE1UCCds6D",
          name: "源2",
          invalid: false,
          order: 2,
        },
      ],
      subtitles: [],
    };
    const $season = new SeasonMediaCore({
      client,
    });
    $season.profile = {
      id: "HlqLEtf6b3ZrBiZ",
      name: "迷宫饭",
      overview:
        "莱欧斯所带领的冒险团队在地下城深处挑战红龙时，因为饥饿遭到团灭。男主角的妹妹拼死将全团传送到地面，自己却被红龙吞噬。为了及时将妹妹复活，男主角必须赶在她化为粪便之前（一个月内）打倒红龙。为此，他在缺乏补给的情况下与团队仅存的精灵妹魔法师（吐槽役担当）和半身人盗贼（门面担当，误）直接返回地下城，期望以打倒的魔物作为食物补充。（实际上，男主对魔物有超出常理的喜爱，已进入不吃魔物欲壑难填的境地。）他们很快遇到长期生活在地下城、有丰富猎食魔物经验的矮人战士大叔。由此，组成新的四人探险队，以救回妹妹为目的，展开了地下城的魔物美食之旅。",
      posterPath: "/poster/uBA7rpLPppkRI0UPIXpA9tSZvDr.jpg",
    };
    // @ts-ignore
    $season.curSource = curSource;
    // @ts-ignore
    $season.sourceGroups = sourceGroups;
    // @ts-ignore
    $season.curGroup = sourceGroups.find((group) => group.cur) ?? null;

    const r = await $season.getNextEpisode();
    if (r.error) {
      return;
    }
    const nextEpisode = r.data;
    expect(nextEpisode).toStrictEqual({
      id: "D1IY5sLnKkjfeEI",
      name: "烤蛇尾鸡 / 蛋包饭与什锦天妇罗",
      overview:
        "先西认为，在探索迷宫时，营养均衡的饮食非常重要。为此，莱欧斯和伙伴们这次将目标瞄准了鸡身蛇尾的魔物「巴西利斯克」，以获得营养丰富的蛋和肉。 在探索过程中，他们正好遇到了惨遭蛇尾鸡攻击而近乎全军覆没的新人冒险家团队，危难关头，精通迷宫魔物生态的莱欧斯决定……",
      seasonId: "HlqLEtf6b3ZrBiZ",
      order: 2,
      runtime: "00:26",
      stillPath: "https://www.themoviedb.org/t/p/w227_and_h127_bestv2/A8jLhaALvOZFli7weOl579ifrWW.jpg",
      files: [
        {
          id: "qCbAKSSHPBz1Ku8",
          name: "源1",
          invalid: false,
          order: 1,
        },
        {
          id: "cTe1WUV6oB2ndpo",
          name: "源2",
          invalid: false,
          order: 2,
        },
      ],
      subtitles: [],
    });
  });

  it("只有一个分组，最后一集", async () => {
    const sourceGroups = [
      {
        text: "1-4",
        cur: true,
        media_id: "HlqLEtf6b3ZrBiZ",
        start: 1,
        end: 4,
        list: processedEpisodes,
      },
    ];
    const curSource = {
      id: "gZIn5HzZ6Q93BgD",
      name: "第 4 集",
      overview: "",
      seasonId: "HlqLEtf6b3ZrBiZ",
      order: 4,
      runtime: null,
      stillPath: null,
      files: [
        {
          id: "2eHCLLZHOsT9UYz",
          name: "源1",
          invalid: false,
          order: 1,
        },
      ],
      subtitles: [],
    };
    const $season = new SeasonMediaCore({ client });
    $season.profile = {
      id: "HlqLEtf6b3ZrBiZ",
      name: "迷宫饭",
      overview:
        "莱欧斯所带领的冒险团队在地下城深处挑战红龙时，因为饥饿遭到团灭。男主角的妹妹拼死将全团传送到地面，自己却被红龙吞噬。为了及时将妹妹复活，男主角必须赶在她化为粪便之前（一个月内）打倒红龙。为此，他在缺乏补给的情况下与团队仅存的精灵妹魔法师（吐槽役担当）和半身人盗贼（门面担当，误）直接返回地下城，期望以打倒的魔物作为食物补充。（实际上，男主对魔物有超出常理的喜爱，已进入不吃魔物欲壑难填的境地。）他们很快遇到长期生活在地下城、有丰富猎食魔物经验的矮人战士大叔。由此，组成新的四人探险队，以救回妹妹为目的，展开了地下城的魔物美食之旅。",
      posterPath: "/poster/uBA7rpLPppkRI0UPIXpA9tSZvDr.jpg",
    };
    // @ts-ignore
    $season.curSource = curSource;
    // @ts-ignore
    $season.sourceGroups = sourceGroups;
    // @ts-ignore
    $season.curGroup = sourceGroups.find((group) => group.cur) ?? null;

    const r = await $season.getNextEpisode();
    expect(r.data).toBe(null);
    expect(r.error?.message).toBe("已经是最后一集了");
  });

  it("两个分组，第一个分组最后一集", async () => {
    const sourceGroups = [
      {
        text: "1-20",
        cur: true,
        media_id: "Zrau1ZBtR8oGUq3",
        start: 1,
        end: 20,
        list: processedEpisodes2,
      },
      {
        text: "21-40",
        cur: false,
        media_id: "Zrau1ZBtR8oGUq3",
        start: 21,
        end: 40,
        list: [],
      },
    ];
    const curSource = {
      id: "boBU2xKdg5oUkrt",
      name: "澜沣对华姝的偏爱",
      overview:
        "华姝竞选五尊失败十分生澜沣的气，却不知澜沣熟知她的所作所为，仍屡屡包容她的利用和算计，甚至为她受罚。面对澜沣的偏爱，华姝终于向澜沣敞开心扉。",
      seasonId: "Zrau1ZBtR8oGUq3",
      order: 20,
      runtime: "00:45",
      stillPath: "https://www.themoviedb.org/t/p/w227_and_h127_bestv2/3SLQ5Hh3b5gH8qFnLW5DK1Zvwhr.jpg",
      files: [
        {
          id: "HcfD9KrpbRN6va8",
          name: "源1",
          invalid: false,
          order: 1,
        },
        {
          id: "WbJRbs8QuTL21hl",
          name: "源2",
          invalid: false,
          order: 2,
        },
      ],
      subtitles: [],
    };
    const $season = new SeasonMediaCore({ client });
    $season.profile = {
      id: "HlqLEtf6b3ZrBiZ",
      name: "迷宫饭",
      overview:
        "莱欧斯所带领的冒险团队在地下城深处挑战红龙时，因为饥饿遭到团灭。男主角的妹妹拼死将全团传送到地面，自己却被红龙吞噬。为了及时将妹妹复活，男主角必须赶在她化为粪便之前（一个月内）打倒红龙。为此，他在缺乏补给的情况下与团队仅存的精灵妹魔法师（吐槽役担当）和半身人盗贼（门面担当，误）直接返回地下城，期望以打倒的魔物作为食物补充。（实际上，男主对魔物有超出常理的喜爱，已进入不吃魔物欲壑难填的境地。）他们很快遇到长期生活在地下城、有丰富猎食魔物经验的矮人战士大叔。由此，组成新的四人探险队，以救回妹妹为目的，展开了地下城的魔物美食之旅。",
      posterPath: "/poster/uBA7rpLPppkRI0UPIXpA9tSZvDr.jpg",
    };
    // @ts-ignore
    $season.curSource = curSource;
    // @ts-ignore
    $season.sourceGroups = sourceGroups;
    // @ts-ignore
    $season.curGroup = sourceGroups.find((group) => group.cur) ?? null;

    const r = await $season.getNextEpisode();
    expect(r.error).toBe(null);
    if (r.error) {
      return;
    }
    const nextEpisode = r.data;
    expect(nextEpisode).toStrictEqual({
      id: "hQialxpTBJHca0S",
      name: "化神丹",
      overview:
        "凤隐八片仙元回归，肉身得以安然，古晋却心痛如绞，去找碧波寻给阿音续命的办法，得知要救阿音需炼制化神丹。化神丹材料十分难得，古晋四处寻觅，甚至答应华姝过分的要求，从华姝手中拿到炼制化神丹的材料，华姝好事在即，真心与古晋结善缘，古晋道以后有任何事都赴汤蹈火在所不辞。",
      order: 21,
      runtime: "00:46",
      seasonId: undefined,
      stillPath: undefined,
      subtitles: undefined,
      files: [
        {
          id: "J8GmV7zAZd5Vr5j",
          name: "源1",
          order: 1,
          invalid: false,
        },
        {
          id: "sXH94M9Y7jDEaDh",
          name: "源2",
          order: 2,
          invalid: false,
        },
      ],
    });
  });
});
