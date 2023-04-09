/**
 * @file 页面容器，负责页面切换动画、下拉刷新、滚动监听等
 */
import React, { useEffect, useRef, useState } from "react";
import cx from "classnames";

import { cn } from "@/utils";
import { Page } from "@/domains/router";
import { useInitialize } from "@/hooks";
import { useTheme } from "@/components/Theme";

interface IProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactElement;
  page: Page;
  index: number;
}
export const PageContainer: React.FC<IProps> = (props) => {
  const { className, style, index, page, children } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [y, setY] = useState(0);
  const [state, setState] = useState("pending");
  const { resolvedTheme } = useTheme();

  useInitialize(() => {
    page.addListener((nextValues) => {
      const { yDistance, state } = nextValues;
      setY(yDistance);
      setState(state);
    });
    page.onHidden(() => {
      setHidden(true);
    });
  });
  useEffect(() => {
    const $page = pageRef.current;
    const $content = contentRef.current;
    if ($page === null || $content === null) {
      return;
    }
    page.client.width = $page.clientWidth;
    page.client.height = $page.clientHeight;
    page.client.contentHeight = $content.clientHeight;
    $page.addEventListener("scroll", () => {
      page.client.contentHeight = $content.clientHeight;
      page.emitPageScroll({
        scrollTop: $page.scrollTop,
      });
    });
    $page.addEventListener("touchstart", (event) => {
      const { pageX, screenY } = event.touches[0];
      page.handleTouchStart({ x: pageX, y: screenY });
    });
    $page.addEventListener(
      "touchmove",
      (event) => {
        const { pageX, screenY } = event.touches[0];
        page.handleTouchMove({ x: pageX, y: screenY });
      },
      { passive: true }
    );
    $page.addEventListener("touchend", () => {
      // console.log("[COMPONENT]Page - touch end");
      page.handleTouchEnd();
    });
    page.emitReady();
  }, []);

  useEffect(() => {
    // 为了有从右向左的滑动动画
    setTimeout(() => {
      setLoaded(true);
    }, 200);
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cx("page overflow-hidden fixed inset-0 w-screen h-screen", {
        slide: index !== 0,
        mounted: loaded,
        unmounted: hidden,
      })}
      style={style}
    >
      <div
        ref={pageRef}
        className={cn(
          "absolute inset-0 max-h-screen overflow-y-auto",
          resolvedTheme === "light" ? "bg-gray-100" : "bg-[#171717]"
        )}
      >
        <div
          className="pull-to-refresh absolute z-10"
          style={{
            left: "50%",
            transform: `translateX(-50%)`,
            top: 28,
            opacity: y / 80,
          }}
        >
          {(() => {
            if (state === "pulling") {
              return "下拉刷新";
            }
            if (state === "releasing") {
              return "松手刷新";
            }
            if (state === "refreshing") {
              return "正在刷新";
            }
            return null;
          })()}
        </div>
        <div
          ref={contentRef}
          className="content relative z-20"
          style={{ top: `${y}px` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
