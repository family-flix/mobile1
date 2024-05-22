import { BaseDomain, Handler } from "@/domains/base";
import { debounce } from "@/utils/lodash/debounce";

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

  resetCount = debounce(200, () => {
    this.count = 0;
  });

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
