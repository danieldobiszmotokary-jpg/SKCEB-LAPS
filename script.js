const UPDATE_INTERVAL = 20000; // 20 seconds
let timer = null;
let chart = null;
let lapData = JSON.parse(localStorage.getItem("lapData") || "{}");

const tableBody = document.querySelector("#timingTable tbody");
const startBtn = document.getElementById("startBtn");
const apexUrlInput = document.getElementById("apexUrl");

startBtn.onclick = () => {
  if (!apexUrlInput.value) {
    alert("Paste Apex Timing URL first");
    return;
  }
  if (timer) clearInterval(timer);
  fetchTiming();
  timer = setInterval(fetchTiming, UPDATE_INTERVAL);
};

async function fetchTiming() {
  try {
    const res = await fetch(apexUrlInput.value);
    const text = await res.text();
    parseTiming(text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

function parseTiming(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("table tbody tr");

  tableBody.innerHTML = "";

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 5) return;

    const position = cells[0].innerText.trim();
    const team = cells[1].innerText.trim();
    const kart = cells[2].innerText.trim();
    const lastLap = cells[3].innerText.trim();
    const bestLap = cells[4].innerText.trim();

    if (!lapData[team]) lapData[team] = [];

    if (
      lastLap &&
      !lapData[team].includes(lastLap)
    ) {
      lapData[team].push(lastLap);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${position}</td>
      <td>${team}</td>
      <td>${kart}</td>
      <td>${lastLap}</td>
      <td>${bestLap}</td>
      <td><button onclick="openGraph('${team}')">📈</button></td>
    `;
    tableBody.appendChild(tr);
  });

  localStorage.setItem("lapData", JSON.stringify(lapData));
}

function openGraph(team) {
  document.getElementById("graphOverlay").classList.remove("hidden");

  const ctx = document.getElementById("lapChart").getContext("2d");
  const times = lapData[team].map(t => lapToSeconds(t));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: times.map((_, i) => i + 1),
      datasets: [{
        label: team,
        data: times,
        borderWidth: 2,
        borderColor: "#2ecc71",
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { reverse: true, title: { display: true, text: "Lap Time (s)" }},
        x: { title: { display: true, text: "Lap" }}
      }
    }
  });
}

document.getElementById("closeGraph").onclick = () => {
  document.getElementById("graphOverlay").classList.add("hidden");
};

function lapToSeconds(lap) {
  const [m, s] = lap.split(":");
  return parseInt(m) * 60 + parseFloat(s);
}
