export function Show(props: { when: boolean; fallback?: React.ReactElement; children: React.ReactElement }) {
  const { when, fallback = null, children } = props;
  if (when) {
    return children;
  }
  return fallback;
}
