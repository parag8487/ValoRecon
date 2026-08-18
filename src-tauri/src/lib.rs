mod sidecar;
mod tray;

use sidecar::{
    allocate_free_port, generate_launch_token, poll_health, shutdown_sidecar, spawn_sidecar,
    SidecarProcess,
};
use std::sync::{Arc, Mutex};
use tauri::{WebviewUrl, WebviewWindowBuilder};

pub fn run() {
    let shared_sidecar: Arc<Mutex<Option<SidecarProcess>>> = Arc::new(Mutex::new(None));
    let shared_for_setup = Arc::clone(&shared_sidecar);
    let shared_for_exit = Arc::clone(&shared_sidecar);

    tauri::Builder::default()
        .setup(move |app| {
            let port = allocate_free_port();
            let token = generate_launch_token();

            // Spawn sidecar process
            let child = spawn_sidecar(port, &token).ok();

            *shared_for_setup.lock().unwrap() = Some(SidecarProcess {
                port,
                token: token.clone(),
                child,
            });

            // Setup system tray
            let _ = tray::setup_tray(app.handle());

            // Build main window with bootstrap injection
            let bootstrap_js = format!(
                "window.__VALORECON_BOOTSTRAP__ = {{ port: {}, token: '{}' }};",
                port, token
            );

            let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("ValoRecon")
                .inner_size(1280.0, 820.0)
                .min_inner_size(960.0, 600.0)
                .center()
                .initialization_script(&bootstrap_js)
                .build()?;

            let _ = win.show();

            // Poll health in background
            let token_clone = token.clone();
            tauri::async_runtime::spawn(async move {
                let healthy = poll_health(port, &token_clone, 10000).await;
                if !healthy {
                    eprintln!("Warning: ValoRecon sidecar health poll timed out on port {}", port);
                }
            });

            Ok(())
        })
        .on_window_event(move |_app, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Window destroyed
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
                let shared_clone = Arc::clone(&shared_for_exit);
                tauri::async_runtime::block_on(async {
                    shutdown_sidecar(&shared_clone).await;
                });
            }
        });
}
