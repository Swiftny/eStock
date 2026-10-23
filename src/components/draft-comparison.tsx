"use client";

import { useState } from "react";
import styles from "./estock-app.module.css";
import { ReceiptImagePicker } from "./receipt-image-picker";

export function DraftComparison({ disabled }: { disabled: boolean }) {
  const [image, setImage] = useState<File | null>(null);
  return (
    <details className={styles.comparisonPanel}>
      <summary>Compare with a bon image</summary>
      <p>
        The original photo was not retained. Choose an image to compare with this saved draft. This
        does not scan the image, call Gemini, create another draft or change stock.
      </p>
      <ReceiptImagePicker
        file={image}
        onChange={setImage}
        disabled={disabled}
        allowCamera={false}
        uploadLabel="Choose comparison image"
        previewAlt="Temporary bon image for comparison with the saved draft"
        previewDescription="Comparison only. This image stays temporarily on this page and is removed when you leave or select Remove image."
      />
    </details>
  );
}
