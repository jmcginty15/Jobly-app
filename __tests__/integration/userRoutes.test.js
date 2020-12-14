process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

beforeEach(async function () {
    await db.query(`DELETE FROM users`);
    await db.query(`INSERT INTO users (username, password, first_name, last_name, email, photo_url)
    VALUES ('jmcginty15', 'butthole', 'Jason', 'McGinty', 'jason_mcginty@yahoo.com', 'something.org'),
    ('zach_mcginty', 'yeet', 'Zach', 'McGinty', 'zach.mcginty@gmail.com', 'yeet.com'),
    ('cowboy420', 'nice', 'Woody', 'Cowboy', 'theresasnakeinmyboot@gmail.com', 'snake.com'),
    ('spaceranger69', 'nice', 'Buzz', 'Lightyear', 'totherescue@yahoo.com', 'buzz.com')`);
});
