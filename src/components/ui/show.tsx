import React from "react";

export const Show: React.FC<{
  when: boolean;
  fallback?: React.ReactElement;
  children: React.ReactNode;
}> = (props) => {
  const { when, fallback = null, children } = props;
  if (when) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
