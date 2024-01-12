import debounce from "lodash/fp/debounce";

import { MediaResolutionTypes } from "@/domains/source/constants";

const DEFAULT_CACHE_VALUES = {
  user: {
    token: "",
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
type CacheKey = keyof typeof DEFAULT_CACHE_VALUES;
type CacheValue<K extends CacheKey> = (typeof DEFAULT_CACHE_VALUES)[K];

export class LocalCache {
  key: string;
  _values: Record<string, unknown> = {};

  constructor(props: { key: string }) {
    const { key } = props;
    this.key = key;
    // @todo localStorage 是端相关 API，应该在外部传入
    this._values = JSON.parse(localStorage.getItem(this.key) || "{}");
    // console.log("[DOMAIN]Cache - constructor", this._values);
  }

  get values() {
    return this._values;
  }

  get<U extends CacheKey, T extends CacheValue<U>>(key: U, defaultValue?: T) {
    const v = this._values[key];
    if (v === undefined && defaultValue) {
      return defaultValue;
    }
    return v as T;
  }
  set = debounce(100, (key: CacheKey, values: unknown) => {
    // console.log("cache set", key, values);
    const nextValues = {
      ...this._values,
      [key]: values,
    };
    this._values = nextValues;
    localStorage.setItem(this.key, JSON.stringify(this._values));
  }) as (key: CacheKey, value: unknown) => void;

  merge = (key: CacheKey, values: unknown) => {
    console.log("[]merge", key, values);
    const prevValues = this.get(key) || {};
    if (typeof prevValues === "object" && typeof values === "object") {
      const nextValues = {
        ...prevValues,
        ...values,
      };
      this.set(key, nextValues);
      return nextValues;
    }
    console.warn("the params of merge must be object");
    return prevValues;
  };

  clear(key: CacheKey) {
    const v = this._values[key];
    if (v === undefined) {
      return null;
    }
    const nextValues = {
      ...this._values,
    };
    delete nextValues[key];
    this._values = { ...nextValues };
    localStorage.setItem(this.key, JSON.stringify(this._values));
  }
}
