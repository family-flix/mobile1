import { ReportTypes } from "@/constants";
import { BaseDomain } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { DialogCore, InputCore } from "@/domains/ui";
import { reportSomething } from "@/services";

enum Events {}
type TheTypesOfEvents = {};

type MediaRequestState = {};
type MediaRequestProps = {};

export class MediaRequestCore extends BaseDomain<TheTypesOfEvents> {
  dialog: DialogCore;
  input: InputCore;
  constructor(props: MediaRequestProps) {
    super(props);

    const request = new RequestCore(reportSomething, {
      onLoading(loading) {
        dialog.okBtn.setLoading(loading);
      },
      onSuccess: () => {
        this.tip({
          text: ["提交成功"],
        });
        dialog.hide();
      },
      onFailed: (error) => {
        this.tip({
          text: ["提交失败", error.message],
        });
      },
    });
    const input = new InputCore({
      placeholder: "请输入想看的电视剧/电影",
    });
    this.input = input;
    const dialog = new DialogCore({
      title: "想看",
      onOk: () => {
        if (!input.value) {
          this.tip({
            text: ["请先输入电视剧/电影"],
          });
          return;
        }
        request.run({
          type: ReportTypes.Want,
          data: JSON.stringify({
            content: input.value,
          }),
        });
      },
    });
    this.dialog = dialog;
  }
}
