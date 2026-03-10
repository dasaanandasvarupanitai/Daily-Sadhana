/* eslint-disable */
const fs = require('fs');
const xlsx = require('xlsx');

const data = [
  { Number: 1, Title: 'Introduction to Bhagavad Gita', URL: 'https://youtube.com/watch?v=example1' },
  { Number: 2, Title: 'Chapter 1: Observing the Armies', URL: 'https://youtube.com/watch?v=example2' },
  { Number: 3, Title: 'Chapter 2: Contents of the Gita Summarized', URL: 'https://youtube.com/watch?v=example3' }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Listenings");

xlsx.writeFile(wb, 'listenings-template.xlsx');
console.log("listenings-template.xlsx created successfully!");
