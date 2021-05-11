const loginButton = document.querySelector("#login");
const usernameField = document.querySelector("#username");
const passwordField = document.querySelector("#password");

const attemptLogin = () => {
  const username = usernameField.value;
  const password = passwordField.value;
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
      if(data.error) alert(data.error);
    });
};

loginButton.addEventListener("click", function () {
  attemptLogin();
});

usernameField.addEventListener("keyup", ({key}) => {
  if (key === "Enter") attemptLogin();
})

passwordField.addEventListener("keyup", ({key}) => {
  if (key === "Enter") attemptLogin();
})



