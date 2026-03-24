use sqlx::SqlitePool;

#[derive(Clone, Debug)]
pub struct BalancesRepo {
    pool: SqlitePool,
}

impl BalancesRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
