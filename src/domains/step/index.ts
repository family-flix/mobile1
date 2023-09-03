import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: StepState;
};

type StepState = {
  value: number;
};
type StepProps = Partial<{
  values: number[];
}>;

export class StepCore extends BaseDomain<TheTypesOfEvents> {
  value: number;
  values: number[];

  get state(): StepState {
    return {
      value: this.value,
    };
  }

  constructor(props: Partial<{ _name: string }> & StepProps = {}) {
    super(props);

    const { values = [] } = props;
    this.values = values;

    this.value = 1;
  }

  next() {
    const nextValue = this.value + 1;
    if (!this.values.includes(nextValue)) {
      return;
    }
    this.select(nextValue);
  }
  select(value: number) {
    this.value = value;
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
