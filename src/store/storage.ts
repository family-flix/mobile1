import { MediaResolutionTypes } from "@/domains/source/constants";
import { StorageCore } from "@/domains/storage";

const DEFAULT_CACHE_VALUES = {
  user: {
    id: "",
    username: "anonymous",
    token: "",
    avatar: "",
  },
  player_settings: {
    rate: 1,
    volume: 0.5,
    type: MediaResolutionTypes.SD,
  },
  token_id: "",
  tv_search: {
    language: [] as string[],
  },
  movie_search: {
    language: [] as string[],
  },
};
export const cache = new StorageCore<typeof DEFAULT_CACHE_VALUES>({
  key: "m_global",
  values: DEFAULT_CACHE_VALUES,
  client: globalThis.localStorage,
});
