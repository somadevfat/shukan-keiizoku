"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import styles from "./page.module.css";

type AuthControlsProps = {
  readonly isGuest: boolean;
  readonly userName: string;
};

export function AuthControls({ isGuest, userName }: AuthControlsProps) {
  if (isGuest) {
    return (
      <Link href="/signin" className={styles.protectDataLink}>
        データを保護する
      </Link>
    );
  }

  return (
    <div className={styles.authControls}>
      <span
        className={styles.profile}
        aria-label={`${userName}としてログイン中`}
      >
        {userName.slice(0, 1).toUpperCase()}
      </span>
      <button type="button" onClick={() => signOut({ callbackUrl: "/signin" })}>
        ログアウト
      </button>
    </div>
  );
}
