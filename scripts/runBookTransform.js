const fs = require('fs');
const { transformBooks } = require('../transforms/books/transform-books');

const file = JSON.parse(fs.readFileSync('./datasets/EvergreensFixed.json'));

transformBooks(file);
