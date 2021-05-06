const loginButton = document.querySelector("#login");

const attemptLogin = () => {
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const user = { username, password };
  fetch("../login", {
    method: "post",
    body: JSON.stringify(user),
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if(data.success) window.location = '/YouLoad';
    });
};

loginButton.addEventListener("click", function () {
  attemptLogin();
});
