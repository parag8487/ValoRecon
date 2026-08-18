use std::net::TcpListener;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use rand::RngCore;

pub struct SidecarProcess {
    pub port: u16,
    pub token: String,
    pub child: Option<Child>,
}

pub type SharedSidecar = Arc<Mutex<Option<SidecarProcess>>>;

pub fn allocate_free_port() -> u16 {
    // Attempt binding to port 0 to get an OS-assigned ephemeral loopback port
    if let Ok(listener) = TcpListener::bind("127.0.0.1:0") {
        if let Ok(addr) = listener.local_addr() {
            return addr.port();
        }
    }
    // Fallback to safe default port in 8790-8799 range
    8799
}

pub fn generate_launch_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let mut s = String::with_capacity(64);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

pub async fn poll_health(port: u16, token: &str, max_wait_ms: u64) -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(500))
        .build()
        .unwrap_or_default();

    let url = format!("http://127.0.0.1:{}/api/health", port);
    let start = std::time::Instant::now();
    let mut delay = Duration::from_millis(50);

    while start.elapsed().as_millis() < max_wait_ms as u128 {
        if let Ok(resp) = client.get(&url).header("x-valorecon-token", token).send().await {
            if resp.status().is_success() {
                return true;
            }
        }
        tokio::time::sleep(delay).await;
        delay = std::cmp::min(delay * 2, Duration::from_millis(500));
    }
    false
}

pub fn spawn_sidecar(port: u16, token: &str) -> Result<Child, std::io::Error> {
    let mut server_entry = std::path::PathBuf::from("server/dist/index.js");

    let mut search_roots = Vec::new();
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            search_roots.extend(exe_dir.ancestors().map(|p| p.to_path_buf()));
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        search_roots.extend(cwd.ancestors().map(|p| p.to_path_buf()));
    }

    'outer: for root in search_roots {
        let candidates = [
            root.join("resources").join("server.js"),
            root.join("server.js"),
            root.join("resources").join("server").join("dist").join("index.js"),
            root.join("server").join("dist").join("index.js"),
            root.join("dist").join("index.js"),
        ];
        for cand in candidates {
            if cand.exists() {
                server_entry = cand;
                break 'outer;
            }
        }
    }

    let mut cmd = Command::new("node");
    cmd.arg(&server_entry)
        .env("PORT", port.to_string())
        .env("HOST", "127.0.0.1")
        .env("VALORECON_LAUNCH_TOKEN", token)
        .env("VALORECON_DEV_BOOTSTRAP", "0")
        .env("NODE_ENV", "production");

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.spawn()
}

pub async fn shutdown_sidecar(shared: &SharedSidecar) {
    let mut guard = shared.lock().unwrap();
    if let Some(mut sidecar) = guard.take() {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_millis(1000))
            .build()
            .unwrap_or_default();

        let shutdown_url = format!("http://127.0.0.1:{}/api/agent/shutdown", sidecar.port);
        let _ = client
            .post(&shutdown_url)
            .header("x-valorecon-token", &sidecar.token)
            .send()
            .await;

        tokio::time::sleep(Duration::from_millis(200)).await;

        if let Some(mut child) = sidecar.child.take() {
            let _ = child.kill();
        }
    }
}
