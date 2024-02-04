import { request } from "@/store/request";
import { reportSomething } from "@/services";
import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { DialogCore } from "@/domains/ui";
import { Application } from "@/domains/app";
import { SeasonMediaCore } from "@/domains/media/season";
import { RequestCoreV2 } from "@/domains/request_v2";
import { ReportTypes } from "@/constants";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type MediaReportCoreProps = {
  app: Application;
  // season: SeasonMediaCore;
};
type MediaReportCoreState = {};

export class MediaReportCore extends BaseDomain<TheTypesOfEvents> {
  $ref = new RefCore<string>({});
  $media = new RefCore<{ media_id: string; media_source_id?: string }>({});
  $create = new RequestCoreV2({
    fetch: reportSomething,
    client: request,
  });

  constructor(props: Partial<{ _name: string }> & MediaReportCoreProps) {
    super(props);

    const { app } = props;

    const dialog = new DialogCore({
      title: "发现问题",
      onOk: () => {
        if (!this.$ref.value) {
          app.tip({
            text: ["请先选择问题"],
          });
          return;
        }
        if (!this.$media.value) {
          app.tip({
            text: ["没有选择影视剧"],
          });
          return;
        }
        this.$create.run({
          type: ReportTypes.Season,
          data: this.$ref.value,
          media_id: this.$media.value.media_id,
          media_source_id: this.$media.value.media_source_id,
        });
      },
    });

    this.$create.onLoadingChange((loading) => {
      dialog.okBtn.setLoading(loading);
    });
    this.$create.onSuccess(() => {
      app.tip({
        text: ["提交成功"],
      });
      dialog.hide();
      // reportSheet.hide();
    });
    this.$create.onFailed((error) => {
      app.tip({
        text: ["提交失败", error.message],
      });
    });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
