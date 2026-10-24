import { withTransaction } from "./db";

export async function clearStockActivity(): Promise<{ deletedEvents: number }> {
  return withTransaction(async (client) => {
    const products = await client.query(
      `SELECT p.id FROM estock_products p
       WHERE EXISTS (SELECT 1 FROM estock_movements m
         WHERE m.product_id=p.id AND m.type IN ('OPENING','TAKE','RETURN'))
       ORDER BY p.id FOR UPDATE`,
    );
    const ids = products.rows.map((row) => String(row.id));

    await client.query(
      `INSERT INTO estock_activity_balances(product_id,delta)
       SELECT product_id,sum(delta) FROM estock_movements
       WHERE product_id=ANY($1::uuid[]) AND type IN ('OPENING','TAKE','RETURN')
       GROUP BY product_id
       ON CONFLICT(product_id) DO UPDATE
         SET delta=estock_activity_balances.delta+EXCLUDED.delta`,
      [ids],
    );
    await client.query(
      `UPDATE estock_requests SET result='{"activityCleared":true}'::jsonb
       WHERE (action IN ('TAKE','RETURN') AND (result #>> '{movement,id}') IN (
         SELECT id::text FROM estock_movements
         WHERE (product_id=ANY($1::uuid[]) OR product_id IS NULL) AND type IN ('TAKE','RETURN')))
       OR (action='CREATE_PRODUCT' AND (result #>> '{product,id}') IN (
         SELECT product_id::text FROM estock_movements
         WHERE (product_id=ANY($1::uuid[]) OR product_id IS NULL) AND type='OPENING'))`,
      [ids],
    );
    const removed = await client.query(
      `DELETE FROM estock_movements
       WHERE (product_id=ANY($1::uuid[]) OR product_id IS NULL) AND type IN ('OPENING','TAKE','RETURN')`,
      [ids],
    );
    return { deletedEvents: removed.rowCount || 0 };
  });
}

export async function clearReceiptHistory(): Promise<{
  deletedReceipts: number;
  retainedStockMovements: number;
}> {
  return withTransaction(async (client) => {
    const records = await client.query(
      `SELECT id FROM estock_drafts
       WHERE status IN ('RECEIVED','DISCARDED','APPROVED')
       ORDER BY id FOR UPDATE`,
    );
    const ids = records.rows.map((row) => String(row.id));
    if (!ids.length) return { deletedReceipts: 0, retainedStockMovements: 0 };

    const movements = await client.query(
      `UPDATE estock_movements SET
         source_event_id='history-cleared:' || id::text,
         document_date=NULL,approved_at=NULL,draft_id=NULL,line_id=NULL,
         raw_name=NULL,raw_quantity=NULL,raw_unit=NULL,reviewed_name=NULL
       WHERE draft_id=ANY($1::uuid[])`,
      [ids],
    );
    await client.query(
      `DELETE FROM estock_requests
       WHERE action IN ('SEND_RECEIPT','CONFIRM_RECEIPT','APPROVE_DRAFT')
         AND ((result #>> '{draft,id}')=ANY($1::text[])
           OR (result #>> '{receipt,id}')=ANY($1::text[]))`,
      [ids],
    );
    await client.query("DELETE FROM estock_notifications WHERE draft_id=ANY($1::uuid[])", [ids]);
    await client.query("DELETE FROM estock_receipt_checks WHERE draft_id=ANY($1::uuid[])", [ids]);
    await client.query("DELETE FROM estock_receipt_exclusions WHERE draft_id=ANY($1::uuid[])", [
      ids,
    ]);
    await client.query("DELETE FROM estock_receipt_lines WHERE draft_id=ANY($1::uuid[])", [ids]);
    await client.query("DELETE FROM estock_receipt_submissions WHERE draft_id=ANY($1::uuid[])", [
      ids,
    ]);
    await client.query("DELETE FROM estock_draft_lines WHERE draft_id=ANY($1::uuid[])", [ids]);
    await client.query("DELETE FROM estock_drafts WHERE id=ANY($1::uuid[])", [ids]);
    return {
      deletedReceipts: ids.length,
      retainedStockMovements: movements.rowCount || 0,
    };
  });
}
