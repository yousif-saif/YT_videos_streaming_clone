const form = document.getElementById("form")

form.addEventListener("submit", (event) => {
    event.preventDefault()
    const formDataToSend = new FormData()
    const title = document.querySelector(".title").value
    const video = document.getElementById("video").files[0]
    const image = document.getElementById("image").files[0]

    const errMsg = document.querySelector(".errorMsg")

    if (video == null || image == null){
        errMsg.textContent = "Please provide both video and a thumbnail"
        return false

    }

    if (title == null || title == ""){
        errMsg.textContent = "Please provide a title for your video"
        return false
    }

    formDataToSend.append("title", title)
    formDataToSend.append("files", video)
    formDataToSend.append("files", image)



    fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formDataToSend

    })
    .then(response => response.json())
    .then(response => {
        if ("error" in response){
            errMsg.textContent = response.error

        }else{
            document.querySelector(".successMsg").textContent = "Video is prossing...\nYou can leave this page now"
            
        }
    })
    .catch(error => console.log(error))

})