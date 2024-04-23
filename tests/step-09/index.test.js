const {readCSV} = require('../../src/csvReader');
const {executeSELECTQuery } = require('../../src/queryExecuter');
const {parseJoinClause, parseSelectQuery } = require('../../src/queryParser');

test('Read CSV File', async () => {
    const data = await readCSV('./student.csv');
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBe(5);
    expect(data[0].name).toBe('John');
    expect(data[0].age).toBe('30'); //ignore the string type here, we will fix this later
});

test('Parse SQL Query', () => {
    const query = 'SELECT id, name FROM student';
    const parsed = parseSelectQuery(query);
    expect(parsed).toEqual({
        fields: ['id', 'name'],
        table: 'student',
        whereClauses: [],
        joinCondition: null,
        joinTable: null,
        joinType: null,
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with WHERE Clause', () => {
    const query = 'SELECT id, name FROM student WHERE age = 25';
    const parsed = parseSelectQuery(query);
    expect(parsed).toEqual({
        fields: ['id', 'name'],
        table: 'student',
        whereClauses: [{
            "field": "age",
            "operator": "=",
            "value": "25",
        }],
        joinCondition: null,
        joinTable: null,
        joinType: null,
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with Multiple WHERE Clauses', () => {
    const query = 'SELECT id, name FROM student WHERE age = 30 AND name = John';
    const parsed = parseSelectQuery(query);
    expect(parsed).toEqual({
        fields: ['id', 'name'],
        table: 'student',
        whereClauses: [{
            "field": "age",
            "operator": "=",
            "value": "30",
        }, {
            "field": "name",
            "operator": "=",
            "value": "John",
        }],
        joinCondition: null,
        joinTable: null,
        joinType: null,
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with INNER JOIN', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student INNER JOIN enrollment ON student.id=enrollment.student_id';
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        fields: ['student.name', 'enrollment.course'],
        table: 'student',
        whereClauses: [],
        joinTable: 'enrollment',
        joinType: "INNER",
        joinCondition: { left: 'student.id', right: 'enrollment.student_id' },
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    })
});

test('Parse SQL Query with INNER JOIN and WHERE Clause', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student INNER JOIN enrollment ON student.id = enrollment.student_id WHERE student.age > 20';
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        fields: ['student.name', 'enrollment.course'],
        table: 'student',
        whereClauses: [{ field: 'student.age', operator: '>', value: '20' }],
        joinTable: 'enrollment',
        joinType: "INNER",
        joinCondition: { left: 'student.id', right: 'enrollment.student_id' },
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    })
});

test('Parse INNER JOIN clause', () => {
    const query = 'SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.ref_id';
    const result = parseJoinClause(query);
    expect(result).toEqual({
        joinType: 'INNER',
        joinTable: 'table2',
        joinCondition: { left: 'table1.id', right: 'table2.ref_id' }
    });
});

test('Parse LEFT JOIN clause', () => {
    const query = 'SELECT * FROM table1 LEFT JOIN table2 ON table1.id = table2.ref_id';
    const result = parseJoinClause(query);
    expect(result).toEqual({
        joinType: 'LEFT',
        joinTable: 'table2',
        joinCondition: { left: 'table1.id', right: 'table2.ref_id' }
    });
});

test('Parse RIGHT JOIN clause', () => {
    const query = 'SELECT * FROM table1 RIGHT JOIN table2 ON table1.id = table2.ref_id';
    const result = parseJoinClause(query);
    expect(result).toEqual({
        joinType: 'RIGHT',
        joinTable: 'table2',
        joinCondition: { left: 'table1.id', right: 'table2.ref_id' }
    });
});

test('Returns null for queries without JOIN', () => {
    const query = 'SELECT * FROM table1';
    const result = parseJoinClause(query);
    console.log({ result });
    expect(result).toEqual(
        {
            joinType: null,
            joinTable: null,
            joinCondition: null
        }
    );
});

test('Parse LEFT Join Query Completely', () => {
    const query = 'SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id';
    const result = parseSelectQuery(query);
    expect(result).toEqual({
        fields: ['student.name', 'enrollment.course'],
        table: 'student',
        whereClauses: [],
        joinType: 'LEFT',
        joinTable: 'enrollment',
        joinCondition: { left: 'student.id', right: 'enrollment.student_id' },
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    })
})

test('Parse RIGHT Join Query Completely', () => {
    const query = 'SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id';
    const result = parseSelectQuery(query);
    expect(result).toEqual({
        fields: ['student.name', 'enrollment.course'],
        table: 'student',
        whereClauses: [],
        joinType: 'RIGHT',
        joinTable: 'enrollment',
        joinCondition: { left: 'student.id', right: 'enrollment.student_id' },
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    })
})

test('Parse SQL Query with LEFT JOIN with a WHERE clause filtering the main table', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id WHERE student.age > 22';
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        "fields": ["student.name", "enrollment.course"],
        "joinCondition": { "left": "student.id", "right": "enrollment.student_id" },
        "joinTable": "enrollment",
        "joinType": "LEFT",
        "table": "student",
        "whereClauses": [{ "field": "student.age", "operator": ">", "value": "22" }],
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with LEFT JOIN with a WHERE clause filtering the join table', async () => {
    const query = `SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id WHERE enrollment.course = 'Physics'`;
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        "fields": ["student.name", "enrollment.course"],
        "joinCondition": { "left": "student.id", "right": "enrollment.student_id" },
        "joinTable": "enrollment",
        "joinType": "LEFT",
        "table": "student",
        "whereClauses": [{ "field": "enrollment.course", "operator": "=", "value": "'Physics'" }],
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with RIGHT JOIN with a WHERE clause filtering the main table', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id WHERE student.age < 25';
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        "fields": ["student.name", "enrollment.course"],
        "joinCondition": { "left": "student.id", "right": "enrollment.student_id" },
        "joinTable": "enrollment",
        "joinType": "RIGHT",
        "table": "student",
        "whereClauses": [{ "field": "student.age", "operator": "<", "value": "25" }],
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Parse SQL Query with RIGHT JOIN with a WHERE clause filtering the join table', async () => {
    const query = `SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id WHERE enrollment.course = 'Chemistry'`;
    const result = await parseSelectQuery(query);
    expect(result).toEqual({
        "fields": ["student.name", "enrollment.course"],
        "joinCondition": { "left": "student.id", "right": "enrollment.student_id" },
        "joinTable": "enrollment",
        "joinType": "RIGHT",
        "table": "student",
        "whereClauses": [{ "field": "enrollment.course", "operator": "=", "value": "'Chemistry'" }],
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});

test('Execute SQL Query', async () => {
    const query = 'SELECT id, name FROM student';
    const result = await executeSELECTQuery(query);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).not.toHaveProperty('age');
    expect(result[0]).toEqual({ id: '1', name: 'John' });
});

test('Execute SQL Query with WHERE Clause', async () => {
    const query = 'SELECT id, name FROM student WHERE age = 25';
    const result = await executeSELECTQuery(query);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0].id).toBe('2');
});

test('Execute SQL Query with Complex WHERE Clause', async () => {
    const query = 'SELECT id, name FROM student WHERE age = 30 AND name = John';
    const result = await executeSELECTQuery(query);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ id: '1', name: 'John' });
});

test('Execute SQL Query with Greater Than', async () => {
    const queryWithGT = 'SELECT id FROM student WHERE age > 22';
    const result = await executeSELECTQuery(queryWithGT);
    expect(result.length).toEqual(3);
    expect(result[0]).toHaveProperty('id');
});

test('Execute SQL Query with Not Equal to', async () => {
    const queryWithGT = 'SELECT name FROM student WHERE age != 25';
    const result = await executeSELECTQuery(queryWithGT);
    expect(result.length).toEqual(4);
    expect(result[0]).toHaveProperty('name');
});

test('Execute SQL Query with INNER JOIN', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student INNER JOIN enrollment ON student.id=enrollment.student_id';
    const result = await executeSELECTQuery(query);
    /*
    result = [
      { 'student.name': 'John', 'enrollment.course': 'Mathematics' },
      { 'student.name': 'John', 'enrollment.course': 'Physics' },
      { 'student.name': 'Jane', 'enrollment.course': 'Chemistry' },
      { 'student.name': 'Bob', 'enrollment.course': 'Mathematics' }
    ]
    */
    expect(result.length).toEqual(6);
    // toHaveProperty is not working here due to dot in the property name
    expect(result[0]).toEqual(expect.objectContaining({
        "enrollment.course": "Mathematics",
        "student.name": "John"
    }));
});

test('Execute SQL Query with INNER JOIN and a WHERE Clause', async () => {
    const query = 'SELECT student.name, enrollment.course, student.age FROM student INNER JOIN enrollment ON student.id = enrollment.student_id WHERE student.age > 25';
    const result = await executeSELECTQuery(query);
    /*
    result =  [
      {
        'student.name': 'John',
        'enrollment.course': 'Mathematics',
        'student.age': '30'
      },
      {
        'student.name': 'John',
        'enrollment.course': 'Physics',
        'student.age': '30'
      }
    ]
    */
    expect(result.length).toEqual(2);
    // toHaveProperty is not working here due to dot in the property name
    expect(result[0]).toEqual(expect.objectContaining({
        "enrollment.course": "Mathematics",
        "student.name": "John"
    }));
});

test('Execute SQL Query with LEFT JOIN', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id';
    const result = await executeSELECTQuery(query);
    console.log("result",result);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "student.name": "Alice", "enrollment.course": null }),
        expect.objectContaining({ "student.name": "John", "enrollment.course": "Mathematics" })
    ]));
    expect(result.length).toEqual(7); // 4 students, but John appears twice
});

test('Execute SQL Query with RIGHT JOIN', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id';
    const result = await executeSELECTQuery(query);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "student.name": "Jane", "enrollment.course": "Biology" }),
        expect.objectContaining({ "student.name": "John", "enrollment.course": "Mathematics" })
    ]));
    expect(result.length).toEqual(6); // 4 courses, but Mathematics appears twice
});

test('Execute SQL Query with LEFT JOIN with a WHERE clause filtering the main table', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id WHERE student.age > 22';
    const result = await executeSELECTQuery(query);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "enrollment.course": "Mathematics", "student.name": "John" }),
        expect.objectContaining({ "enrollment.course": "Physics", "student.name": "John" })
    ]));
    expect(result.length).toEqual(4);
});

test('Execute SQL Query with LEFT JOIN with a WHERE clause filtering the join table', async () => {
    const query = `SELECT student.name, enrollment.course FROM student LEFT JOIN enrollment ON student.id=enrollment.student_id WHERE enrollment.course = 'Physics'`;
    const result = await executeSELECTQuery(query);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "student.name": "John", "enrollment.course": "Physics" })
    ]));
    expect(result.length).toEqual(2);
});

test('Execute SQL Query with RIGHT JOIN with a WHERE clause filtering the main table', async () => {
    const query = 'SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id WHERE student.age < 25';
    const result = await executeSELECTQuery(query);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "enrollment.course": "Mathematics", "student.name": "Bob" }),
        expect.objectContaining({ "enrollment.course": "Biology", "student.name": "Jane" })
    ]));
    expect(result.length).toEqual(3);
});

test('Execute SQL Query with RIGHT JOIN with a WHERE clause filtering the join table', async () => {
    const query = `SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id WHERE enrollment.course = 'Chemistry'`;
    const result = await executeSELECTQuery(query);
    expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ "enrollment.course": "Chemistry", "student.name": "Jane" }),
    ]));
    expect(result.length).toEqual(1);
});

test('Execute SQL Query with RIGHT JOIN with a multiple WHERE clauses filtering the join table and main table', async () => {
    const query = `SELECT student.name, enrollment.course FROM student RIGHT JOIN enrollment ON student.id=enrollment.student_id WHERE enrollment.course = 'Chemistry' AND student.age = 26`;
    const result = await executeSELECTQuery(query);
    expect(result).toEqual([]);
});