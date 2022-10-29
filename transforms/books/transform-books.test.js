const { transformBooks, renameBook, nodeIsBook } = require('./transform-books');

test('node is book', () => {
    expect(nodeIsBook('Book/ I am a book')).toBe(true);
    expect(nodeIsBook('Book I am not a book')).toBe(false);
    expect(nodeIsBook('I am not a book')).toBe(false);
});

test('renames books', () => {
    expect(renameBook('Book/ I am a book')).toBe('I am a book');
});

test('adds supertag and renames the title', () => {
    const input = {
        nodes: [
            {
                name: 'I am not a book'
            },
            {
                name: 'Book/ How the cookie crumbles'
            }
        ]
    };

    expect(transformBooks(input)).toEqual({
        nodes: [
            {
                name: 'I am not a book'
            },
            {
                name: 'How the cookie crumbles',
                supertags: ['Book']
            }
        ]
    });
});
