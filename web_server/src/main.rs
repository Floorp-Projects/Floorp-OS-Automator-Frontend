use actix_web::{App, HttpResponse, HttpServer, get, middleware::Logger, web};
use actix_web_static_files::ResourceFiles;
use log::{error, info};
use std::env;

include!(concat!(env!("OUT_DIR"), "/generated.rs"));

#[get("/")]
async fn index() -> HttpResponse {
    serve_index().await
}

#[get("/index.html")]
async fn index_html() -> HttpResponse {
    serve_index().await
}

async fn serve_index() -> HttpResponse {
    let generated = generate();
    let index_file = match generated.get("index.html") {
        Some(file) => file,
        None => return HttpResponse::NotFound().finish(),
    };

    let mut html = String::from_utf8_lossy(index_file.data).into_owned();

    // Inject backend URL if environment variable is set
    if let Ok(url) = env::var("SAPPHILLON_GRPC_BASE_URL") {
        let script = format!(
            r#"<script>window.__SAPPHILLON_GRPC_BASE__ = "{}";</script>"#,
            url
        );
        // Inject before </head> or <body>
        if let Some(pos) = html.find("</head>") {
            html.insert_str(pos, &script);
        } else if let Some(pos) = html.find("<body>") {
            html.insert_str(pos + 6, &script);
        } else {
            html.insert_str(0, &script);
        }
    }

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let level = env::var("RUST_LOG").unwrap_or_else(|_| "info".into());
    unsafe {
        env::set_var("RUST_LOG", &level);
    }
    env_logger::init();

    let listen = env::var("LISTEN").unwrap_or_else(|_| "127.0.0.1:8081".into());

    // Attempt to bind the server and log any bind errors
    let server = match HttpServer::new(|| {
        let generated = generate();
        App::new()
            .wrap(Logger::default())
            .service(index)
            .service(index_html)
            .service(ResourceFiles::new("/", generated))
            .default_service(web::route().to(serve_index))
    })
    .bind(&listen)
    {
        Ok(s) => s,
        Err(e) => {
            error!("Failed to bind to {}: {}", listen, e);
            return Err(e);
        }
    };

    if let Some(addr) = server.addrs().first() {
        info!("listening on {}", addr);
    }

    // Run server and log any runtime errors
    let handle = actix_web::rt::spawn(async move {
        if let Err(e) = server.run().await {
            error!("Server error: {}", e);
        }
    });

    handle.await?;
    Ok(())
}
