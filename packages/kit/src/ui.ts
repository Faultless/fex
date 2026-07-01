import * as clack from "@clack/prompts";

export const log = clack.log;
export const spinner = clack.spinner;
export const note = clack.note;
export const intro = clack.intro;
export const outro = clack.outro;
export const isCancel = clack.isCancel;

export const prompt = {
  text: clack.text,
  confirm: clack.confirm,
  select: clack.select,
  multiselect: clack.multiselect,
};
