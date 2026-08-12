// SINVAUX desktop shell: window management + SQLite persistence via Tauri commands.
mod commands;
mod db;

use db::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let db_path = app_data_dir.join("sinvaux.sqlite3");
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
