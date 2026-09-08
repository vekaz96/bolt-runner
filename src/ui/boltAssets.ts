import arrowLeft from "../../mobile-game-assests/bolt-ui-kit-v1/icons/arrow-left.png";
import arrowRight from "../../mobile-game-assests/bolt-ui-kit-v1/icons/arrow-right.png";
import arrowUp from "../../mobile-game-assests/bolt-ui-kit-v1/icons/arrow-up.png";
import check from "../../mobile-game-assests/bolt-ui-kit-v1/icons/check.png";
import close from "../../mobile-game-assests/bolt-ui-kit-v1/icons/close.png";
import crown from "../../mobile-game-assests/bolt-ui-kit-v1/icons/crown.png";
import edit from "../../mobile-game-assests/bolt-ui-kit-v1/icons/edit.png";
import gift from "../../mobile-game-assests/bolt-ui-kit-v1/icons/gift.png";
import home from "../../mobile-game-assests/bolt-ui-kit-v1/icons/home.png";
import lightning from "../../mobile-game-assests/bolt-ui-kit-v1/icons/lightning.png";
import lock from "../../mobile-game-assests/bolt-ui-kit-v1/icons/lock.png";
import music from "../../mobile-game-assests/bolt-ui-kit-v1/icons/music.png";
import mute from "../../mobile-game-assests/bolt-ui-kit-v1/icons/mute.png";
import offline from "../../mobile-game-assests/bolt-ui-kit-v1/icons/offline.png";
import pause from "../../mobile-game-assests/bolt-ui-kit-v1/icons/pause.png";
import play from "../../mobile-game-assests/bolt-ui-kit-v1/icons/play.png";
import profile from "../../mobile-game-assests/bolt-ui-kit-v1/icons/profile.png";
import replay from "../../mobile-game-assests/bolt-ui-kit-v1/icons/replay.png";
import settings from "../../mobile-game-assests/bolt-ui-kit-v1/icons/settings.png";
import shield from "../../mobile-game-assests/bolt-ui-kit-v1/icons/shield.png";
import sound from "../../mobile-game-assests/bolt-ui-kit-v1/icons/sound.png";
import star from "../../mobile-game-assests/bolt-ui-kit-v1/icons/star.png";
import trophy from "../../mobile-game-assests/bolt-ui-kit-v1/icons/trophy.png";
import vibration from "../../mobile-game-assests/bolt-ui-kit-v1/icons/vibration.png";
import buttonAction from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/button-action.png";
import buttonDisabled from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/button-disabled.png";
import buttonPrimary from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/button-primary.png";
import buttonSecondary from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/button-secondary.png";
import panelDailyReward from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/panel-daily-reward.png";
import panelPersonalBest from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/panel-personal-best.png";
import panelRewardClaimed from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/panel-reward-claimed.png";
import panelWallet from "../../mobile-game-assests/bolt-ui-kit-v1/surfaces/panel-wallet.png";

/** Hashed Vite URLs for the Bolt UI image kit. */
export const boltIcons = {
  "arrow-left": arrowLeft, "arrow-right": arrowRight, "arrow-up": arrowUp,
  check, close, crown, edit, gift, home, lightning, lock, music, mute, offline,
  pause, play, profile, replay, settings, shield, sound, star, trophy, vibration,
} as const;

export const boltSurfaces = {
  "button-action": buttonAction,
  "button-disabled": buttonDisabled,
  "button-primary": buttonPrimary,
  "button-secondary": buttonSecondary,
  "panel-daily-reward": panelDailyReward,
  "panel-personal-best": panelPersonalBest,
  "panel-reward-claimed": panelRewardClaimed,
  "panel-wallet": panelWallet,
} as const;

export type BoltIconName = keyof typeof boltIcons;
export type BoltSurfaceName = keyof typeof boltSurfaces;
