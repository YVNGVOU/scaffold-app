// SQLite persistence for SINVAUX (codename: lucid).
// Append-only compiles table — commands here must never UPDATE/REPLACE an
// existing `compiles` row, only INSERT new ones.

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

#[derive(Serialize, Deserialize, Clone)]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub raw_input: String,
    pub created_at: String,
    pub is_favorite: bool,
    pub project_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Template {
    pub id: String,
    pub title: String,
    pub category: String,
    pub body: String,
    pub is_favorite: bool,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Compile {
    pub id: String,
    pub prompt_id: String,
    pub mode: String,
    pub compiled_json: String,
    pub created_at: String,
}

pub fn init_db(db_path: PathBuf) -> Connection {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("failed to create app data dir");
    }
    let conn = Connection::open(db_path).expect("failed to open sqlite database");
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          raw_input TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS compiles (
          id TEXT PRIMARY KEY,
          prompt_id TEXT NOT NULL REFERENCES prompts(id),
          mode TEXT NOT NULL DEFAULT 'architect',
          compiled_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'general',
          body TEXT NOT NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        ",
    )
    .expect("failed to run schema migration");

    // TASK-080: additive migration — `prompts` predates the `is_favorite`
    // column, so a fresh CREATE TABLE IF NOT EXISTS above won't add it to an
    // existing database file. SQLite has no `ADD COLUMN IF NOT EXISTS`, so
    // check pragma_table_info first (same additive-migration spirit as
    // TASK-018's new `settings` table, but here it's a column on an existing
    // table rather than a whole new table).
    let has_is_favorite: bool = conn
        .prepare("SELECT 1 FROM pragma_table_info('prompts') WHERE name = 'is_favorite'")
        .and_then(|mut stmt| stmt.exists([]))
        .unwrap_or(false);
    if !has_is_favorite {
        conn.execute_batch(
            "ALTER TABLE prompts ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;",
        )
        .expect("failed to run is_favorite migration");
    }

    // Same additive-migration pattern as is_favorite above: `project_id` is
    // nullable (a prompt need not belong to a project) and predates existing
    // databases, so it's added via ALTER TABLE rather than the CREATE TABLE
    // IF NOT EXISTS above.
    let has_project_id: bool = conn
        .prepare("SELECT 1 FROM pragma_table_info('prompts') WHERE name = 'project_id'")
        .and_then(|mut stmt| stmt.exists([]))
        .unwrap_or(false);
    if !has_project_id {
        conn.execute_batch("ALTER TABLE prompts ADD COLUMN project_id TEXT;")
            .expect("failed to run project_id migration");
    }

    conn
}
