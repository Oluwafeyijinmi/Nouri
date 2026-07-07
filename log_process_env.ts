console.log("=== Nomba Environment Variables in process.env ===");
const keys = Object.keys(process.env);
const nombaKeys = keys.filter(k => k.includes("NOMBA"));

console.log("Found Nomba keys:", nombaKeys);

nombaKeys.forEach(key => {
  const val = process.env[key];
  if (val) {
    console.log(`- ${key}: Configured (Length: ${val.length}, Preview: ${val.slice(0, 10)}...)`);
  } else {
    console.log(`- ${key}: Configured but empty/undefined`);
  }
});
