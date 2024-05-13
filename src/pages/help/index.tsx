/**
 * @file 帮助中心 首页
 */
import React from "react";
import { ArrowLeft, Copy } from "lucide-react";

import { ViewComponent } from "@/store/types";
import { ScrollView } from "@/components/ui";
import { useInstance } from "@/hooks";
import { ScrollViewCore } from "@/domains/ui";

export const HelpCenterHomePage: ViewComponent = React.memo((props) => {
  const { app, history } = props;

  const $scroll = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
      })
  );
  const WEBSITE_PC_URL = "https://media.funzm.com/pc/home/index";

  return (
    <ScrollView className="h-screen bg-w-bg-0" store={$scroll}>
      <div className="flex items-center">
        <div
          className="inline-block p-4"
          onClick={() => {
            history.back();
          }}
        >
          <ArrowLeft className="w-6 h-6" />
        </div>
      </div>
      <div className="space-y-4 px-4">
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">PC 端地址是什么？</div>
          <div className="flex items-center mt-1 break-all text-sm">
            <div>{WEBSITE_PC_URL}</div>
            <div
              className="ml-4"
              onClick={() => {
                app.copy(WEBSITE_PC_URL);
                app.tip({
                  text: ["复制成功"],
                });
              }}
            >
              <Copy className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">如何修改密码？</div>
          <div
            className="mt-1 break-all text-sm"
            onClick={() => {
              history.push("root.update_mine_profile");
            }}
          >
            <span>进入</span>
            <span className="underline">邮箱密码编辑页面</span>
            <span>，填写好信息后保存即可。</span>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">视频提示「格式错误」？</div>
          <div className="mt-1 break-all text-sm">
            <span>先尝试切换视频源、分辨率，均无效时，尝试使用三方播放器或到 PC 端观看。</span>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">如何使用三方播放器？</div>
          <div className="mt-1 break-all text-sm">
            <span>待完善...</span>
          </div>
        </div>
      </div>
    </ScrollView>
  );
});
