use sqlx::SqlitePool;

#[derive(Clone, Debug)]
pub struct ProviderKeysRepo {
    pool: SqlitePool,
}

impl ProviderKeysRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
