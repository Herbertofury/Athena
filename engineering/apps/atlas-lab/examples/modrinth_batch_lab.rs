//! Explicit, bounded live comparison. Not run by tests or the background worker.
use atlas_lab::modrinth::{PublicClient, projects_url};
use serde_json::{Value, json};
use std::{io::Write, thread::sleep, time::Instant};

fn emit(value: Value) -> Result<(), Box<dyn std::error::Error>> {
    println!("{}", serde_json::to_string(&value)?);
    std::io::stdout().flush()?;
    Ok(())
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let ids: Vec<String> = std::env::args().skip(1).collect();
    projects_url(&ids)?;
    if ids.len() > 3 {
        return Err("Live comparison budget is at most three projects and five pairs".into());
    }
    emit(
        json!({"schema_version":1,"kind":"header","scope":"live public network comparison of Atlas typed project projection","ids":ids,"pairs":5,"maximum_requests":5*(ids.len()+1),"limits":["Network/CDN state is uncontrolled","No image/video download or full description-body collection","No peak-memory or UI measurement","Only this Atlas collector, not another project's baseline","Fresh TLS client per sample; inter-request cooldown is included, initial cooldown is outside timing"]}),
    )?;
    for round in 0..5 {
        let order = if round % 2 == 0 {
            ["single", "batch"]
        } else {
            ["batch", "single"]
        };
        let mut output = std::collections::HashMap::new();
        for strategy in order {
            // A fresh client per sample prevents one strategy inheriting another's connection.
            let mut client = PublicClient::new()?;
            // Global separation also respects the request budget between fresh clients.
            sleep(std::time::Duration::from_secs(1));
            let start = Instant::now();
            let result: Result<Value, Box<dyn std::error::Error>> = (|| {
                if strategy == "batch" {
                    let batch = client.projects(&ids)?;
                    if !batch.missing_ids.is_empty() {
                        return Err("Missing live projects; incomplete comparison".into());
                    }
                    Ok(serde_json::to_value(batch.projects)?)
                } else {
                    let mut projects = Vec::new();
                    for id in &ids {
                        sleep(client.cooldown_remaining());
                        projects.push(client.project(id)?);
                    }
                    Ok(serde_json::to_value(projects)?)
                }
            })();
            let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
            match result {
                Ok(projects) => {
                    emit(
                        json!({"kind":"sample","round":round,"strategy":strategy,"elapsed_ms":elapsed_ms,"request_count":if strategy=="batch"{1}else{ids.len()},"projects":projects}),
                    )?;
                    output.insert(strategy, projects);
                }
                Err(error) => {
                    emit(
                        json!({"kind":"failure","round":round,"strategy":strategy,"elapsed_ms":elapsed_ms,"message":error.to_string(),"complete":false}),
                    )?;
                    return Err(error);
                }
            }
        }
        let equal = output["single"] == output["batch"];
        emit(json!({"kind":"pair","round":round,"complete_projection_equal":equal}))?;
        if !equal {
            return Err("Complete projected outputs differ; no performance acceptance".into());
        }
    }
    emit(json!({"kind":"completion","complete":true,"pairs":5}))
}
