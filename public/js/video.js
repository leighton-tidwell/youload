const urlParams = new URLSearchParams(window.location.search);
const queryParam = urlParams.get('id');

// Script to get video details
fetch(`../videoDetails?id=${queryParam}`)
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        populatePage(data);
        relatedVideos(data.videoId);
    })
    .catch(function (error) {
        console.log(error);
    });


const populatePage = (data) => {
    if (!data) return;

    // Add video to player
    const videoPlayer = document.querySelector("#video");
    const videoSource = document.createElement('source');
    videoSource.setAttribute('src', `../videos/${data.videoId}.mkv`);
    videoPlayer.appendChild(videoSource);

    // Set Video Description
    const videoTitle = document.querySelector("#videoTitle");
    videoTitle.innerHTML = `${data.title} - ${data.uploadedBy}`;

    const videoStats = document.querySelector("#videoStats");
    videoStats.innerHTML = `${numberWithCommas(data.viewCount)} Views - ${data.uploadedOn} - ${data.lengthSeconds}`;

    const videoRating = document.querySelector("#videoRating");
    videoRating.innerHTML = numberWithCommas(data.likes);

    const videoDescription = document.querySelector("#videoDescription");
    videoDescription.innerHTML = data.description;
}

const relatedVideos = (id) => {
    if (!id) return;
    fetch(`/relatedVideos?id=${queryParam}`)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            populateRelated(data);
        })
}

const populateRelated = (data) => {
    console.log(data);
    const sidebar = document.querySelector(".sidebar");
    data.forEach( video => {
        let relatedVideo = document.createElement("div");
        relatedVideo.className = "related-video";
        relatedVideo.id = video.id;
        relatedVideo.innerHTML = `<img class="related-video-thumbnail" src="${video.thumbnails[1].url}"><div class="related-video-details"><a href="javascript:downloadVideo('${video.id}','${encodeURI(video.title)}');"><h4>${video.title}</h4></a><h5 class="related-author">${video.author.name}</h5><span class="related-stats">${numberWithCommas(video.view_count)} Views - ${video.published}</span><span class="related-rating">Unknown</span></div>`;
        sidebar.appendChild(relatedVideo);
    })
}

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const downloadVideo = (id, title) => {
    const notificationContainer = document.querySelector(".notification-container");
    let notification = document.createElement("div");
    notification.className = "notification";
    notification.id = `notification-${id}`;
    notification.innerHTML = `${decodeURI(title)} is downloading.. this notification will disappear when done.`;
    notificationContainer.appendChild(notification);
    fetch(`/downloadVideo?url=${id}`)
    .then( function(res) {
        if(res.error) alert("This video has already been downloaded.");
        const not = document.querySelector(`#notification-${id}`);
        not.parentNode.removeChild(not);
    })
}