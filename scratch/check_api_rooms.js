async function main() {
  try {
    const res = await fetch("http://localhost:3001/api/rooms");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Rooms:", data.data.slice(0, 10)); // print first 10 rooms
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
