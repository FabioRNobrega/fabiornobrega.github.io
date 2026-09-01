(function () {
  function getCodeText(code) {
    var clone = code.cloneNode(true);
    var lineNumbers = clone.querySelectorAll(".lineno");

    lineNumbers.forEach(function (lineNumber) {
      lineNumber.remove();
    });

    return clone.textContent.replace(/\n$/, "");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }

  function addCopyButton(pre) {
    if (pre.dataset.copyReady === "true") {
      return;
    }

    var code = pre.querySelector("code");

    if (!code) {
      return;
    }

    var container = pre.parentElement && pre.parentElement.classList.contains("highlight")
      ? pre.parentElement
      : pre.closest(".highlighter-rouge");
    var button = document.createElement("button");

    if (!container) {
      container = document.createElement("div");
      container.className = "highlight";
      pre.parentNode.insertBefore(container, pre);
      container.appendChild(pre);
    }

    pre.dataset.copyReady = "true";
    container.classList.add("code-block");

    button.type = "button";
    button.className = "code-block__copy";
    button.setAttribute("aria-label", "Copy code");
    button.setAttribute("title", "Copy code");
    button.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i><span>Copy</span>';

    button.addEventListener("click", function () {
      copyText(getCodeText(code))
        .then(function () {
          button.classList.add("code-block__copy--success");
          button.setAttribute("aria-label", "Code copied");
          button.setAttribute("title", "Code copied");
          button.querySelector("span").textContent = "Copied";

          window.setTimeout(function () {
            button.classList.remove("code-block__copy--success");
            button.setAttribute("aria-label", "Copy code");
            button.setAttribute("title", "Copy code");
            button.querySelector("span").textContent = "Copy";
          }, 1800);
        })
        .catch(function () {
          button.classList.add("code-block__copy--error");
          button.setAttribute("aria-label", "Copy failed");
          button.setAttribute("title", "Copy failed");
          button.querySelector("span").textContent = "Failed";
        });
    });

    container.appendChild(button);
  }

  function initCodeCopy() {
    document.querySelectorAll("pre").forEach(addCopyButton);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCodeCopy);
  } else {
    initCodeCopy();
  }
})();
