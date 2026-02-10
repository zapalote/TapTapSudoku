function formatTime(elapsed) {
  const minute = Math.floor(elapsed / 60);
  const second = elapsed % 60;
  return [minute, second].map(x => x < 10 ? '0' + x : x).join(':');
}
function ft (elapsed) {
  const minute = Math.floor(elapsed / 60);
  const second = elapsed % 60;
  return minute.toString().padStart(2, '0') + ':' + second.toString().padStart(2, '0');
}
const startTime = Date.now();
for (let i=0; i < 1000; i++) {
    console.log(ft(i));
}