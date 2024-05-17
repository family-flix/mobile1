/**
 * @file 扫码后确认登录页面
 */
import React from "react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { confirmQRCode } from "@/services/index";
import { Button } from "@/components/ui";
import { onMount, useInitialize, useInstance } from "@/hooks/index";
import { ButtonCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { AuthCodeStep, MediaOriginCountry } from "@/constants/index";

function Page(props: ViewComponentProps) {
  const { view, app, client, history } = props;

  const code = view.query.code;
  let step = AuthCodeStep.Loading;
  let error = null;

  const $confirm = new RequestCore(confirmQRCode, {
    client,
  });
  const $btn = new ButtonCore({
    async onClick() {
      $btn.setLoading(true);
      const r = await $confirm.run({ code, status: AuthCodeStep.Confirmed });
      if (r.error) {
        app.tip({
          text: [r.error.message],
        });
        return;
      }
      $btn.setLoading(false);
      history.replace("root.home_layout.home_index.home_index_season", {
        language: MediaOriginCountry.CN,
      });
    },
  });

  return {
    ui: {
      $btn,
    },
    ready() {
      if (!code) {
        error = new Error("缺少 code 参数");
        app.tip({
          text: [error.message],
        });
        return;
      }
      $confirm.run({ code, status: AuthCodeStep.Scanned });
    },
  };
}

export const QRCodeLoginConfirmPage: ViewComponent = React.memo((props) => {
  const $page = useInstance(() => Page(props));

  onMount(() => {
    $page.ready();
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
        <Button size="lg" store={$page.ui.$btn}>
          确认
        </Button>
        <div className="mt-4 text-sm text-center">点击确认登录</div>
      </div>
    </div>
  );
});
