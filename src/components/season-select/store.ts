import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { SeasonItem, fetchSeasonList, fetchSeasonListProcess } from "@/domains/media/services";
import { ButtonCore, DialogCore, DialogProps, InputCore } from "@/domains/ui";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { HttpClientCore } from "@/domains/http_client";
import { UnpackedResult } from "@/types";
import { TmpRequestResp } from "@/domains/request/utils";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  Select,
  Clear,
}
type TheTypesOfEvents = {
  //   [Events.Change]: TVSeasonItem;
  [Events.Select]: SeasonItem;
  [Events.Clear]: void;
};
type TVSeasonSelectProps = {
  client: HttpClientCore;
  onSelect?: (v: SeasonItem) => void;
} & DialogProps;

export class TVSeasonSelectCore extends BaseDomain<TheTypesOfEvents> {
  curSeason = new RefCore<SeasonItem>();
  /** 名称搜索输入框 */
  nameInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter: () => {
      this.searchBtn.click();
    },
  });
  list: ListCoreV2<
    RequestCoreV2<{ fetch: typeof fetchSeasonList; process: typeof fetchSeasonListProcess; client: HttpClientCore }>,
    SeasonItem
  >;
  /** 搜索按钮 */
  searchBtn = new ButtonCore({
    onClick: () => {
      this.list.search({ name: this.nameInput.value });
    },
  });
  client: HttpClientCore;
  dialog: DialogCore;
  /** 弹窗确定按钮 */
  okBtn: ButtonCore;
  /** 弹窗取消按钮 */
  cancelBtn: ButtonCore;
  /** 季列表 */
  response: (typeof this.list)["response"];
  value = this.curSeason.value;

  constructor(props: Partial<{ _name: string }> & TVSeasonSelectProps) {
    super(props);

    const { client, onSelect, onOk, onCancel } = props;
    this.client = client;
    this.dialog = new DialogCore({
      title: "选择电视剧",
      onOk,
      onCancel,
    });
    this.okBtn = this.dialog.okBtn;
    this.cancelBtn = this.dialog.cancelBtn;
    this.list = new ListCoreV2(
      new RequestCoreV2({
        client: this.client,
        fetch: fetchSeasonList,
        process: fetchSeasonListProcess,
      }),
      {
        onLoadingChange: (loading) => {
          this.searchBtn.setLoading(loading);
        },
      }
    );
    this.response = this.list.response;
    this.list.onStateChange((nextState) => {
      this.response = nextState;
    });
    this.curSeason.onStateChange((nextState) => {
      this.value = nextState;
      if (nextState === null) {
        this.emit(Events.Clear);
      }
    });
    if (onSelect) {
      this.onSelect(onSelect);
    }
  }

  show() {
    this.dialog.show();
  }
  hide() {
    this.dialog.hide();
  }
  clear() {
    this.curSeason.clear();
  }
  select(season: SeasonItem) {
    //     console.log("[COMPONENT]TVSeasonSelect - select", season);
    this.curSeason.select(season);
    this.emit(Events.Select, season);
  }

  onResponseChange(handler: Parameters<typeof this.list.onStateChange>[0]) {
    return this.list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.curSeason.onStateChange>[0]) {
    return this.curSeason.onStateChange(handler);
  }
  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    return this.on(Events.Select, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}
