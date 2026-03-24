use sqlx::SqlitePool;

#[derive(Clone, Debug)]
pub struct StrategiesRepo {
    pool: SqlitePool,
}

impl StrategiesRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
