async function test() {
  const mongoose = await import('mongoose');
  
  // Connect directly with the URI
  const uri = 'mongodb+srv://raditjak07_db_user:32HLFdc2C7gdg3umT@dashboard-april.p2ia4ay.mongodb.net/campusify?retryWrites=true&w=majority';
  
  await mongoose.default.connect(uri);
  console.log('Connected to:', mongoose.default.connection.name);
  console.log('Host:', mongoose.default.connection.host);
  console.log('DB name from connection:', mongoose.default.connection.db.databaseName);
  
  // List all databases
  const adminDb = mongoose.default.connection.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log('\nAll databases:');
  dbs.databases.forEach(db => console.log(' -', db.name));
  
  // Check users collection
  const User = mongoose.default.model('User', new mongoose.default.Schema({ email: String }));
  const users = await User.find({});
  console.log('\nUsers in campusify.users:', users.length);
  users.forEach(u => console.log(' -', u.email));
  
  await mongoose.default.disconnect();
}
test().catch(console.error);