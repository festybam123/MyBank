import db from './src/db.js';

const result = await db.all(
  `SELECT a.account_number, c.name, c.email 
   FROM accounts a 
   JOIN customers c ON a.customer_id = c.id 
   WHERE c.email = ?`,
  ['festusbamikole2018@gmail.com']
);

console.log(JSON.stringify(result, null, 2));
