/**
 * @file 成员选择
 */
import { InviteeItem, fetchInviteeList } from "@/services";
import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ButtonCore, DialogCore, DialogProps, InputCore } from "@/domains/ui";
import { HttpClientCore } from "@/domains/http_client";

enum Events {
  StateChange,
  ResponseChange,
  Change,
  Select,
  Clear,
}
type TheTypesOfEvents = {
  [Events.Select]: InviteeItem;
  [Events.Clear]: void;
};
type InviteeSelectProps = {
  client: HttpClientCore;
  onSelect?: (v: InviteeItem) => void;
  onOk?: (v: InviteeItem) => void;
} & Omit<DialogProps, "onOk">;

export class InviteeSelectCore extends BaseDomain<TheTypesOfEvents> {
  cur = new RefCore<InviteeItem>();
  /** 名称搜索输入框 */
  nameInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入昵称搜索",
    onEnter: () => {
      this.searchBtn.click();
    },
  });
  /** 搜索按钮 */
  searchBtn = new ButtonCore({
    onClick: () => {
      this.$list.search({ name: this.nameInput.value });
    },
  });
  // dialog: DialogCore;
  // /** 弹窗确定按钮 */
  // okBtn: ButtonCore;
  submitBtn: ButtonCore;
  // /** 弹窗取消按钮 */
  // cancelBtn: ButtonCore;
  /** 季列表 */
  $list: ListCoreV2<RequestCoreV2<{ fetch: typeof fetchInviteeList; client: HttpClientCore }>, InviteeItem>;
  get response() {
    return this.$list.response;
  }
  get value() {
    return this.cur.value;
  }

  constructor(props: Partial<{ _name: string }> & InviteeSelectProps) {
    super(props);

    const { client, onSelect, onOk, onCancel } = props;

    this.$list = new ListCoreV2(
      new RequestCoreV2({
        client,
        fetch: fetchInviteeList,
      }),
      {
        onLoadingChange: (loading) => {
          this.searchBtn.setLoading(loading);
        },
      }
    );
    // this.dialog = new DialogCore({
    //   title: "选择好友",
    //   onOk: () => {
    //     if (!this.value) {
    //       this.tip({
    //         text: ["请先选择好友"],
    //       });
    //       return;
    //     }
    //     if (onOk) {
    //       onOk(this.value);
    //     }
    //   },
    //   onCancel,
    // });
    // this.okBtn = this.dialog.okBtn;
    // this.cancelBtn = this.dialog.cancelBtn;
    this.submitBtn = new ButtonCore({
      onClick: () => {
        if (!this.value) {
          this.tip({
            text: ["请先选择好友"],
          });
          return;
        }
        if (onOk) {
          onOk(this.value);
        }
      },
    });

    // this.list.onStateChange((nextState) => {
    //   this.response = nextState;
    // });
    this.cur.onStateChange((nextState) => {
      // this.value = nextState;
      if (nextState === null) {
        this.emit(Events.Clear);
      }
    });
    if (onSelect) {
      this.onSelect(onSelect);
    }
  }

  // show() {
  //   this.dialog.show();
  // }
  // hide() {
  //   this.dialog.hide();
  // }
  clear() {
    this.cur.clear();
  }
  select(invitee: InviteeItem) {
    //     console.log("[COMPONENT]TVSeasonSelect - select", season);
    this.cur.select(invitee);
    this.emit(Events.Select, invitee);
  }

  onResponseChange(handler: Parameters<typeof this.$list.onStateChange>[0]) {
    return this.$list.onStateChange(handler);
  }
  onCurSeasonChange(handler: Parameters<typeof this.cur.onStateChange>[0]) {
    return this.cur.onStateChange(handler);
  }
  onSelect(handler: Handler<TheTypesOfEvents[Events.Select]>) {
    return this.on(Events.Select, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}
