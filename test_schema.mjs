

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;

async function check() {
  const res = await fetch(url);
  const data = await res.json();
  const tables = data.definitions ? Object.keys(data.definitions) : 'No definitions';
  console.log("Tables:", tables);
}
check();
