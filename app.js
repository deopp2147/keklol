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

// Позже здесь появятся функции для работы с localStorage,
// например: localStorage.setItem("homework", JSON.stringify(list));