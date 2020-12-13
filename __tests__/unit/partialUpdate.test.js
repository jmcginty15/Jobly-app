const sqlForPartialUpdate = require('../../helpers/partialUpdate');

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field", function () {

    // FIXME: write real tests!
    const table = 'dogs';
    const items = { age: 6 };
    const key = 'id';
    const id = 3;

    const queryObject = sqlForPartialUpdate(table, items, key, id);

    expect(queryObject.query).toBe('UPDATE dogs SET age=$1 WHERE id=$2 RETURNING *');
    expect(queryObject.values).toEqual([6, 3]);
  });

  it("should generate a proper partial update query with multiple fields", function () {
    const table = 'dogs';
    const items = { age: 6, breed: 'German shepherd', name: 'Rocky' };
    const key = 'id';
    const id = 3;

    const queryObject = sqlForPartialUpdate(table, items, key, id);

    expect(queryObject.query).toBe('UPDATE dogs SET age=$1, breed=$2, name=$3 WHERE id=$4 RETURNING *');
    expect(queryObject.values).toEqual([6, 'German shepherd', 'Rocky', 3]);
  });
});
