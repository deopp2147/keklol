// ===== Вкладки =====

// Находим все кнопки нижней панели и все вкладки
const buttons = document.querySelectorAll(".tabbar-btn");
const tabs = document.querySelectorAll(".tab");

// Функция показывает нужную вкладку по её id (например, "tab-today")
function showTab(tabId) {
  // Сначала убираем подсветку и скрываем всё
  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });
  buttons.forEach(function (btn) {
    btn.classList.remove("active");
  });

  // Потом включаем только выбранную вкладку и её кнопку
  document.getElementById(tabId).classList.add("active");
  document
    .querySelector('.tabbar-btn[data-tab="' + tabId + '"]')
    .classList.add("active");
}

// Вешаем на каждую кнопку обработчик нажатия
buttons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    // data-tab в HTML хранит id нужной вкладки
    showTab(btn.dataset.tab);
  });
});

// ===== Пары: данные и localStorage =====

const STORAGE_KEY = "lessons";
const DAY_NAMES = [
  "Понедельник", "Вторник", "Среда", "Четверг",
  "Пятница", "Суббота", "Воскресенье"
];

// Номер сегодняшнего дня недели: 0 = понедельник ... 6 = воскресенье
// (в JavaScript getDay() считает с воскресенья, поэтому пересчитываем)
function getTodayIndex() {
  return (new Date().getDay() + 6) % 7;
}

// Читаем пары из localStorage. Если там пусто или что-то сломано — вернём []
function loadLessons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// Сохраняем список пар в localStorage
function saveLessons(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false; // например, приватный режим или нет места
  }
}

let lessons = loadLessons();

// ===== Элементы страницы =====

const form = document.getElementById("lesson-form");
const subjectInput = document.getElementById("lesson-subject");
const startInput = document.getElementById("lesson-start");
const endInput = document.getElementById("lesson-end");
const roomInput = document.getElementById("lesson-room");
const dayInput = document.getElementById("lesson-day");
const messageEl = document.getElementById("form-message");
const listEl = document.getElementById("lesson-list");
const titleEl = document.getElementById("today-title");

// В форме по умолчанию выбран сегодняшний день
dayInput.value = String(getTodayIndex());

function showMessage(text, isError) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", Boolean(isError));
}

// ===== Отрисовка списка =====

function renderLessons() {
  const today = getTodayIndex();
  titleEl.textContent = "Пары на сегодня · " + DAY_NAMES[today];

  // Берём только сегодняшние и сортируем по времени начала.
  // Время вида "09:30" корректно сравнивается как обычная строка.
  const todays = lessons
    .filter(function (lesson) {
      return lesson.day === today;
    })
    .sort(function (a, b) {
      return a.start.localeCompare(b.start) || a.end.localeCompare(b.end);
    });

  listEl.replaceChildren();

  if (todays.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent = "На сегодня пар нет.";
    empty.appendChild(p);
    listEl.appendChild(empty);
    return;
  }

  todays.forEach(function (lesson) {
    listEl.appendChild(createLessonElement(lesson));
  });
}

// Собираем DOM-элемент одной пары.
// Используем textContent, чтобы введённый текст никогда не выполнялся как HTML.
function createLessonElement(lesson) {
  const item = document.createElement("div");
  item.className = "lesson";

  const time = document.createElement("div");
  time.className = "lesson-time";
  time.textContent = lesson.start;
  const timeEnd = document.createElement("small");
  timeEnd.textContent = lesson.end;
  time.appendChild(timeEnd);

  const info = document.createElement("div");
  info.className = "lesson-info";
  const subject = document.createElement("div");
  subject.className = "lesson-subject";
  subject.textContent = lesson.subject;
  info.appendChild(subject);
  if (lesson.room) {
    const room = document.createElement("div");
    room.className = "lesson-room";
    room.textContent = "Аудитория " + lesson.room;
    info.appendChild(room);
  }

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn-delete";
  del.textContent = "Удалить";
  del.setAttribute("aria-label", "Удалить пару: " + lesson.subject);
  del.addEventListener("click", function () {
    deleteLesson(lesson.id);
  });

  item.appendChild(time);
  item.appendChild(info);
  item.appendChild(del);
  return item;
}

// ===== Добавление и удаление =====

function deleteLesson(id) {
  lessons = lessons.filter(function (lesson) {
    return lesson.id !== id;
  });
  saveLessons(lessons);
  renderLessons();
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // не перезагружаем страницу

  const subject = subjectInput.value.trim();
  const start = startInput.value;
  const end = endInput.value;

  if (!subject) {
    showMessage("Введите название предмета.", true);
    return;
  }
  if (!start || !end) {
    showMessage("Укажите время начала и конца.", true);
    return;
  }
  if (end <= start) {
    showMessage("Пара должна заканчиваться позже, чем начинается.", true);
    return;
  }

  const day = Number(dayInput.value);

  lessons.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    subject: subject,
    start: start,
    end: end,
    room: roomInput.value.trim(),
    day: day
  });

  if (!saveLessons(lessons)) {
    showMessage("Не удалось сохранить: хранилище браузера недоступно.", true);
  } else if (day === getTodayIndex()) {
    showMessage("Пара добавлена.", false);
  } else {
    // Пара сохранена, но в списке «сегодня» её не будет — объясняем почему
    showMessage("Пара сохранена на день: " + DAY_NAMES[day] + ".", false);
  }

  // Очищаем поля, день недели оставляем — удобно вносить расписание подряд
  subjectInput.value = "";
  startInput.value = "";
  endInput.value = "";
  roomInput.value = "";
  subjectInput.focus();

  renderLessons();
});

// Первая отрисовка при загрузке страницы
renderLessons();

// Позже здесь появятся функции для домашних заданий,
// например: localStorage.setItem("homework", JSON.stringify(list));