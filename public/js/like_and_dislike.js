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
        }

        console.log(response)
        
    })

})

dislike.addEventListener("click", () => {
    fetch("/dislike?id=" + id)
    .then(response => response.json())
    .then(response => {
        if ("redirectUrl" in response){ 
            window.location.href = response.redirectUrl
            return;
        }
        
        console.log(response)

    })

})