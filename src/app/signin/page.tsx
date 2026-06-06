import { SignInButton } from "./signin-button";
import styles from "../page.module.css";

export default function SignInPage() {
  return (
    <main className={styles.signInPage}>
      <section className={styles.signInPanel}>
        <p className={styles.label}>習慣化カウンター</p>
        <h1>今日の積み上げを始める</h1>
        <p>
          Googleアカウントでログインすると、自分のタスクと継続履歴を安全に管理できます。
        </p>
        <SignInButton />
      </section>
    </main>
  );
}
