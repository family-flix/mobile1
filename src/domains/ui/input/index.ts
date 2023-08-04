import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  Change,
  StateChange,
  Mounted,
  Focus,
  Blur,
}
type TheTypesOfEvents = {
  [Events.Change]: string;
  [Events.StateChange]: InputState;
  [Events.Mounted]: void;
  [Events.Focus]: void;
  [Events.Blur]: void;
};
type InputState = {
  value: string;
  placeholder: string;
  disabled: boolean;
  type: string;
};
type InputProps = {
  /** 字段键 */
  name: string;
  defaultValue: string;
  placeholder: string;
  type: string;
  onChange: (v: string) => void;
};

export class InputCore extends BaseDomain<TheTypesOfEvents> {
  _defaultValue: string = "";
  value = "";
  state = {
    value: "",
    placeholder: "请输入",
    disabled: false,
    type: "string",
  };

  constructor(options: Partial<{ _name: string } & InputProps> = {}) {
    super(options);

    const { _name: name, defaultValue, placeholder, type, onChange } = options;
    if (name) {
      this._name = name;
    }
    if (placeholder) {
      this.state.placeholder = placeholder;
    }
    if (type) {
      this.state.type = type;
    }
    if (defaultValue) {
      this._defaultValue = defaultValue;
    }
    if (defaultValue) {
      this.value = defaultValue;
      this.state.value = defaultValue;
    }
    if (onChange) {
      this.onChange((v) => {
        onChange(v);
      });
    }
  }
  setMounted() {
    this.emit(Events.Mounted);
  }
  focus() {
    console.log("请在 connect 中实现该方法");
  }
  change(value: string) {
    this.state.value = value;
    this.value = value;
    this.emit(Events.Change, value);
    this.emit(Events.StateChange, { ...this.state });
  }
  enable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  disable() {
    this.state.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  clear() {
    this.state.value = "";
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.state.value = this._defaultValue;
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents[Events.Focus]>) {
    return this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
}
