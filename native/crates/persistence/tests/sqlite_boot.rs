use persistence::open_test_db;
use sqlx::query;
use sqlx::query_scalar;

#[tokio::test]
async fn sqlite_schema_boots() {
    let db = open_test_db().await.unwrap();

    {
        let mut connection = db.pool().acquire().await.unwrap();
        query("CREATE TABLE widgets (name TEXT NOT NULL)")
            .execute(&mut *connection)
            .await
            .unwrap();
        query("INSERT INTO widgets (name) VALUES (?)")
            .bind("shared-state")
            .execute(&mut *connection)
            .await
            .unwrap();
    }

    let mut connection = db.pool().acquire().await.unwrap();
    let name: String = query_scalar("SELECT name FROM widgets LIMIT 1")
        .fetch_one(&mut *connection)
        .await
        .unwrap();

    assert_eq!(name, "shared-state");
}
