(() => {
  const HISTORY_KEY = "heartsync-history";
  const form = document.querySelector("#calculator-form");
  const yourName = document.querySelector("#your-name");
  const theirName = document.querySelector("#their-name");
  const overlay = document.querySelector("#result-overlay");
  const historyGrid = document.querySelector("#history-grid");
  const clearHistory = document.querySelector("#clear-history");
  const toast = document.querySelector("#toast");
  let currentResult = null;
  let toastTimer;

  const clamp = (number, min, max) => Math.min(Math.max(number, min), max);

  function cleanName(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function hash(value) {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function calculate(first, second) {
    const one = first.toLowerCase().replace(/[^a-z]/g, "");
    const two = second.toLowerCase().replace(/[^a-z]/g, "");
    const combined = one + two;
    const sharedLetters = [...new Set(one)].filter((letter) => two.includes(letter)).length;
    const lengthBalance = Math.max(0, 12 - Math.abs(one.length - two.length) * 2);
    const classicTrue = [..."true"].reduce((sum, letter) => sum + (combined.match(new RegExp(letter, "g")) || []).length, 0);
    const classicLove = [..."love"].reduce((sum, letter) => sum + (combined.match(new RegExp(letter, "g")) || []).length, 0);
    const classicScore = Number(`${Math.min(classicTrue, 9)}${Math.min(classicLove, 9)}`);
    const score = clamp(Math.round(34 + (hash(combined) % 42) + sharedLetters * 2 + lengthBalance / 2 + classicScore / 10), 8, 98);
    const sync = clamp(Math.round(49 + sharedLetters * 6 + (hash(one) % 19)), 22, 99);
    const spark = clamp(Math.round(42 + (hash(two) % 48) + classicLove), 25, 99);
    const vibe = clamp(Math.round((score + sync + spark) / 3), 25, 99);
    let message;
    if (score >= 88) message = "The stars are being unusually obvious about this one.";
    else if (score >= 72) message = "There is a very cute spark here. Worth investigating.";
    else if (score >= 52) message = "A promising little plot twist could be forming.";
    else if (score >= 32) message = "The vibe is intriguing. Give it another chapter.";
    else message = "Opposites attract… or at least make great stories.";
    return { score, sync, spark, vibe, message };
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch { return []; }
  }

  function saveHistory(item) {
    try {
      const history = [item, ...getHistory().filter((entry) => entry.names !== item.names)].slice(0, 6);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      renderHistory();
    } catch {
      // Private history is an enhancement, never a reason to block a result.
    }
  }

  function renderHistory() {
    const history = getHistory();
    clearHistory.hidden = history.length === 0;
    if (!history.length) {
      historyGrid.innerHTML = '<div class="empty-history">Your future readings will appear here.</div>';
      return;
    }
    historyGrid.innerHTML = "";
    history.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "history-item";
      card.style.animationDelay = `${index * 45}ms`;
      const detail = document.createElement("div");
      const names = document.createElement("div");
      names.className = "history-names";
      names.textContent = item.names;
      const date = document.createElement("div");
      date.className = "history-date";
      date.textContent = item.date;
      detail.append(names, date);
      const score = document.createElement("div");
      score.className = "history-score";
      score.textContent = `${item.score}%`;
      card.append(detail, score);
      historyGrid.append(card);
    });
  }

  function launchConfetti() {
    const colors = ["#f04f75", "#f7b34b", "#a96ce8", "#55b9aa", "#f58d9f"];
    for (let index = 0; index < 25; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 220}px`);
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      document.body.append(piece);
      setTimeout(() => piece.remove(), 2400);
    }
  }

  function openResult(first, second, result) {
    currentResult = { first, second, ...result };
    document.querySelector("#score-number").textContent = result.score;
    document.querySelector("#score-ring").style.setProperty("--score-angle", `${result.score * 3.6}deg`);
    document.querySelector("#result-names").textContent = `${first}  +  ${second}`;
    document.querySelector("#result-title").textContent = result.message;
    document.querySelector("#sync-stat").textContent = `${result.sync}%`;
    document.querySelector("#spark-stat").textContent = `${result.spark}%`;
    document.querySelector("#vibe-stat").textContent = `${result.vibe}%`;
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    launchConfetti();
    document.querySelector("#close-result").focus();
  }

  function closeResult() {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function shareResult() {
    if (!currentResult) return;
    const text = `${currentResult.first} + ${currentResult.second} have ${currentResult.score}% chemistry on HeartSync. ${currentResult.message}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Our HeartSync result", text });
        showToast("Result ready to share ♥");
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Result copied to your clipboard ♥");
      }
    } catch (error) {
      if (error.name !== "AbortError") showToast("Could not share right now");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const first = cleanName(yourName.value);
    const second = cleanName(theirName.value);
    if (!first || !second) return;
    const result = calculate(first, second);
    saveHistory({ names: `${first} + ${second}`, score: result.score, date: "Just now" });
    openResult(first, second, result);
  });

  document.querySelector("#close-result").addEventListener("click", closeResult);
  document.querySelector("#calculate-again").addEventListener("click", () => {
    closeResult();
    yourName.focus();
  });
  document.querySelector("#share-result").addEventListener("click", shareResult);
  clearHistory.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast("Reading history cleared");
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeResult();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-visible")) closeResult();
  });

  renderHistory();
})();