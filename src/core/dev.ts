/** True while developing: on localhost, or when `globalThis.__OPTIKOS_DEV__` says so. Dev-only warnings follow it. */
export const isDev = (): boolean => {
  const flag = (globalThis as { __OPTIKOS_DEV__?: boolean }).__OPTIKOS_DEV__;
  if (flag !== undefined) return flag;
  return typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)$/.test(location.hostname);
};
