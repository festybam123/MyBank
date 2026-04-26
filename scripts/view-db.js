import db from '../src/db.js';

async function viewDatabase() {
  console.log('\n=== MyBank MongoDB Database ===\n');
  
  const collections = await db.listCollections().toArray();
  
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    console.log(`Collection: ${coll.name} (${count} documents)`);
    
    const docs = await db.collection(coll.name).find().toArray();
    docs.forEach((doc, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(doc, (key, val) => 
        typeof val === 'bigint' ? val.toString() : val, 2
      ).replace(/\n/g, '\n    '));
    });
    console.log('');
  }
  
  process.exit(0);
}

viewDatabase().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
