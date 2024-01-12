import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { X } from "lucide-react";

import { DialogCore } from "@/domains/ui/dialog";
import * as DialogPrimitive from "@/packages/ui/dialog";
import { cn } from "@/utils";
import { Show } from "@/packages/ui/show";

const sheetVariants = cva("fixed z-50 scale-100 gap-4 rounded-tl-xl rounded-tr-xl bg-w-bg-2 text-w-fg-0 opacity-100", {
  variants: {
    position: {
      top: "animate-in slide-in-from-top w-full duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top",
      bottom:
        "animate-in slide-in-from-bottom w-full duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
      left: "animate-in slide-in-from-left h-full duration-300",
      right: "animate-in slide-in-from-right h-full duration-300",
    },
    size: {
      content: "",
      default: "",
      sm: "",
      lg: "",
      xl: "",
      full: "",
    },
  },
  compoundVariants: [
    {
      position: ["top", "bottom"],
      size: "content",
      class: "max-h-screen",
    },
    {
      position: ["top", "bottom"],
      size: "default",
      class: "h-1/3",
    },
    {
      position: ["top", "bottom"],
      size: "sm",
      class: "h-1/4",
    },
    {
      position: ["top", "bottom"],
      size: "lg",
      class: "h-1/2",
    },
    {
      position: ["top", "bottom"],
      size: "xl",
      class: "h-5/6",
    },
    {
      position: ["top", "bottom"],
      size: "full",
      class: "h-screen",
    },
    {
      position: ["right", "left"],
      size: "content",
      class: "max-w-screen",
    },
    {
      position: ["right", "left"],
      size: "default",
      class: "w-1/3",
    },
    {
      position: ["right", "left"],
      size: "sm",
      class: "w-1/4",
    },
    {
      position: ["right", "left"],
      size: "lg",
      class: "w-1/2",
    },
    {
      position: ["right", "left"],
      size: "xl",
      class: "w-5/6",
    },
    {
      position: ["right", "left"],
      size: "full",
      class: "w-screen",
    },
  ],
  defaultVariants: {
    position: "right",
    size: "default",
  },
});
const portalVariants = cva("fixed inset-0 z-50 flex", {
  variants: {
    position: {
      top: "items-start",
      bottom: "items-end",
      left: "justify-start",
      right: "justify-end",
    },
  },
  defaultVariants: { position: "right" },
});

export const Sheet = (
  props: {
    store: DialogCore;
    size?: VariantProps<typeof sheetVariants>["size"];
    hideTitle?: boolean;
  } & Omit<React.AllHTMLAttributes<HTMLDivElement>, "size">
) => {
  const { store, size = "lg", hideTitle } = props;
  return (
    <Root store={store}>
      <Content store={store} hideTitle={hideTitle} position="bottom" size={size}>
        {props.children}
      </Content>
    </Root>
  );
};

const Root = DialogPrimitive.Root;

interface SheetPortalProps extends React.AllHTMLAttributes<HTMLDivElement>, VariantProps<typeof portalVariants> {}

const Portal = (props: { store: DialogCore } & SheetPortalProps) => (
  <DialogPrimitive.Portal store={props.store} className={cn(props.className)}>
    <div className={portalVariants({ position: props.position })}>{props.children}</div>
  </DialogPrimitive.Portal>
);

const Overlay = (props: { store: DialogCore } & React.AllHTMLAttributes<HTMLDivElement>) => {
  const { store } = props;
  return (
    <DialogPrimitive.Overlay
      store={store}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out",
        props.className
      )}
      onClick={() => {
        store.hide();
      }}
    />
  );
};

// SheetOverlay.displayName = Dialog.Overlay.displayName;

const Content = (
  props: {
    store: DialogCore;
  } & {
    position?: VariantProps<typeof sheetVariants>["position"];
    size?: VariantProps<typeof sheetVariants>["size"];
    hideTitle?: boolean;
  } & Omit<React.AllHTMLAttributes<HTMLDivElement>, "size">
) => {
  const { className, store, position, size, hideTitle, children } = props;
  return (
    <Portal store={store} position={position}>
      <Overlay store={store} />
      <DialogPrimitive.Content store={store} className={cn(sheetVariants({ position, size }), className)}>
        <Show when={!hideTitle}>
          <Header className="flex">
            <div
              className="p-4 self-end"
              onClick={() => {
                store.hide();
              }}
            >
              <X className="w-5 h-5 text-w-fg-1" />
            </div>
          </Header>
        </Show>
        {children}
      </DialogPrimitive.Content>
    </Portal>
  );
};

const Header = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);

const Footer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);

const Title = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title className={cn("text-lg font-semibold text-w-fg-1", className)} {...props} />
));
// export { Root, Content, Header, Footer, Title };
