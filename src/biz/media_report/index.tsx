/**
 * @file 影视剧问题反馈
 * 和 biz/report 功能相同
 */
import { reportSomething } from "@/services/index";
import { DialogCore, InputCore } from "@/domains/ui";
import { Application } from "@/domains/app/index";
import { HttpClientCore } from "@/domains/http_client/index";
import { RequestCore } from "@/domains/request/index";
import { RefCore } from "@/domains/cur/index";
import { ReportTypes } from "@/constants/index";

enum Events {}
type TheTypesOfEvents = {};

type MediaReportState = {};
type MediaReportProps = {
  app: Application<any>;
  client: HttpClientCore;
};

export function MediaRequestCore(props: MediaReportProps) {
  const { app, client } = props;

  const curReport = new RefCore<string>({});
  const fetch = new RequestCore(reportSomething, {
    client,
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["提交成功"],
      });
      dialog.hide();
    },
    onFailed(error) {
      app.tip({
        text: ["提交失败", error.message],
      });
    },
  });
  const input = new InputCore({
    placeholder: "请输入问题",
  });
  const dialog = new DialogCore({
    title: "问题反馈",
    onOk() {
      if (!curReport.value) {
        app.tip({
          text: ["请先输入问题"],
        });
        return;
      }
      fetch.run({
        type: ReportTypes.Season,
        data: curReport.value,
        // media_id: $media.profile.id,
        // media_source_id: $media.curSource?.id,
      });
    },
  });
  return {
    $input: input,
    $dialog: dialog,
  };
}
