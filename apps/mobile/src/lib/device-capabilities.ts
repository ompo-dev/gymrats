import { getPushCapability } from "./push";
import { isDebugToolsEnabled } from "./runtime";
import { getWidgetCapability } from "./widget";
import type { NativeCapabilities } from "../store/types";

export function getNativeCapabilities(): NativeCapabilities {
  const push = getPushCapability();
  const widgets = getWidgetCapability();

  return {
    bridgeVersion: 1,
    debugToolsEnabled: isDebugToolsEnabled(),
    push: {
      status: push.status,
      reason: push.reason,
    },
    widgets: {
      status: widgets.status,
      reason: widgets.reason,
    },
  };
}
