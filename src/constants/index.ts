/**
 * @doc https://www.iso.org/standard/63545.html
 */
export enum MediaSource {
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

export const MediaSourceTexts: Record<MediaSource, string> = {
  [MediaSource.CN]: "国产剧",
  [MediaSource.TW]: "台剧",
  [MediaSource.HK]: "港剧",
  [MediaSource.JP]: "日剧",
  [MediaSource.KR]: "韩剧",
  [MediaSource.US]: "美剧",
  [MediaSource.GB]: "英剧",
  [MediaSource.FR]: "法国",
  [MediaSource.IT]: "意大利",
  [MediaSource.BR]: "巴西",
  [MediaSource.DE]: "德国",
  [MediaSource.CA]: "加拿大",
  [MediaSource.AU]: "澳大利亚",
  [MediaSource.IN]: "印度",
  [MediaSource.RU]: "俄罗斯",
  [MediaSource.ES]: "西班牙",
  [MediaSource.MX]: "墨西哥",
  [MediaSource.ID]: "印度尼西亚",
  [MediaSource.TR]: "土耳其",
  [MediaSource.SA]: "沙特阿拉伯",
  [MediaSource.ZA]: "南非",
  [MediaSource.AR]: "阿根廷",
  [MediaSource.TH]: "泰国",
  [MediaSource.EG]: "埃及",
  [MediaSource.NL]: "荷兰",
  [MediaSource.CH]: "瑞士",
  [MediaSource.SE]: "瑞典",
  [MediaSource.PL]: "波兰",
  [MediaSource.PK]: "巴基斯坦",
  [MediaSource.NG]: "尼日利亚",
  [MediaSource.MY]: "马来西亚",
  [MediaSource.BD]: "孟加拉国",
};
export const MediaSourceOptions = Object.keys(MediaSourceTexts)
  .slice(0, 7)
  .map((value) => {
    return {
      value,
      label: MediaSourceTexts[value as MediaSource],
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
export const TVGenresOptions = TVGenres.map((text) => {
  return {
    label: text,
    value: text,
  };
});
export const MovieGenres = [
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
export const MovieGenresOptions = TVGenres.map((text) => {
  return {
    label: text,
    value: text,
  };
});
