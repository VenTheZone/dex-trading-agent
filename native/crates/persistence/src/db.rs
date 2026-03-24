use anyhow::Result;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Connection;
use sqlx::SqlitePool;

#[derive(Clone, Debug)]
pub struct TestDb {
    pool: SqlitePool,
}

impl TestDb {
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn ping(&self) -> Result<()> {
        let mut connection = self.pool.acquire().await?;
        connection.ping().await.map_err(Into::into)
    }
}

pub async fn open_test_db() -> Result<TestDb> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await?;

    Ok(TestDb { pool })
}
