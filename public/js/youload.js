const searchButton = document.querySelector('#search');
const searchBar = document.querySelector("#query");

// Script to get video elements
fetch("../listVideos")
.then(function(response) {
    return response.json();
})
.then(function(data) {
    generateVideoElements(data);
})
.catch(function(error){
    console.log(error);
});

const generateVideoElements = (videos) => {
    videos.forEach( video => {
        const wrapper = document.querySelector(".wrapper");
        let videoElement = document.createElement("div");
        videoElement.className = "video-element";
        videoElement.id = video.videoId;
        videoElement.innerHTML = `<a href="../viewVideo?id=${video.videoId}"><img src="${video.thumbnailUrl}"/><div class="video-description"></a><a href="../viewVideo?id=${video.videoId}"><h2>${video.title}</h2></a><h3>${video.uploadedBy}</h3><span class="video-stats">${numberWithCommas(video.viewCount)} Views - ${video.uploadedOn}</span><span class="video-rating">${numberWithCommas(video.likes)}</span></div>`;
        wrapper.appendChild(videoElement);
    })
}

const runSearch = () => {
    const searchQuery = searchBar.value;
    window.location = `/Search?query=${searchQuery}`;
}

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

searchButton.addEventListener("click", function () {
    runSearch();
})

searchBar.addEventListener("keyup", ({key}) => {
    if(key === "Enter") runSearch();
})