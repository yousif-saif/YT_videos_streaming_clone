const like = document.getElementById("like")
const dislike = document.getElementById("dislike")

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