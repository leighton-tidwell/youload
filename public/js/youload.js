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
        videoElement.innerHTML = `<a href="../viewVideo?id=${video.videoId}"><img src="${video.thumbnailUrl}"/><div class="video-description"></a><a href="../viewVideo?id=${video.videoId}"><h2>${video.title}</h2></a><span class="video-stats">${video.viewCount} Views - ${video.uploadedOn}</span><span class="video-rating">${String(video.likes)}</span></div>`;
        wrapper.appendChild(videoElement);
    })
}
