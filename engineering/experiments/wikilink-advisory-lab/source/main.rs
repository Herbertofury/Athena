use pulldown_cmark::{Options, Parser};
fn main() {
 let args: Vec<String> = std::env::args().collect();
 if args.len()!=3 { panic!("Expected bounded repeat count and wikilinks flag"); }
 let n: usize=args[1].parse().unwrap(); assert!(n<=16 && n>0);
 let enabled=match args[2].as_str(){"on"=>true,"off"=>false,_=>panic!("Invalid option")};
 let options=if enabled{Options::ENABLE_WIKILINKS}else{Options::empty()};
 let input="[[a|]] ".repeat(n);
 let start=std::time::Instant::now();
 let count=Parser::new_ext(&input,options).take(500_001).count();
 println!("{{\"repetitions\":{},\"input_bytes\":{},\"wikilinks\":{},\"event_count\":{},\"event_cap_reached\":{},\"elapsed_ns\":{}}}",n,input.len(),enabled,count,count>500_000,start.elapsed().as_nanos());
}
