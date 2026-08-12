use crate::db::{Compile, DbState, Prompt};
use chrono::Utc;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn create_prompt(state: State<DbState>, title: String, raw_input: String) -> Result<Prompt, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO prompts (id, title, raw_input, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, title, raw_input, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(Prompt { id, title, raw_input, created_at })
}

#[tauri::command]
pub fn list_prompts(state: State<DbState>) -> Result<Vec<Prompt>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, raw_input, created_at FROM prompts ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                title: row.get(1)?,
                raw_input: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Append-only: always INSERTs a new row, never UPDATEs/REPLACEs an existing compile.
#[tauri::command]
pub fn save_compile(
    state: State<DbState>,
    prompt_id: String,
    mode: String,
    compiled_json: String,
) -> Result<Compile, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO compiles (id, prompt_id, mode, compiled_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, prompt_id, mode, compiled_json, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(Compile { id, prompt_id, mode, compiled_json, created_at })
}

#[tauri::command]
pub fn list_compiles(state: State<DbState>, prompt_id: String) -> Result<Vec<Compile>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, prompt_id, mode, compiled_json, created_at FROM compiles WHERE prompt_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![prompt_id], |row| {
            Ok(Compile {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                mode: row.get(2)?,
                compiled_json: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Renames a prompt in place (title only). Unlike `compiles`, `prompts` is not
/// append-only/provenance-tracked, so an UPDATE here is correct.
#[tauri::command]
pub fn rename_prompt(state: State<DbState>, id: String, new_title: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE prompts SET title = ?1 WHERE id = ?2",
        params![new_title, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Deletes a prompt and all of its associated `compiles` rows (children first,
/// no `ON DELETE CASCADE` on the schema, so we clean up explicitly here).
#[tauri::command]
pub fn delete_prompt(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM compiles WHERE prompt_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM prompts WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Reads a single settings key/value pair. Returns `None` if unset.
#[tauri::command]
pub fn get_setting(state: State<DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(params![key], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => Ok(Some(r.map_err(|e| e.to_string())?)),
        None => Ok(None),
    }
}

/// Upserts a single settings key/value pair.
#[tauri::command]
pub fn set_setting(state: State<DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_compile(state: State<DbState>, id: String) -> Result<Option<Compile>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, prompt_id, mode, compiled_json, created_at FROM compiles WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(params![id], |row| {
            Ok(Compile {
                id: row.get(0)?,
                prompt_id: row.get(1)?,
                mode: row.get(2)?,
                compiled_json: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(r) => Ok(Some(r.map_err(|e| e.to_string())?)),
        None => Ok(None),
    }
}
