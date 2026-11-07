| Input | Run | Baseline median µs | Candidate median µs | Ratio | Candidate pair wins |
|---|---:|---:|---:|---:|---:|
| hls | 1 | 21.89 | 9.07 | 2.41× | 19/20 |
| rustsec | 1 | 23.16 | 5.52 | 4.19× | 19/20 |
| serde-json | 1 | 12.91 | 4.11 | 3.14× | 19/20 |
| generated-hls-128k-whitespace | 1 | 99.54 | 74.68 | 1.33× | 18/20 |
| hls | 2 | 21.06 | 8.37 | 2.52× | 20/20 |
| rustsec | 2 | 19.68 | 6.92 | 2.84× | 20/20 |
| serde-json | 2 | 11.92 | 3.99 | 2.99× | 20/20 |
| generated-hls-128k-whitespace | 2 | 85.12 | 68.11 | 1.25× | 19/20 |
