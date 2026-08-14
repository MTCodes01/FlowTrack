use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

/// Tauri IPC command — check whether the FlowTrack agent process is running.
#[tauri::command]
fn is_agent_running() -> bool {
    #[cfg(target_os = "windows")]
    {
        // Check for flowtrack-agent.exe in the process list
        std::process::Command::new("tasklist")
            .output()
            .map(|out| String::from_utf8_lossy(&out.stdout).contains("flowtrack-agent"))
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("pgrep")
            .arg("-x")
            .arg("flowtrack-agent")
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
}

/// Tauri IPC command — retrieve the application version.
#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn run() {
    let app = tauri::Builder::default()
        // Single-instance guard — brings existing window to front on second launch
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        // Autostart support
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostarted"]),
        ))
        .plugin(tauri_plugin_shell::init())
        // Register IPC commands
        .invoke_handler(tauri::generate_handler![is_agent_running, app_version])
        .setup(|app| {
            // Build system tray
            let quit_item = MenuItem::with_id(app, "quit", "Quit FlowTrack", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("FlowTrack — tracking")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Double-click tray icon → show window
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        // Hide window instead of closing when user clicks ×
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } if label == "main" => {
            api.prevent_close();
            if let Some(w) = app_handle.get_webview_window("main") {
                let _ = w.hide();
            }
        }
        // Keep the app alive even when all windows are closed (tray-only mode)
        RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });
}
