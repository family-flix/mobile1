import React from "react";

import { ViewComponent, ViewComponentProps } from "@/store/types";

import { Button } from "@/components/ui";
import { ButtonCore } from "@/domains/ui";
import { onMount, useInitialize, useInstance } from "@/hooks";
import { RequestCoreV2 } from "@/domains/request/v2";
import { confirmQRCode } from "@/services";
import { HttpClientCore } from "@/domains/http_client";
import { AuthCodeStep, MediaOriginCountry } from "@/constants";
import { HistoryCore } from "@/domains/history";

class PageLogic {
  code: string;
  step: AuthCodeStep;
  error: Error | null = null;

  $app: ViewComponentProps["app"];
  $btn: ButtonCore;
  $confirm: RequestCoreV2<{
    fetch: typeof confirmQRCode;
    client: HttpClientCore;
  }>;

  get state() {
    return {
      step: this.step,
      error: this.error,
    };
  }

  constructor(props: { code: string } & Pick<ViewComponentProps, "app" | "history" | "client">) {
    const { code, app, history, client } = props;

    this.code = code;
    this.step = AuthCodeStep.Loading;

    this.$app = app;
    this.$confirm = new RequestCoreV2({
      fetch: confirmQRCode,
      client,
      onFailed(e: Error) {
        app.tip({
          text: [e.message],
        });
      },
    });
    this.$btn = new ButtonCore({
      onClick: async () => {
        this.$btn.setLoading(true);
        await this.$confirm.run({ code: code, status: AuthCodeStep.Confirmed });
        this.$btn.setLoading(false);
        history.replace("root.home_layout.home_index.home_index_season", {
          language: MediaOriginCountry.CN,
        });
      },
    });
  }

  init() {
    if (!this.code) {
      this.error = new Error("缺少 code 参数");
      this.$app.tip({
        text: ["缺少 code 参数"],
      });
      return;
    }
    this.$confirm.run({ code: this.code, status: AuthCodeStep.Scanned });
  }
}

export const QRCodeLoginConfirmPage: ViewComponent = React.memo((props) => {
  const { app, view, history, client } = props;

  const $logic = useInstance(() => new PageLogic({ code: view.query.code, app, history, client }));

  onMount(() => {
    $logic.init();
  });

  return (
    <div className="pt-24 px-4 h-screen bg-w-bg-0">
      <div className="h-[198px] mx-auto">
        <div className="relative cursor-pointer">
          <div className="z-10 absolute left-12 top-[32px] w-[82%] h-[32px] rounded-xl bg-green-500"></div>
          <div className="z-20 relative text-6xl text-center italic">FunFlixFlim</div>
        </div>
      </div>
      <div className="mt-8">
        <Button size="lg" store={$logic.$btn}>
          确认
        </Button>
        <div className="mt-4 text-sm text-center">点击确认登录</div>
      </div>
    </div>
  );
});
