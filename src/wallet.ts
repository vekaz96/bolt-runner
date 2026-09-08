import { useCallback, useEffect, useState } from "react";

const WALLET_KEY = "bolt-wallet";
const WALLET_EVENT = "bolt-wallet-changed";

export function getBalance(): number {
  try {
    const v = Number(localStorage.getItem(WALLET_KEY) ?? "0");
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  } catch {
    return 0;
  }
}

function setBalance(value: number) {
  try {
    localStorage.setItem(WALLET_KEY, String(Math.max(0, Math.floor(value))));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(WALLET_EVENT));
}

export function addBolts(amount: number): number {
  const next = getBalance() + Math.max(0, Math.floor(amount));
  setBalance(next);
  return next;
}

/** Returns true when the balance covered the cost and was deducted. */
export function spendBolts(amount: number): boolean {
  const cost = Math.max(0, Math.floor(amount));
  const balance = getBalance();
  if (balance < cost) return false;
  setBalance(balance - cost);
  return true;
}

/** Live wallet balance — re-renders on any add/spend in this window. */
export function useWallet(): number {
  const [balance, set] = useState(getBalance);
  const refresh = useCallback(() => set(getBalance()), []);

  useEffect(() => {
    window.addEventListener(WALLET_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WALLET_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return balance;
}
