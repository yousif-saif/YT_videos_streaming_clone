const like = document.getElementById("like")
const dislike = document.getElementById("dislike")
const errorMsg = document.querySelector(".errorMsg")
const successMsg = document.querySelector(".successMsg")


const id = document.getElementById("VideoId").value

like.addEventListener("click", () => {
    fetch("/like?id=" + id)
    .then(response => response.json())
    .then(response => {
        if ("redirectUrl" in response){ 
            window.location.href = response.redirectUrl
            return;

        } else if ("code" in response) {
            if (response.code == 200){
                like.style.backgroundColor = "black"
                like.style.color = "white"
                
            } else if (response.code == 409){
                like.style.backgroundColor = "black"
                like.style.color = "white"

                dislike.style.backgroundColor = "white"
                dislike.style.color = "black"

            } else if (response.code == 400){
                like.style.backgroundColor = "white"
                like.style.color = "black"

            }

            like.textContent = "Likes " + response.likes
            dislike.textContent = "Dislikes " + response.dislikes


        }else {
            errorMsg.textContent = "An unknown error occurred"
        }
        
    })

})

dislike.addEventListener("click", () => {
    fetch("/dislike?id=" + id)
    .then(response => response.json())
    .then(response => {
        if ("redirectUrl" in response){ 
            window.location.href = response.redirectUrl
            return;

        } else if ("code" in response) {
            if (response.code == 200){
                dislike.style.backgroundColor = "black"
                dislike.style.color = "white"
                
            } else if (response.code == 409){
                dislike.style.backgroundColor = "black"
                dislike.style.color = "white"

                like.style.backgroundColor = "white"
                like.style.color = "black"

            } else if (response.code == 400){
                dislike.style.backgroundColor = "white"
                dislike.style.color = "black"

            }

            like.textContent = "Likes " + response.likes
            dislike.textContent = "Dislikes " + response.dislikes

        } else {
            alert("Unknown error happened")
            return;
        }
        

    })

})


const addCommentButton = document.querySelector(".addComment")

addCommentButton.addEventListener("click", () => {
    const comment = document.getElementById("comment").value
    console.log(comment)

    if (comment == null || comment.trim().length == 0 || comment == ""){
        errorMsg.textContent = "Please write a vaild comment"
        return false
    }

    fetch("/comment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ comment: comment, id: id })

    })
    .then(response => response.json())
    .then(response => {
        if ("error" in response){
            console.log(error)
            errorMsg.textContent = response.error

        } else if ("code" in response){
            if (response.code == 200){
                successMsg.textContent = "Added comment successfully"

            }

        } else {
            window.location.href = response.urlRedirect
        }

    })


})