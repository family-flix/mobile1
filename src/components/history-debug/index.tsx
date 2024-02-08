import { useState } from "react";
import { ArrowUp } from "lucide-react";

import { PageKeys } from "@/store/routes";
import { Show } from "@/packages/ui/show";
import { HistoryCore } from "@/domains/history";

export const HistoryPanel = (props: { store: HistoryCore<string, any> }) => {
  const { store } = props;

  const [state, setState] = useState(store.state);
  const [histories, setHistories] = useState(store.$router.histories);

  store.onStateChange((v) => {
    setState(v);
  });
  store.$router.onHistoriesChange((v) => {
    setHistories(v);
  });

  return (
    <div className="fixed left-2 bottom-2 right-2">
      <div className="h-[360px] border rounded-md p-4 bg-white">
        <div>
          <div className="px-4 py-2 rounded-xl bg-slate-100">{state.href}</div>
        </div>
        <div className="mt-4">
          <div>路由栈</div>
          <div className="mt-2 flex space-x-2 max-w-full overflow-x-auto">
            {state.stacks.map((stack, index) => {
              const { id, key, title, query } = stack;
              return (
                <div key={id} className="relative p-2 border rounded-md bg-slate-100">
                  <div className="text-sm">{key}</div>
                  <div className="text-slate-600" style={{ fontSize: "12px" }}>
                    {title}
                  </div>
                  <div className="my-2 p-2 max-h-[120px] rounded-md bg-slate-200" style={{ fontSize: 12 }}>
                    <pre>{query}</pre>
                  </div>
                  <Show when={index === state.cursor}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                      <ArrowUp className="w-6 h-6" />
                    </div>
                  </Show>
                </div>
              );
            })}
          </div>
        </div>
        {/* <div className="mt-4 flex items-center space-x-4">
          {histories.map((history, index) => {
            const { pathname } = history;
            return <div key={pathname}>{pathname}</div>;
          })}
        </div> */}
      </div>
    </div>
  );
};
