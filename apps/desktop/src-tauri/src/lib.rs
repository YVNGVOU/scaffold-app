// SINVAUX desktop shell: window management + SQLite persistence via Tauri commands.
mod commands;
mod db;

use db::DbState;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

/// Absolute path to the SQLite database file, managed separately from
/// `DbState` (which holds the open `Connection`) so `get_storage_info` can
/// `std::fs::metadata` it without needing a second open handle.
pub struct DbPath(pub PathBuf);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let db_path = app_data_dir.join("sinvaux.sqlite3");
            app.manage(DbPath(db_path.clone()));
            let conn = db::init_db(db_path);
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_prompt,
            commands::list_prompts,
            commands::save_compile,
            commands::list_compiles,
            commands::get_compile,
            commands::rename_prompt,
            commands::set_favorite,
            commands::delete_prompt,
            commands::get_setting,
            commands::set_setting,
            commands::set_prompt_project,
            commands::create_project,
            commands::list_projects,
            commands::rename_project,
            commands::delete_project,
            commands::create_template,
            commands::list_templates,
            commands::set_template_favorite,
            commands::delete_template,
            commands::get_storage_info,
            commands::clear_local_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
