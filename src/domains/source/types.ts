import { MediaResolutionTypes, MediaResolutionTypeTexts } from "./constants";

export type MediaSourceFile = {
  url: string;
  type: MediaResolutionTypes;
  typeText: string;
  width: number;
  height: number;
  thumbnail_path: string;
  resolutions: {
    url: string;
    type: MediaResolutionTypes;
    typeText: string;
    width: number;
    height: number;
  }[];
  subtitles: {}[];
};
