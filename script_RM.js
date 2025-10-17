let score = 0;

function addActivity() {
  const input = document.getElementById("newActivity");
  const list = document.getElementById("activityList");
  const scoreDisplay = document.getElementById("scoreValue");
  const liveRegion = document.getElementById("liveRegion"); // Optional for accessibility
  const value = input.value.trim();

  if (value === "") {
    alert("Please enter an activity.");
    return;
  }

  // Check for duplicates
  const existingItems = Array.from(list.children).map(li => li.textContent.toLowerCase());
  if (existingItems.includes(value.toLowerCase())) {
    alert("This activity is already listed.");
    return;
  }

  // Add new activity
  const li = document.createElement("li");
  li.textContent = value;
  list.appendChild(li);

  // Update score
  score += 10;
  if (scoreDisplay) {
    scoreDisplay.textContent = score;
  } else {
    console.warn("Score display element not found.");
  }

  // Optional: update ARIA live region for screen readers
  if (liveRegion) {
    liveRegion.textContent = `Added activity: ${value}. Score is now ${score}.`;
  }

  input.value = "";
}
