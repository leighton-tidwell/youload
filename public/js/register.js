const registerButton = document.querySelector("#submit");

const attemptRegister = () => {
  const email = document.querySelector("#email").value;
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const confirmPassword = document.querySelector("#confirm-password").value;
  const user = { email, username, password };

  if(!validateEmail(email)) return alert("Email is not valid.");
  if(password !== confirmPassword) return alert("Passwords do not match.");

  fetch("../register", {
    method: "post",
    body: JSON.stringify(user),
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if(data.success) window.location = '/Login';
    });
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

registerButton.addEventListener("click", function () {
  attemptRegister();
});
