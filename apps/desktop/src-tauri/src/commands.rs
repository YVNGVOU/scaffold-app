use crate::db::{Compile, DbState, Project, Prompt, Template};
use crate::DbPath;
use chrono::Utc;
use rusqlite::params;
use serde::Serialize;
use tauri::State;
use uuid::Uuid;

#[derive(Serialize)]
pub struct StorageInfo {
    pub db_size_bytes: u64,
    pub prompt_count: i64,
    pub compile_count: i64,
    pub project_count: i64,
    pub template_count: i64,
}

#[tauri::command]
pub fn get_storage_info(state: State<DbState>, db_path: State<DbPath>) -> Result<StorageInfo, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let count = |table: &str| -> Result<i64, String> {
        conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| row.get(0))
            .map_err(|e| e.to_string())
    };
    let db_size_bytes = std::fs::metadata(&db_path.0).map(|m| m.len()).unwrap_or(0);
    Ok(StorageInfo {
        db_size_bytes,
        prompt_count: count("prompts")?,
        compile_count: count("compiles")?,
        project_count: count("projects")?,
        template_count: count("templates")?,
    })
}

/// Wipes every user-content table (prompts, compiles, projects, templates,
/// settings) for a genuine fresh start. Destructive and irreversible — the
/// frontend must confirm with the user before calling this.
#[tauri::command]
pub fn clear_local_data(state: State<DbState>) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM compiles", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM prompts", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM projects", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM templates", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM settings", []).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_prompt(state: State<DbState>, title: String, raw_input: String) -> Result<Prompt, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO prompts (id, title, raw_input, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        params![id, title, raw_input, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(Prompt { id, title, raw_input, updated_at: created_at.clone(), created_at, is_favorite: false, project_id: None })
}

#[tauri::command]
pub fn list_prompts(state: State<DbState>) -> Result<Vec<Prompt>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, raw_input, created_at, is_favorite, project_id, updated_at FROM prompts ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                title: row.get(1)?,
                raw_input: row.get(2)?,
                created_at: row.get(3)?,
                is_favorite: row.get::<_, i64>(4)? != 0,
                project_id: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Assigns (or clears, when `project_id` is None) a prompt's project. Like
/// `rename_prompt`/`set_favorite`, `prompts` is not append-only, so an UPDATE
/// here is correct. Bumps `updated_at` for cloud sync's last-write-wins merge.
#[tauri::command]
pub fn set_prompt_project(state: State<DbState>, id: String, project_id: Option<String>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE prompts SET project_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![project_id, Utc::now().to_rfc3339(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_project(state: State<DbState>, name: String, description: String) -> Result<Project, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        params![id, name, description, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(Project { id, name, description, updated_at: created_at.clone(), created_at })
}

#[tauri::command]
pub fn list_projects(state: State<DbState>) -> Result<Vec<Project>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at, updated_at FROM projects ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn rename_project(state: State<DbState>, id: String, name: String, description: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
        params![name, description, Utc::now().to_rfc3339(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Deletes a project. Prompts that belonged to it are NOT deleted — their
/// `project_id` is cleared back to unassigned, same "detach, don't cascade"
/// choice as leaving a folder without deleting its contents.
#[tauri::command]
pub fn delete_project(state: State<DbState>, id: String) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE prompts SET project_id = NULL WHERE project_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_template(state: State<DbState>, title: String, category: String, body: String) -> Result<Template, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO templates (id, title, category, body, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![id, title, category, body, created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(Template { id, title, category, body, is_favorite: false, updated_at: created_at.clone(), created_at })
}

#[tauri::command]
pub fn list_templates(state: State<DbState>) -> Result<Vec<Template>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, category, body, is_favorite, created_at, updated_at FROM templates ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Template {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                body: row.get(3)?,
                is_favorite: row.get::<_, i64>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn set_template_favorite(state: State<DbState>, id: String, is_favorite: bool) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE templates SET is_favorite = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_favorite as i64, Utc::now().to_rfc3339(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_template(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM templates WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
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
        "UPDATE prompts SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_title, Utc::now().to_rfc3339(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// TASK-080: flips a prompt's `is_favorite` flag directly to the caller-given
/// value (not a read-then-toggle) so the frontend's optimistic state and the
/// backend can never disagree about which direction the click meant. Like
/// `rename_prompt`, `prompts` is not append-only/provenance-tracked, so an
/// UPDATE here is correct.
#[tauri::command]
pub fn set_favorite(state: State<DbState>, id: String, is_favorite: bool) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE prompts SET is_favorite = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_favorite as i64, Utc::now().to_rfc3339(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Deletes a prompt and all of its associated `compiles` rows (children first,
/// no `ON DELETE CASCADE` on the schema, so we clean up explicitly here).
#[tauri::command]
pub fn delete_prompt(state: State<DbState>, id: String) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM compiles WHERE prompt_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM prompts WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
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

// ---------- Cloud sync (pull side) ----------
// These accept a full row (including its id) from the cloud API
// (scaffold-api.js's GET /sync) and upsert it locally, last-write-wins on
// `updated_at` — the mirror image of that same endpoint's own upsertRow.
// The regular create_* commands above always mint a fresh id, so they can't
// be reused for this: sync needs to write the CLOUD's id verbatim.

#[tauri::command]
pub fn upsert_project_from_sync(state: State<DbState>, project: Project) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, updated_at = excluded.updated_at
         WHERE excluded.updated_at > projects.updated_at",
        params![project.id, project.name, project.description, project.created_at, project.updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn upsert_template_from_sync(state: State<DbState>, template: Template) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO templates (id, title, category, body, is_favorite, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, category = excluded.category, body = excluded.body,
           is_favorite = excluded.is_favorite, updated_at = excluded.updated_at
         WHERE excluded.updated_at > templates.updated_at",
        params![template.id, template.title, template.category, template.body, template.is_favorite as i64, template.created_at, template.updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn upsert_prompt_from_sync(state: State<DbState>, prompt: Prompt) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO prompts (id, title, raw_input, is_favorite, project_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, raw_input = excluded.raw_input,
           is_favorite = excluded.is_favorite, project_id = excluded.project_id, updated_at = excluded.updated_at
         WHERE excluded.updated_at > prompts.updated_at",
        params![prompt.id, prompt.title, prompt.raw_input, prompt.is_favorite as i64, prompt.project_id, prompt.created_at, prompt.updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Compiles are append-only everywhere (local and cloud) — ON CONFLICT DO
/// NOTHING rather than an update, since a compile row never changes once written.
#[tauri::command]
pub fn insert_compile_from_sync(state: State<DbState>, compile: Compile) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO compiles (id, prompt_id, mode, compiled_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO NOTHING",
        params![compile.id, compile.prompt_id, compile.mode, compile.compiled_json, compile.created_at],
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
