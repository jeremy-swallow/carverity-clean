let toastTimeout: number | null = null;

function show(msg: string, color: string) {
  let el = document.getElementById("toast-banner");

  if (!el) {
    el = document.createElement("div");
    el.id = "toast-banner";
    el.style.position = "fixed";
    el.style.bottom = "24px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "12px 18px";
    el.style.borderRadius = "10px";
    el.style.color = "white";
    el.style.fontSize = "14px";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
  }

  el.style.background = color;
  el.innerText = msg;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    el!.remove();
  }, 3000);
}

const Toast = {
  info(msg: string) {
    show(msg, "#3498db");
  },
  success(msg: string) {
    show(msg, "#2ecc71");
  },
  error(msg: string) {
    show(msg, "#e74c3c");
  },
};

export default Toast;
