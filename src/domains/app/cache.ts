import debounce from "lodash/fp/debounce";

export class LocalCache {
  _values: Record<string, unknown> = {};

  constructor() {
    // @todo localStorage 是端相关 API，应该在外部传入
    this._values = JSON.parse(localStorage.getItem("m_global") || "{}");
  }

  get values() {
    return this._values;
  }

  init(values: Record<string, unknown>) {
    this._values = values;
  }

  set = debounce(100, (key: string, values: unknown) => {
    const nextValues = {
      ...this._values,
      [key]: values,
    };
    this._values = nextValues;
    localStorage.setItem("m_global", JSON.stringify(nextValues));
  }) as (key: string, value: unknown) => void;

  get<T>(key: string, defaultValue?: T) {
    const v = this._values[key];
    if (v === undefined && defaultValue) {
      return defaultValue;
    }
    return v as T;
  }
}
