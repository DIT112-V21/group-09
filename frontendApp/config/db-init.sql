CREATE TABLE IF NOT EXISTS options (
	option_id serial PRIMARY KEY,
	option_name varchar(100) NOT NULL DEFAULT '',
	option_value json NOT NULL
);