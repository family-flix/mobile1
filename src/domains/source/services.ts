import { TmpRequestResp, request } from "@/domains/request/utils";
import { SubtitleFileResp } from "@/domains/subtitle/types";
import { Result, Unpacked, UnpackedResult } from "@/types";

import { MediaResolutionTypeTexts, MediaResolutionTypes } from "./constants";

/**
 * 获取视频源播放信息
 */
export function fetchSourcePlayingInfo(body: { id: string; type: MediaResolutionTypes }) {
  return request.post<{
    id: string;
    /** 缩略图 */
    thumbnail_path: string;
    /** 视频分辨率 */
    type: MediaResolutionTypes;
    /** 视频播放地址 */
    url: string;
    /** 视频宽度 */
    width: number;
    /** 视频高度 */
    height: number;
    invalid: number;
    /** 该视频其他分辨率 */
    other: {
      cur: boolean;
      /** 影片分辨率 */
      type: MediaResolutionTypes;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
    subtitles: SubtitleFileResp[];
  }>("/api/v2/wechat/source", {
    id: body.id,
    type: body.type,
  });
}
export function fetchSourcePlayingInfoProcess(r: TmpRequestResp<typeof fetchSourcePlayingInfo>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, url, width, height, thumbnail_path, type, invalid, other, subtitles } = r.data;
  return Result.Ok({
    id,
    url,
    type,
    typeText: MediaResolutionTypeTexts[type],
    width,
    height,
    invalid,
    thumbnailPath: thumbnail_path,
    resolutions: other.map((t) => {
      const { cur, url, width, height, type } = t;
      return {
        cur,
        url,
        type,
        typeText: MediaResolutionTypeTexts[t.type],
        width,
        height,
      };
    }),
    subtitles,
  });
}
export type MediaSourceFile = UnpackedResult<Unpacked<ReturnType<typeof fetchSourcePlayingInfoProcess>>>;
