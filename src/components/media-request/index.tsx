import { ReportTypes } from "@/constants";
import { BaseDomain } from "@/domains/base";
import { HttpClientCore } from "@/domains/http_client";
import { RequestCoreV2 } from "@/domains/request/v2";
import { DialogCore, InputCore } from "@/domains/ui";
import { reportSomething } from "@/services";

enum Events {}
type TheTypesOfEvents = {};

type MediaRequestState = {};
type MediaRequestProps = {
  client: HttpClientCore;
};

export class MediaRequestCore extends BaseDomain<TheTypesOfEvents> {
  dialog: DialogCore;
  input: InputCore;

  constructor(props: Partial<{ _name: string }> & MediaRequestProps) {
    super(props);

    const { client } = props;

    const fetch = new RequestCoreV2({
      client,
      fetch: reportSomething,
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
        fetch.run({
          type: ReportTypes.Want,
          data: input.value,
        });
      },
    });
    this.dialog = dialog;
  }
}
