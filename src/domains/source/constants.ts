/** 影片分辨率 */
export enum MediaResolutionTypes {
  /** 标清 */
  LD = "LD",
  /** 普清 */
  SD = "SD",
  /** 高清 */
  HD = "HD",
  /** 超高清 */
  FHD = "FHD",
}
/** 影片分辨率中文描述 */
export const MediaResolutionTypeTexts = {
  [MediaResolutionTypes.LD]: "标清",
  [MediaResolutionTypes.SD]: "普清",
  [MediaResolutionTypes.HD]: "高清",
  [MediaResolutionTypes.FHD]: "4K",
};
