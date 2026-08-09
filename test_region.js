const postgres = require('postgres');
const regions = [
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'ap-southeast-2', 'sa-east-1', 'ca-central-1'
];
const password = encodeURIComponent('Ke@0911434441');
const ref = 'oobsztipkddfcolbofyt';

async function test() {
  for (const r of regions) {
    const url = `postgresql://postgres.${ref}:${password}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
    console.log('Testing', r);
    try {
      const sql = postgres(url, { max: 1, connect_timeout: 5, prepare: false });
      await sql`SELECT 1`;
      console.log('SUCCESS:', r);
      process.exit(0);
    } catch (e) {
      if (e.message && e.message.includes('password authentication failed')) {
        console.log('AUTH FAILED FOR:', r, 'but tenant exists!');
      } else if (e.message && e.message.includes('tenant/user')) {
        // console.log('TENANT NOT FOUND:', r);
      } else {
        console.log('ERROR:', r, e.message);
      }
    }
  }
  console.log('FAILED ALL');
}
test();
