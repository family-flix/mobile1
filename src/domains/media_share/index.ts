import { shareMediaToInvitee } from "@/services";
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
import { InviteeSelectCore } from "@/components/member-select/store";

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
};
type MediaShareCoreState = {};

export class MediaShareCore extends BaseDomain<TheTypesOfEvents> {
  $app: Application;
  $inviteeSelect = new InviteeSelectCore({
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
  $request = new RequestCore(shareMediaToInvitee, {
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

  constructor(props: Partial<{ _name: string }> & MediaShareCoreProps) {
    super(props);

    const { app } = props;
    this.$app = app;
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
