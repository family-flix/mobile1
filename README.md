# 飞乐/移动端

配合 https://github.com/family-flix/api 使用的前端实现

## 前端架构

为了做到彻底的视图与业务分离，最后实现了一套类似微信小程序的架构。

### 路由领域

自己实现了路由机制，从而做到了页面跳转后不销毁、页面切换动画等。

### 页面领域

将「页面概念」抽离，形成 `PageDomain`，每个 `PageDomain` 会被传入「页面组件」，可监听页面的各种事件

```js
function HomePage(props) {
  const { page } = props;
  useInitialize(() => {
    page.onReady(() => {
      // do something
    });
    page.onPullToRefresh(() => {
      // do something
    });
    page.onReachBottom(() => {
      // do something
    });
    page.onPageScroll(() => {
      // do something
    });
  });
  return <div>Home Page</div>;
}
```
