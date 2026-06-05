import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_c9S2LkirAfnG@ep-purple-cell-aqp9jpyt-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

try {
  // Delete any garbage entries (negative facts, placeholder resolved lines)
  const del = await pool.query(
    `DELETE FROM hindsight_mock_memories 
     WHERE content ILIKE '%not mentioned%' 
        OR content ILIKE '%not provided%'
        OR content ILIKE '%not stated%'
        OR content LIKE 'Resolved ticket:%'
        OR content LIKE 'Resolved ticket "%'`
  );
  console.log(`🗑️  Deleted ${del.rowCount} garbage memory entries.`);

  // Show remaining entries
  const remaining = await pool.query(
    `SELECT bank_id, content, created_at FROM hindsight_mock_memories ORDER BY created_at DESC`
  );
  console.log(`\n✅ Remaining memories (${remaining.rows.length} total):`);
  for (const row of remaining.rows) {
    console.log(`\n  Bank: ${row.bank_id}`);
    console.log(`  Content: ${row.content}`);
    console.log(`  Created: ${row.created_at}`);
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await pool.end();
}
