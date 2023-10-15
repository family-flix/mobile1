import { BaseDomain, Handler } from "@/domains/base";

enum Events {
  Bingo,
}
type TheTypesOfEvents = {
  [Events.Bingo]: void;
};
type MultipleClickProps = {
  onBingo?: () => void;
};

export class MultipleClickCore extends BaseDomain<TheTypesOfEvents> {
  count = 0;

  constructor(props: Partial<{ _name: string }> & MultipleClickProps) {
    super(props);

    const { onBingo } = props;
    if (onBingo) {
      this.onBingo(onBingo);
    }
  }

  resetCount = debounce(() => {
    this.count = 0;
  }, 200);

  handleClick() {
    this.count += 1;
    if (this.count >= 12) {
      this.emit(Events.Bingo);
      this.count = 0;
      return;
    }
    this.resetCount();
  }

  onBingo(handler: Handler<TheTypesOfEvents[Events.Bingo]>) {
    return this.on(Events.Bingo, handler);
  }
}

function debounce(fn: Function, delay = 1000) {
  let timer: null | NodeJS.Timeout = null;
  return () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn();
      timer = null;
    }, delay);
  };
}
