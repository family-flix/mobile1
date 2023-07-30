import { cn } from "@/utils";

function Skeleton(props: {} & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse w-full h-full rounded-md bg-gray-200 dark:bg-gray-400", props.className)} />;
}

export { Skeleton };
