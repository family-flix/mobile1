// import { client } from "@/store/request";
import { reportSomething } from "@/services";
import { BaseDomain, Handler } from "@/domains/base";
import { RefCore } from "@/domains/cur";
import { DialogCore } from "@/domains/ui";
import { Application } from "@/domains/app";
import { RequestCoreV2 } from "@/domains/request/v2";
import { HttpClientCore } from "@/domains/http_client";
import { ReportTypes } from "@/constants";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type MediaReportCoreProps = {
  app: Application;
  client: HttpClientCore;
  // season: SeasonMediaCore;
};
type MediaReportCoreState = {};

export class MediaReportCore extends BaseDomain<TheTypesOfEvents> {
  $ref = new RefCore<string>({});
  $media = new RefCore<{ media_id: string; media_source_id?: string }>({});
  $create: RequestCoreV2<{ fetch: typeof reportSomething; client: HttpClientCore }>;

  constructor(props: Partial<{ _name: string }> & MediaReportCoreProps) {
    super(props);

    const { app, client } = props;

    this.$create = new RequestCoreV2({
      fetch: reportSomething,
      client,
    });
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
