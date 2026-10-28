import type { Action } from './types';
import { retry } from './retry';
import { diagram } from './diagram';

/** 指示の一覧（メニュー①に出す順）。新しい指示はここに足す */
export const actions: Action[] = [retry, diagram];

export type { Action, ActionContext } from './types';
