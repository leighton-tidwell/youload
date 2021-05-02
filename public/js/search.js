const searchButton = document.querySelector('#search');
searchButton.addEventListener("click", function () {
    // get query
    const searchBar = document.querySelector("#query");
    const searchQuery = searchBar.value;
    const youloadContainer = document.querySelector("#youload");
    const youtubeContainer = document.querySelector("#youtube");
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
        videos.forEach( video => {
            let searchResult = document.createElement("div");
            searchResult.className = "result";
            searchResult.id = video.videoId;
            searchResult.innerHTML = `<div class="thumbnail-container"><img class="youload-thumbnail" src="${video.thumbnailUrl}"></div><div class="description-container"><h4>${video.title}</h4><span class="description-stats">${video.viewCount} - ${video.uploadedOn}</span><span class="description-rating">${String(video.likes)}</span><div class="divider"></div><p>${video.description}</p></div>`;
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
        videos.forEach( video => {
            let searchResult = document.createElement("div");
            searchResult.className = "result";
            searchResult.id = video.videoId;
            searchResult.innerHTML = `<div class="thumbnail-container"><img class="youload-thumbnail" src="${video.image}"></div><div class="description-container"><h4>${video.title}</h4><span class="description-stats">${video.views} - ${video.ago}</span><span class="description-rating"></span><div class="divider"></div><p>${video.description}</p></div>`;
            youtubeContainer.appendChild(searchResult);
        })
    }
})