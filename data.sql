DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
  handle TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  num_employees INTEGER,
  description TEXT,
  logo_url TEXT
);

CREATE TABLE jobs (
  id serial PRIMARY KEY,
  title text NOT NULL,
  salary float NOT NULL,
  equity float NOT NULL CHECK(equity <= 1),
  company_handle text NOT NULL REFERENCES companies ON DELETE CASCADE,
  date_posted date DEFAULT CURRENT_DATE NOT NULL
);

INSERT INTO companies (handle, name, num_employees, description, logo_url)
  VALUES ('springboard', 'Springboard', 5000, 'Software development bootcamp service', 'springboard.com'),
  ('black_rifle_coffee', 'Black Rifle Coffee', 300, 'Patriotic coffee company', 'blackriflecoffee.com'),
  ('austal_usa', 'Austal USA', 1000, 'US affiliate of an Australian shipbuilding company', 'austalusa.com');

INSERT INTO jobs (title, salary, equity, company_handle, date_posted)
  VALUES ('Software Engineer', 80000, 0.25, 'springboard', '2017-06-06'),
  ('Instructor', 100000, 0.3, 'springboard', '2020-01-09'),
  ('Coffee Enthusiast', 150000, 0.75, 'black_rifle_coffee', '2019-12-15'),
  ('Planner I', 61000, 0, 'austal_usa', '2020-11-20'),
  ('Mechanical Engineer I', 90000, 0.1, 'austal_usa', '2018-03-27');