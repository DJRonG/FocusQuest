let score = 0;

function addActivity() {
  const input = document.getElementById("newActivity");
  const activity = input.value.trim();
  if (activity) {
    const list = document.getElementById("activityList");
    const item = document.createElement("li");
    item.textContent = activity;
    list.appendChild(item);

    score += 1;
    document.getElementById("scoreValue").textContent = score;

    input.value = "";
  }
}
