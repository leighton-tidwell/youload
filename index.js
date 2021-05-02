const cp = require('child_process');
const readline = require('readline');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const yts = require('yt-search');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Connect to DB
const db = require("./db");
const dbName = "youload";
const dbCollectionName = "_videos";

// Static Files
app.get('/', function(req, res) {
  res.sendFile('./public/index.html', { root: __dirname });
});

app.get('/Search', function(req, res) {
  res.sendFile('./public/search.html', { root: __dirname });
});

app.get('/YouLoad', function (req, res) {
  res.sendFile('./public/youload.html', { root: __dirname });
});

app.get('/viewVideo', function (req, res) {
  res.sendFile('./public/viewVideo.html', { root: __dirname });
});


// APIS
app.get('/searchYoutube', function (req, res) {
  const query = req.query.query;
  if(!query) return res.sendStatus(404);
  yts(query)
    .then((results) => {
      res.json(results);
    })
});

app.get('/searchYouload', function (req, res) {
  const query = req.query.query;
  if(!query) return res.sendStatus(404);
  db.initialize(dbName, dbCollectionName, function (dbCollection) {
    dbCollection.find({ "title": { "$regex": query, "$options": "i" } }).toArray(function (err, result) {
      if (err) res.send(err);
      res.send(JSON.stringify(result));
    })
  })
})

app.get('/videoDetails', function (req, res){
  const id = req.query.id;
  if(!id) return res.sendStatus(404);
  db.initialize(dbName, dbCollectionName, function (dbCollection) {
    dbCollection.findOne({ "videoId": id }, (function (err, result) {
      if (err) res.send(err);
      res.send(JSON.stringify(result));
    }))
  })
})

app.get('/relatedVideos', function (req, res) {
  const id = req.query.id;
  if(!id) return res.sendStatus(404);
  ytdl.getInfo(id).then(info => {
    res.json(info.related_videos);
  });
});

app.get('/listVideos', function (req, res) {
  db.initialize(dbName, dbCollectionName, function (dbCollection) {
    dbCollection.find({}).toArray(function (err, result) {
      if (err) res.send(err);
      res.send(JSON.stringify(result));
    })
  })
});

app.get('/downloadVideo', function (req, res) {
  console.log(req.query);
  const ref = req.query.url;
  const videoId = req.query.url.split('v=')[1] || req.query.url; // if passed ID, just keep the ID.
  const videoPath = `./public/videos/${videoId}.mkv`;
  const fileExists = fs.existsSync(videoPath);
  if (fileExists) return res.json({ error: "File exists." }); // stop script if file exists.

  // example taken from ytdl-core github
  // External modules
  // Global constants
  const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: '0x', fps: 0 },
  };

  // Get audio and video streams
  const audio = ytdl(ref, { quality: 'highestaudio' })
    .on('progress', (_, downloaded, total) => {
      tracker.audio = { downloaded, total };
    });
  const video = ytdl(ref, { quality: 'highestvideo' })
    .on('progress', (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    });

  // Prepare the progress bar
  let progressbarHandle = null;
  const progressbarInterval = 1000;
  const showProgress = () => {
    readline.cursorTo(process.stdout, 0);
    const toMB = i => (i / 1024 / 1024).toFixed(2);

    process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
    process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

    process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
    process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

    process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
    process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

    process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
    readline.moveCursor(process.stdout, 0, -3);
  };

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(ffmpeg, [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Redirect/Enable progress messages
    '-progress', 'pipe:3',
    // Set inputs
    '-i', 'pipe:4',
    '-i', 'pipe:5',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    videoPath,
  ], {
    windowsHide: true,
    stdio: [
      /* Standard: stdin, stdout, stderr */
      'inherit', 'inherit', 'inherit',
      /* Custom: pipe:3, pipe:4, pipe:5 */
      'pipe', 'pipe', 'pipe',
    ],
  });
  ffmpegProcess.on('close', () => {
    // File done downloading
    // Add video information to database
    ytdl.getInfo(videoId).then(info => {
      const thumbnailUrl = info.videoDetails.thumbnails[3].url; // Get third largest thumbnail, but not fullsize.
      fetch(thumbnailUrl)
        .then(res => {
          const saveLocation = fs.createWriteStream(`./public/thumbnails/${videoId}.webp`);
          res.body.pipe(saveLocation);
        })
        .then(() => {
          const videoItem = {
            videoId: videoId,
            title: info.videoDetails.title,
            description: info.videoDetails.description,
            likes: info.videoDetails.likes,
            uploadedBy: info.videoDetails.author.name,
            uploadedOn: info.videoDetails.uploadDate,
            viewCount: info.videoDetails.viewCount,
            lengthSeconds: info.videoDetails.lengthSeconds,
            thumbnailUrl: `./thumbnails/${videoId}.webp`
          };

          addToDb(videoItem);
        })
    });

    const addToDb = (videoItem) => {
      db.initialize(dbName, dbCollectionName, function (dbCollection) {
        // Insert video into database
        dbCollection.insertOne(videoItem, (error, result) => {
          if (error) throw error;
          // Cleanup
          process.stdout.write('\n\n\n\n');
          clearInterval(progressbarHandle);
          res.json({
            success: true,
            itemUploaded: result.ops
          });
        });
      }, function (err) {
        res.json({ error: err });
      });
    }
  });

  // Link streams
  // FFmpeg creates the transformer streams and we just have to insert / read data
  ffmpegProcess.stdio[3].on('data', chunk => {
    // Start the progress bar
    if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
    // Parse the param=value list returned by ffmpeg
    const lines = chunk.toString().trim().split('\n');
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split('=');
      args[key.trim()] = value.trim();
    }
    tracker.merged = args;
  });
  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
});

app.listen(port, () => {
  console.log(`App listening on ${port}.`);
});