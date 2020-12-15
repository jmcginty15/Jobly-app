DROP TABLE IF EXISTS user_technologies;
DROP TABLE IF EXISTS job_technologies;
DROP TABLE IF EXISTS technologies;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
  handle TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  num_employees INTEGER,
  description TEXT,
  logo_url TEXT
);

CREATE TABLE technologies (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

CREATE TABLE jobs (
  id serial PRIMARY KEY,
  title text NOT NULL,
  salary float NOT NULL,
  equity float NOT NULL CHECK(equity <= 1),
  company_handle text NOT NULL REFERENCES companies ON DELETE CASCADE,
  date_posted date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE job_technologies (
  id serial PRIMARY KEY,
  job_id integer REFERENCES jobs ON DELETE CASCADE,
  technology_id integer REFERENCES technologies ON DELETE CASCADE
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  photo_url text,
  is_admin boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE user_technologies (
  id serial PRIMARY KEY,
  username text REFERENCES users ON DELETE CASCADE,
  technology_id integer REFERENCES technologies ON DELETE CASCADE
);

CREATE TABLE applications (
  username text REFERENCES users ON DELETE CASCADE,
  job_id integer REFERENCES jobs ON DELETE CASCADE,
  state text DEFAULT 'interested' NOT NULL,
  created_at date DEFAULT CURRENT_DATE NOT NULL
);

INSERT INTO companies (handle, name, num_employees, description, logo_url)
  VALUES ('springboard', 'Springboard', 5000, 'Software development bootcamp service', 'springboard.com'),
  ('black_rifle_coffee', 'Black Rifle Coffee', 300, 'Patriotic coffee company', 'blackriflecoffee.com'),
  ('austal_usa', 'Austal USA', 1000, 'US affiliate of an Australian shipbuilding company', 'austalusa.com');

INSERT INTO technologies (name)
  VALUES ('Python'), ('JavaScript'), ('Microsoft Excel'), ('Brewing'), ('Rifles'), ('AutoCAD');

INSERT INTO jobs (title, salary, equity, company_handle, date_posted)
  VALUES ('Software Engineer', 80000, 0.25, 'springboard', '2017-06-06'),
  ('Instructor', 100000, 0.3, 'springboard', '2020-01-09'),
  ('Coffee Enthusiast', 150000, 0.75, 'black_rifle_coffee', '2019-12-15'),
  ('Planner I', 61000, 0, 'austal_usa', '2020-11-20'),
  ('Mechanical Engineer I', 90000, 0.1, 'austal_usa', '2018-03-27');

INSERT INTO job_technologies (job_id, technology_id)
  VALUES (1, 1), (1, 2), (2, 1), (2, 2), (3, 4), (3, 5), (4, 3), (5, 6);

INSERT INTO users (username, password, first_name, last_name, email, photo_url)
  VALUES ('jmcginty15', 'password', 'Jason', 'McGinty', 'jason_mcginty@yahoo.com', 'something.org'),
  ('zach_mcginty', 'yeet', 'Zach', 'McGinty', 'zach.mcginty@gmail.com', 'yeet.com'),
  ('cowboy420', 'nice', 'Woody', 'Cowboy', 'theresasnakeinmyboot@gmail.com', 'snake.com'),
  ('spaceranger69', 'nice', 'Buzz', 'Lightyear', 'totherescue@yahoo.com', 'buzz.com');

INSERT INTO user_technologies (username, technology_id)
  VALUES ('jmcginty15', 1),
  ('jmcginty15', 2),
  ('jmcginty15', 3),
  ('jmcginty15', 4),
  ('zach_mcginty', 3),
  ('zach_mcginty', 4),
  ('cowboy420', 4),
  ('spaceranger69', 6);