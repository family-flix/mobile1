export const __VERSION__ = "2.2.0";
/**
 * @doc https://www.iso.org/standard/63545.html
 */
export enum MediaOriginCountry {
  US = "US", // 美国 (United States)
  CN = "CN", // 中国 (China)
  TW = "TW", // 中国台湾 (Taiwan)
  HK = "HK", // 中国香港 (Hong Kong)
  JP = "JP", // 日本 (Japan)
  DE = "DE", // 德国 (Germany)
  GB = "GB", // 英国 (United Kingdom)
  FR = "FR", // 法国 (France)
  IT = "IT", // 意大利 (Italy)
  BR = "BR", // 巴西 (Brazil)
  CA = "CA", // 加拿大 (Canada)
  AU = "AU", // 澳大利亚 (Australia)
  IN = "IN", // 印度 (India)
  RU = "RU", // 俄罗斯 (Russia)
  KR = "KR", // 韩国 (South Korea)
  BE = "BE", // 比利时
  ES = "ES", // 西班牙 (Spain)
  MX = "MX", // 墨西哥 (Mexico)
  ID = "ID", // 印度尼西亚 (Indonesia)
  TR = "TR", // 土耳其 (Turkey)
  SA = "SA", // 沙特阿拉伯 (Saudi Arabia)
  ZA = "ZA", // 南非 (South Africa)
  AR = "AR", // 阿根廷 (Argentina)
  TH = "TH", // 泰国 (Thailand)
  EG = "EG", // 埃及 (Egypt)
  NL = "NL", // 荷兰 (Netherlands)
  CH = "CH", // 瑞士 (Switzerland)
  SE = "SE", // 瑞典 (Sweden)
  PL = "PL", // 波兰 (Poland)
  PK = "PK", // 巴基斯坦 (Pakistan)
  NG = "NG", // 尼日利亚 (Nigeria)
  MY = "MY", // 马来西亚 (Malaysia)
  BD = "BD", // 孟加拉国 (Bangladesh)
}

export const SeasonMediaOriginCountryTexts: Record<MediaOriginCountry, string> = {
  [MediaOriginCountry.CN]: "国产剧",
  [MediaOriginCountry.TW]: "台剧",
  [MediaOriginCountry.HK]: "港剧",
  [MediaOriginCountry.JP]: "日剧",
  [MediaOriginCountry.KR]: "韩剧",
  [MediaOriginCountry.US]: "美剧",
  [MediaOriginCountry.GB]: "英剧",
  [MediaOriginCountry.FR]: "法国",
  [MediaOriginCountry.IT]: "意大利",
  [MediaOriginCountry.BR]: "巴西",
  [MediaOriginCountry.BE]: "比利时",
  [MediaOriginCountry.DE]: "德国",
  [MediaOriginCountry.CA]: "加拿大",
  [MediaOriginCountry.AU]: "澳大利亚",
  [MediaOriginCountry.IN]: "印度",
  [MediaOriginCountry.RU]: "俄罗斯",
  [MediaOriginCountry.ES]: "西班牙",
  [MediaOriginCountry.MX]: "墨西哥",
  [MediaOriginCountry.ID]: "印度尼西亚",
  [MediaOriginCountry.TR]: "土耳其",
  [MediaOriginCountry.SA]: "沙特阿拉伯",
  [MediaOriginCountry.ZA]: "南非",
  [MediaOriginCountry.AR]: "阿根廷",
  [MediaOriginCountry.TH]: "泰国",
  [MediaOriginCountry.EG]: "埃及",
  [MediaOriginCountry.NL]: "荷兰",
  [MediaOriginCountry.CH]: "瑞士",
  [MediaOriginCountry.SE]: "瑞典",
  [MediaOriginCountry.PL]: "波兰",
  [MediaOriginCountry.PK]: "巴基斯坦",
  [MediaOriginCountry.NG]: "尼日利亚",
  [MediaOriginCountry.MY]: "马来西亚",
  [MediaOriginCountry.BD]: "孟加拉国",
};
export const TVSourceOptions = Object.keys(SeasonMediaOriginCountryTexts)
  .slice(0, 7)
  .map((value) => {
    return {
      value,
      label: SeasonMediaOriginCountryTexts[value as MediaOriginCountry],
    };
  });
export const TVGenres = [
  "动作冒险",
  "动画",
  "喜剧",
  "犯罪",
  "纪录",
  "剧情",
  "家庭",
  "儿童",
  "悬疑",
  "新闻",
  "真人秀",
  "Sci-Fi & Fantasy",
  "肥皂剧",
  "脱口秀",
  "War & Politics",
  "西部",
];
export const SeasonGenresTexts: Record<string, string> = TVGenres.map((text) => {
  return {
    [text]: (() => {
      if (text === "Sci-Fi & Fantasy") {
        return "奇幻";
      }
      if (text === "War & Politics") {
        return "战争/政治";
      }
      return text;
    })(),
  };
}).reduce((r, c) => {
  return {
    ...r,
    ...c,
  };
}, {});
export const TVGenresOptions = TVGenres.map((text) => {
  return {
    label: SeasonGenresTexts[text],
    value: text,
  };
});

export const MovieMediaOriginCountryTexts: Record<MediaOriginCountry, string> = {
  [MediaOriginCountry.CN]: "中国大陆",
  [MediaOriginCountry.TW]: "中国台湾",
  [MediaOriginCountry.HK]: "中国香港",
  [MediaOriginCountry.JP]: "日本",
  [MediaOriginCountry.KR]: "韩国",
  [MediaOriginCountry.US]: "美国",
  [MediaOriginCountry.GB]: "英国",
  [MediaOriginCountry.FR]: "法国",
  [MediaOriginCountry.IT]: "意大利",
  [MediaOriginCountry.BR]: "巴西",
  [MediaOriginCountry.DE]: "德国",
  [MediaOriginCountry.CA]: "加拿大",
  [MediaOriginCountry.AU]: "澳大利亚",
  [MediaOriginCountry.IN]: "印度",
  [MediaOriginCountry.RU]: "俄罗斯",
  [MediaOriginCountry.BE]: "比利时",
  [MediaOriginCountry.ES]: "西班牙",
  [MediaOriginCountry.MX]: "墨西哥",
  [MediaOriginCountry.ID]: "印度尼西亚",
  [MediaOriginCountry.TR]: "土耳其",
  [MediaOriginCountry.SA]: "沙特阿拉伯",
  [MediaOriginCountry.ZA]: "南非",
  [MediaOriginCountry.AR]: "阿根廷",
  [MediaOriginCountry.TH]: "泰国",
  [MediaOriginCountry.EG]: "埃及",
  [MediaOriginCountry.NL]: "荷兰",
  [MediaOriginCountry.CH]: "瑞士",
  [MediaOriginCountry.SE]: "瑞典",
  [MediaOriginCountry.PL]: "波兰",
  [MediaOriginCountry.PK]: "巴基斯坦",
  [MediaOriginCountry.NG]: "尼日利亚",
  [MediaOriginCountry.MY]: "马来西亚",
  [MediaOriginCountry.BD]: "孟加拉国",
};
export const MovieOriginCountryOptions = Object.keys(MovieMediaOriginCountryTexts)
  .slice(0, 7)
  .map((value) => {
    return {
      value,
      label: MovieMediaOriginCountryTexts[value as MediaOriginCountry],
    };
  });
export const MovieMediaGenres = [
  "动作",
  "冒险",
  "动画",
  "喜剧",
  "犯罪",
  "纪录",
  "剧情",
  "家庭",
  "奇幻",
  "历史",
  "恐怖",
  "音乐",
  "悬疑",
  "爱情",
  "科幻",
  "电视电影",
  "惊悚",
  "战争",
  "西部",
];
export const MovieMediaGenresTexts: Record<string, string> = TVGenres.map((text) => {
  return {
    [text]: text,
  };
}).reduce((t, c) => {
  return {
    ...t,
    ...c,
  };
}, {});
export const MovieGenresOptions = MovieMediaGenres.map((text) => {
  return {
    label: text,
    value: text,
  };
});

export enum ReportTypes {
  /** 电视剧问题 */
  Season,
  /** 电影问题 */
  Movie,
  /** 问题与建议 */
  Question,
  /** 想看什么剧 */
  Want,
}
export const SeasonReportList = ["信息有误", "无法播放", "重复", "缺少字幕", "集/季数不全"];
export const MovieReportList = ["信息有误", "无法播放", "重复", "缺少字幕"];
export const CommonReportList = [""];

export enum MediaTypes {
  Season = 1,
  Movie = 2,
}

export const players: { icon: string; name: string; scheme: string }[] = [
  // { icon: "iina", name: "IINA", scheme: "iina://weblink?url=$durl" },
  // { icon: "potplayer", name: "PotPlayer", scheme: "potplayer://$durl" },
  {
    icon: "https://cdn.weipaitang.com/static/20230928ab23e98c-d8fc-e98cd8fc-453a-47af288db8d1-W512H512",
    name: "VLC",
    scheme: "vlc://$durl",
  },
  {
    icon: "https://cdn.weipaitang.com/static/202309288011c2c9-a6b1-c2c9a6b1-2699-dc5136ed6657-W225H225",
    name: "nPlayer",
    scheme: "nplayer-$durl",
  },
  {
    icon: "https://cdn.weipaitang.com/static/202309288f2eda45-7eba-da457eba-fe3c-c9ce239b8020-W170H170",
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

export enum CollectionTypes {
  /** 手动创建 */
  Manually = 1,
  /** 每日更新 */
  DailyUpdate = 2,
  /** 每日更新草稿 */
  DailyUpdateDraft = 3,
}
