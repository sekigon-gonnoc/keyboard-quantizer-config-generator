import { uint16_t } from "node-c-struct";
import KeyCodeTable from "./keycode_table/keycode_table_converted.json";
import QkRange from "./keycode_table/quantum_keycode_range.json";
import { type Action } from "./action";
import { match, P } from "ts-pattern";

export const QK_UNICODE = QkRange.QK_UNICODE;
export const QK_UNICODE_MAX = QkRange.QK_UNICODE_MAX;
export const QK_TAP_DANCE = QkRange.QK_TAP_DANCE;
export const QK_TAP_DANCE_MAX = QkRange.QK_TAP_DANCE_MAX;

const QK_LCTL = KeyCodeTable.MOD_LCTL << 8;
const QK_LSFT = KeyCodeTable.MOD_LSFT << 8;
const QK_LALT = KeyCodeTable.MOD_LALT << 8;
const QK_LGUI = KeyCodeTable.MOD_LGUI << 8;
const QK_RCTL = KeyCodeTable.MOD_RCTL << 8;
const QK_RSFT = KeyCodeTable.MOD_RSFT << 8;
const QK_RALT = KeyCodeTable.MOD_RALT << 8;
const QK_RGUI = KeyCodeTable.MOD_RGUI << 8;

const TO = (layer: number): number => QkRange.QK_TO | (layer & 0x100);
const MO = (layer: number): number => QkRange.QK_MOMENTARY | (layer & 0xff);
const DF = (layer: number): number => QkRange.QK_DEF_LAYER | (layer & 0x1f);
const TG = (layer: number): number => QkRange.QK_TOGGLE_LAYER | (layer & 0x1f);
const OSL = (layer: number): number =>
  QkRange.QK_ONE_SHOT_LAYER | (layer & 0x1f);
const LM = (layer: number, mod: number): number =>
  QkRange.QK_LAYER_MOD | ((layer & 0xf) << 5) | (mod & 0x1f);
const OSM = (mod: number): number => QkRange.QK_ONE_SHOT_MOD | (mod & 0x1f);
const TT = (layer: number): number =>
  QkRange.QK_LAYER_TAP_TOGGLE | (layer & 0x1f);
const LT = (layer: number, kc: number): number =>
  QkRange.QK_LAYER_TAP | ((layer & 0xf) << 8) | (kc & 0xff);
const MT = (mod: number, kc: number): number =>
  QkRange.QK_MOD_TAP | ((mod & 0x1f) << 8) | (kc & 0xff);

const LCTL = (kc: number): number => QK_LCTL | kc;
const LSFT = (kc: number): number => QK_LSFT | kc;
const LALT = (kc: number): number => QK_LALT | kc;
const LGUI = (kc: number): number => QK_LGUI | kc;
const LOPT = (kc: number): number => LALT(kc);
const LCMD = (kc: number): number => LGUI(kc);
const LWIN = (kc: number): number => LGUI(kc);
const RCTL = (kc: number): number => QK_RCTL | kc;
const RSFT = (kc: number): number => QK_RSFT | kc;
const RALT = (kc: number): number => QK_RALT | kc;
const RGUI = (kc: number): number => QK_RGUI | kc;
const ALGR = (kc: number): number => RALT(kc);
const ROPT = (kc: number): number => RALT(kc);
const RCMD = (kc: number): number => RGUI(kc);
const RWIN = (kc: number): number => RGUI(kc);
const S = LSFT;

const HYPR = (kc: number): number => QK_LCTL | QK_LSFT | QK_LALT | QK_LGUI | kc;
const MEH = (kc: number): number => QK_LCTL | QK_LSFT | QK_LALT | kc;
const LCAG = (kc: number): number => QK_LCTL | QK_LALT | QK_LGUI | kc;
const LSG = (kc: number): number => QK_LSFT | QK_LGUI | kc;
const SGUI = (kc: number): number => LSG(kc);
const SCMD = (kc: number): number => LSG(kc);
const SWIN = (kc: number): number => LSG(kc);
const LAG = (kc: number): number => QK_LALT | QK_LGUI | kc;
const RSG = (kc: number): number => QK_RSFT | QK_RGUI | kc;
const RAG = (kc: number): number => QK_RALT | QK_RGUI | kc;
const LCA = (kc: number): number => QK_LCTL | QK_LALT | kc;
const LSA = (kc: number): number => QK_LSFT | QK_LALT | kc;
const RSA = (kc: number): number => QK_RSFT | QK_RALT | kc;
const RCS = (kc: number): number => QK_RCTL | QK_RSFT | kc;

const LCTL_T = (kc: number): number => MT(KeyCodeTable.MOD_LCTL, kc);
const RCTL_T = (kc: number): number => MT(KeyCodeTable.MOD_RCTL, kc);
const CTL_T = (kc: number): number => LCTL_T(kc);

const LSFT_T = (kc: number): number => MT(KeyCodeTable.MOD_LSFT, kc);
const RSFT_T = (kc: number): number => MT(KeyCodeTable.MOD_RSFT, kc);
const SFT_T = (kc: number): number => LSFT_T(kc);

const LALT_T = (kc: number): number => MT(KeyCodeTable.MOD_LALT, kc);
const RALT_T = (kc: number): number => MT(KeyCodeTable.MOD_RALT, kc);
const LOPT_T = (kc: number): number => LALT_T(kc);
const ROPT_T = (kc: number): number => RALT_T(kc);
const ALGR_T = (kc: number): number => RALT_T(kc);
const ALT_T = (kc: number): number => LALT_T(kc);
const OPT_T = (kc: number): number => LOPT_T(kc);

const LGUI_T = (kc: number): number => MT(KeyCodeTable.MOD_LGUI, kc);
const RGUI_T = (kc: number): number => MT(KeyCodeTable.MOD_RGUI, kc);
const LCMD_T = (kc: number): number => LGUI_T(kc);
const LWIN_T = (kc: number): number => LGUI_T(kc);
const RCMD_T = (kc: number): number => RGUI_T(kc);
const RWIN_T = (kc: number): number => RGUI_T(kc);
const GUI_T = (kc: number): number => LGUI_T(kc);
const CMD_T = (kc: number): number => LCMD_T(kc);
const WIN_T = (kc: number): number => LWIN_T(kc);

const C_S_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LCTL | KeyCodeTable.MOD_LSFT, kc);
const MEH_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LCTL | KeyCodeTable.MOD_LSFT | KeyCodeTable.MOD_LALT, kc);
const LCAG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LCTL | KeyCodeTable.MOD_LALT | KeyCodeTable.MOD_LGUI, kc);
const RCAG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_RCTL | KeyCodeTable.MOD_RALT | KeyCodeTable.MOD_RGUI, kc);
const HYPR_T = (kc: number): number =>
  MT(
    KeyCodeTable.MOD_LCTL |
      KeyCodeTable.MOD_LSFT |
      KeyCodeTable.MOD_LALT |
      KeyCodeTable.MOD_LGUI,
    kc
  );
const LSG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LSFT | KeyCodeTable.MOD_LGUI, kc);
const SGUI_T = (kc: number): number => LSG_T(kc);
const SCMD_T = (kc: number): number => LSG_T(kc);
const SWIN_T = (kc: number): number => LSG_T(kc);
const LAG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LALT | KeyCodeTable.MOD_LGUI, kc);
const RSG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_RSFT | KeyCodeTable.MOD_RGUI, kc);
const RAG_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_RALT | KeyCodeTable.MOD_RGUI, kc);
const LCA_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LCTL | KeyCodeTable.MOD_LALT, kc);
const LSA_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_LSFT | KeyCodeTable.MOD_LALT, kc);
const RSA_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_RSFT | KeyCodeTable.MOD_RALT, kc);
const RCS_T = (kc: number): number =>
  MT(KeyCodeTable.MOD_RCTL | KeyCodeTable.MOD_RSFT, kc);
const SAGR_T = (kc: number): number => RSA_T(kc);

export const KeycodeFunctions: Record<string, any> = {
  TO,
  MO,
  DF,
  TG,
  OSL,
  LM,
  OSM,
  TT,
  LT,
  MT,
  LCTL,
  LSFT,
  LALT,
  LGUI,
  LOPT,
  LCMD,
  LWIN,
  RCTL,
  RSFT,
  RALT,
  RGUI,
  ALGR,
  ROPT,
  RCMD,
  RWIN,
  HYPR,
  MEH,
  LCAG,
  LSG,
  SGUI,
  SCMD,
  SWIN,
  LAG,
  RSG,
  RAG,
  LCA,
  LSA,
  RSA,
  RCS,
  S,
  LCTL_T,
  RCTL_T,
  CTL_T,
  LSFT_T,
  RSFT_T,
  SFT_T,
  LALT_T,
  RALT_T,
  LOPT_T,
  ROPT_T,
  ALGR_T,
  ALT_T,
  OPT_T,
  LGUI_T,
  RGUI_T,
  LCMD_T,
  LWIN_T,
  RCMD_T,
  RWIN_T,
  GUI_T,
  CMD_T,
  WIN_T,
  C_S_T,
  MEH_T,
  LCAG_T,
  RCAG_T,
  HYPR_T,
  LSG_T,
  SGUI_T,
  SCMD_T,
  SWIN_T,
  LAG_T,
  RSG_T,
  RAG_T,
  LCA_T,
  LSA_T,
  RSA_T,
  RCS_T,
  SAGR_T,
};

function parseMacroString(
  macroString: string
): { macroName: string; args: Array<number | number[]> } | null {
  const regex = /^(\w+)\((.+)\)$/;
  const match = macroString.match(regex);
  if (match != null) {
    const macroName = match[1];
    const argString = match[2];
    const args: Array<number | number[]> = argString.split(",").map((arg) => {
      if (arg.includes("|")) {
        return arg.split("|").map((subArg) => getKeycode(subArg.trim()));
      } else {
        return getKeycode(arg.trim());
      }
    });
    return { macroName, args };
  } else {
    return null;
  }
}

function evaluateMacroString(macroString: string): number | null {
  const parsedMacro = parseMacroString(macroString);
  if (parsedMacro != null) {
    const { macroName, args } = parsedMacro;
    const macroFunction = KeycodeFunctions[macroName];
    if (macroFunction !== undefined) {
      const processedArgs = args.map((arg) =>
        Array.isArray(arg) ? arg.reduce((a, b) => a | b) : arg
      );
      return macroFunction(...processedArgs);
    } else {
      console.error(`Invalid macro name: ${macroName}`);
      return null;
    }
  } else {
    return getKeycode(macroString);
  }
}

function getKeycode(key: string): number {
  if (key in KeyCodeTable) {
    return (KeyCodeTable as any)[key];
  }

  const val = parseInt(key);
  if (Number.isNaN(val)) {
    throw new Error(`${key} is not valid key`);
  }

  return val;
}

export const Keycodes = {
  ConvertAction: (key: Action): number => {
    return match(key)
      .with(P.string, (str) => {
        return evaluateMacroString(str) ?? 0;
      })
      .with({ macro: P._ }, (macro) => {
        return 0;
      })
      .with({ command: P.string }, (launch) => {
        return 0;
      })
      .with({ unicode_string: P.string }, (str) => {
        return 0;
      })
      .with({ tap_dance: P._ }, () => {
        return 0;
      })
      .exhaustive();
  },

  ConvertBasic: (key: string): number => {
    return getKeycode(key) & 0xff;
  },
};

export { uint16_t as CKeycodes };
