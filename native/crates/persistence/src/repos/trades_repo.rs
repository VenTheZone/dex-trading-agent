use sqlx::SqlitePool;

#[derive(Clone, Debug)]
pub struct TradesRepo {
    pool: SqlitePool,
}

impl TradesRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
