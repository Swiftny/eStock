import styles from "./demo.module.css";

export default function Loading() {
  return (
    <main className={`${styles.demo} ${styles.loading}`} lang="en-MY" aria-busy="true">
      <span className={styles.brand}>
        <span>e</span>Stock
      </span>
      <h1>Inventory workspace</h1>
      <p role="status">Opening saved stock records…</p>
    </main>
  );
}
