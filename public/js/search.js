const searchButton = document.querySelector('#search');
const searchBar = document.querySelector("#query");
const urlParams = new URLSearchParams(window.location.search);
const queryParam = urlParams.get('query');

const runSearch = () => {
    // get query
    const searchQuery = searchBar.value;
    const youloadContainer = document.querySelector("#youload");
    const youtubeContainer = document.querySelector("#youtube");
    urlParams.set("query", searchQuery);
    history.replaceState(null, null, "?"+urlParams.toString());
    youloadContainer.innerHTML = "";
    youtubeContainer.innerHTML = "";

    fetch(`/searchYouload?query=${searchQuery}`)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            generateResults(data);
        })
        .catch(function (error) {
            console.log(error);
        });

    const generateResults = (videos) => {
        let header = document.createElement("h3");
        header.innerHTML = `${videos.length} Results from YouLoad`;
        youloadContainer.appendChild(header);

        videos.forEach( video => {
            let searchResult = document.createElement("div");
            searchResult.className = "result";
            searchResult.id = video.videoId;
            searchResult.innerHTML = `<div class="thumbnail-container"><img class="youload-thumbnail" src="${video.thumbnailUrl}"></div><div class="description-container"><h4>${video.title} - ${video.uploadedBy}</h4><span class="description-stats">${video.viewCount} - ${video.uploadedOn}</span><span class="description-rating">${String(video.likes)}</span><div class="divider"></div><p>${video.description}</p></div>`;
            youloadContainer.appendChild(searchResult);
        })
    }

    fetch(`/searchYoutube?query=${searchQuery}`)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            generateResultsYoutube(data.all);
        })
        .catch(function (error) {
            console.log(error);
        });
    
    const generateResultsYoutube = (videos) => {
        let header = document.createElement("h3");
        header.innerHTML = `${videos.length} Results from Youtube`;
        youtubeContainer.appendChild(header);
        console.log(videos);
        videos.forEach( video => {
            if(video.type == "video") {
                let searchResult = document.createElement("div");
                searchResult.className = "result";
                searchResult.id = video.videoId;
                searchResult.innerHTML = `<div class="thumbnail-container"><img class="youtube-thumbnail" src="${video.image}"></div><div class="description-container"><a href="javascript:downloadVideo('${video.videoId}');"><h4>${video.title} - ${video.author.name}</h4></a><span class="description-stats">${video.views} - ${video.ago}</span><span class="description-rating">Unknown</span><div class="divider"></div><p>${video.description}</p></div>`;
                youtubeContainer.appendChild(searchResult);
            }
        })
    }
}

const downloadVideo = (id) => {
    fetch(`/downloadVideo?url=${id}`)
    .then( function(res) {
        console.log(res);
    })
}

if(queryParam) {
    const searchBar = document.querySelector("#query")
    searchBar.value = queryParam;
    runSearch();
}

searchButton.addEventListener("click", function () {
    runSearch();
})

searchBar.addEventListener("keyup", ({key}) => {
    if(key === "Enter") runSearch();
})