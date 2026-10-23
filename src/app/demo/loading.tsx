import styles from "@/components/estock-app.module.css";

export default function Loading() {
  return (
    <main className={styles.boot} lang="en-MY" aria-busy="true">
      <h1>Inventory workspace</h1>
      <p role="status">Opening stock records…</p>
    </main>
  );
}
