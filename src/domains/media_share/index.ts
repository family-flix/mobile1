// import { client } from "@/store/request";
import { shareMediaToInvitee } from "@/services";
import { InviteeSelectCore } from "@/components/member-select/store";
import { BaseDomain, Handler } from "@/domains/base";
import { Application } from "@/domains/app";
import { RequestCoreV2 } from "@/domains/request/v2";
import { UnpackedRequestPayload } from "@/domains/request/utils";
import { HttpClientCore } from "@/domains/http_client";
import { BizError } from "@/domains/error";

enum Events {
  StateChange,
  MessageChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
  [Events.MessageChange]: string;
};

type MediaShareCoreProps = {
  app: Application;
  client: HttpClientCore;
};
type MediaShareCoreState = {};

export class MediaShareCore extends BaseDomain<TheTypesOfEvents> {
  $app: Application;
  $inviteeSelect: InviteeSelectCore;
  $request: RequestCoreV2<{
    fetch: typeof shareMediaToInvitee;
    client: HttpClientCore;
    onLoading: (v: boolean) => void;
    onSuccess: (v: UnpackedRequestPayload<ReturnType<typeof shareMediaToInvitee>>) => void;
    onFailed: (e: BizError) => void;
  }>;

  constructor(props: Partial<{ _name: string }> & MediaShareCoreProps) {
    super(props);

    const { client, app } = props;

    this.$app = app;
    this.$request = new RequestCoreV2({
      client: client,
      fetch: shareMediaToInvitee,
      onLoading: (loading) => {
        this.$inviteeSelect.submitBtn.setLoading(loading);
      },
      onSuccess: (v) => {
        const { url, name } = v;
        const message = `➤➤➤ ${name}
${url}`;
        // setShareLink(message);
        this.emit(Events.MessageChange, message);
        // shareLinkDialog.show();
        // this.$inviteeSelect.dialog.hide();
      },
      onFailed: (error) => {
        const { data } = error;
        if (error.code === 50000) {
          // @ts-ignore
          const { name, url } = data;
          const message = `➤➤➤ ${name}
${url}`;
          this.emit(Events.MessageChange, message);
          // shareLinkDialog.show();
          // this.$inviteeSelect.dialog.hide();
          return;
        }
        this.$app.tip({
          text: ["分享失败", error.message],
        });
      },
    });
    this.$inviteeSelect = new InviteeSelectCore({
      client,
      onOk: (invitee) => {
        if (!invitee) {
          this.$app.tip({
            text: ["请选择分享好友"],
          });
          return;
        }
        this.$request.run({
          // season_id: view.query.season_id,
          target_member_id: invitee.id,
        });
      },
    });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
