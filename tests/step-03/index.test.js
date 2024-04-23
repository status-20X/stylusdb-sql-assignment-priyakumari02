const {readCSV} = require('../../src/csvReader');
const {parseSelectQuery } = require('../../src/queryParser');

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
        joinType: null,
        joinCondition: null,
        joinTable: null,
        groupByFields: null,
        hasAggregateWithoutGroupBy: false,
        limit: null,
        isDistinct: false,
        orderByFields: null,
    });
});