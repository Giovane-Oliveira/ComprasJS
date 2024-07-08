const sidebarToggle = document.querySelector(".sidebar-toggle");
const sidebar = document.querySelector(".sidebar");

sidebarToggle.addEventListener("click", () => {
  sidebarToggle.classList.toggle("active");
  sidebar.classList.toggle("active");
});
