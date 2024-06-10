/**
 * @file 帮助中心 首页
 */
import React from "react";
import { ArrowLeft, Copy } from "lucide-react";

import { ViewComponent } from "@/store/types";
import { ScrollView } from "@/components/ui/index";
import { useInstance } from "@/hooks/index";
import { ScrollViewCore } from "@/domains/ui/index";
import { sleep } from "@/utils/index";

export const HelpCenterHomePage: ViewComponent = React.memo((props) => {
  const { app, history } = props;

  const $scroll = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
        async onPullToRefresh() {
          await sleep(1200);
          $scroll.finishPullToRefresh();
        },
      })
  );
  const WEBSITE_PC_URL = "https://media.funzm.com/pc/home/index";

  return (
    <ScrollView className="h-screen bg-w-bg-0 safe-bottom" store={$scroll}>
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
          <div className="">视频色彩怪异？</div>
          <div className="mt-1 break-all text-sm">
            <ol>
              <li>切换其他源</li>
              <li>使用三方播放器</li>
              <li>PC 端观看</li>
            </ol>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">视频提示「不支持的视频格式」？</div>
          <div className="mt-1 break-all text-sm">
            <div>问题同上。基本上视频播放相关的问题，都可以通过这三种方式解决。</div>
            <ol>
              <li>切换其他源</li>
              <li>使用三方播放器</li>
              <li>PC 端观看</li>
            </ol>
            <div>如果不行，可以在播放页面「反馈」问题</div>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">如何使用三方播放器？</div>
          <div className="mt-1 break-all text-sm">
            <div>
              <div className="flex items-center">
                <div className="text-md">1、VLC 播放器</div>
                <img
                  className="ml-2 w-8 h-8"
                  src="https://cdn.weipaitang.com/static/20230928ab23e98c-d8fc-e98cd8fc-453a-47af288db8d1-W512H512"
                />
              </div>
              <div>
                下载、打开 VLC 播放器。进入「网络」Tab，选择「打开网络串流」，将视频「播放地址」输入即可开始播放。
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded bg-w-bg-1">
          <div className="">如何在小程序端播放视频</div>
          <div className="mt-1 break-all text-sm">
            <ol>
              <li
                onClick={() => {
                  history.push("root.update_mine_profile");
                }}
              >
                点击前往「信息编辑页面」
              </li>
              <li>复制「ID」字段</li>
              <li>进入小程序「追剧日记」，点击下方「我的」页面</li>
              <li>点击「关联账号」，输入上面复制的「ID」后点击「确定」即可</li>
              <li>退出小程序重新进入即可</li>
            </ol>
          </div>
        </div>
      </div>
    </ScrollView>
  );
});
