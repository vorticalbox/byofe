import { createDefine } from "fresh";
import type { Session } from "$types";

export interface State {
  session: Session;
}

export const define = createDefine<State>();
