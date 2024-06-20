const errorMsg = document.querySelector(".errorMsg")
const signUpButton = document.getElementById("signUpButton")


signUpButton.addEventListener("click", () => {
    const userName = document.getElementById("name").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    if (userName == "" || email == "" || password == ""){
        errorMsg.textContent = "Please fill all the blanks"
        return false
    
    }

    fetch("/sign_up", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: userName,
            email: email,
            password: password

        })
    })

    .then(response => response.json())
    .then(response => {
        if ("error" in response) {
            errorMsg.textContent = response.error

        } else {
            window.location.href = "/"

        }

    })


})
