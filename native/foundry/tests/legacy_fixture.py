from contextlib import closing
import os
import sqlite3,pathlib,sys
SCHEMA=(pathlib.Path(__file__).resolve().parents[3]/'crates/athena-foundry-store/tests/fixtures/legacy-schema.sql')
def create(path):
 with closing(sqlite3.connect(path)) as db, db:
  db.executescript(SCHEMA.read_text())
  db.executescript("INSERT INTO metadata VALUES('schema_version','1'); INSERT INTO metadata VALUES('private_marker','not-for-output'); INSERT INTO theme_packages VALUES('frutiger-aero','Aero','1',1,'world','glass','soft','{}'); INSERT INTO rooms VALUES('frutiger-aero:room:aqua-atrium','frutiger-aero','district','Aqua','source','{}'); INSERT INTO room_soundtracks VALUES('frutiger-aero','frutiger-aero:room:aqua-atrium','apple','https://music.apple.com/us/search?term=Calm','Calm','USER_SEARCH_ROUTE','route-1',123456789); INSERT INTO history(event_type,payload_json,created_at) VALUES('private','private_marker',1); INSERT INTO ecology_objects VALUES('custom','frutiger-aero','private_marker','role','glass','orb','[]','{}','{}');")
if __name__=='__main__':create(sys.argv[1])
