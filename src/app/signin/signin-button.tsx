"use client";

import { signIn } from "next-auth/react";

import styles from "../page.module.css";

export function SignInButton() {
  return (
    <button
      type="button"
      className={styles.signInButton}
      onClick={() => signIn("google", { callbackUrl: "/" })}
    >
      Googleでログイン
    </button>
  );
}
