const cp = require("child_process");
const readline = require("readline");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const fetch = require("node-fetch");
const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg-static");
const yts = require("yt-search");
const axios = require("axios");
const cookieParser = require('cookie-parser');
const ObjectId = require('mongodb').ObjectId; 
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;


// User Libraries
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

app.use(express.static("public"));
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

// Connect to DB
const db = require("./db");
const { response } = require("express");
const dbName = "youload";
const videosDb = "_videos";
const usersDb = "_users";

// Static Files
app.get("/", function (req, res) {
  res.sendFile("./public/index.html", { root: __dirname });
});

app.get("/login", function (req, res) {
  res.sendFile("./public/login.html", { root: __dirname });
});

app.get("/register", function (req, res) {
  res.sendFile("./public/signup.html", { root: __dirname });
});

app.get("/Search", function (req, res) {
  const token = req.cookies['token'];
  if(!token) return res.redirect("/login");
  try {
    const decoded = jwt.verify(token, "randomString");
    const user = decoded.user;
    db.initialize(
      dbName,
      usersDb,
      function (dbCollection) {
        // Insert video into database
        dbCollection.findOne({ _id: ObjectId(user.id) }, async (error, result) => {
          if (error) throw error;
          if (result === null) return res.redirect("/login");
          res.sendFile("./public/search.html", { root: __dirname });
        })
      }
    );
  } catch (e) {
    console.error(e);
    return res.redirect("/login");
  }
});

app.get("/YouLoad", async function (req, res) {
  const token = req.cookies['token'];
  if(!token) return res.redirect("/login");
  try {
    const decoded = jwt.verify(token, "randomString");
    const user = decoded.user;
    db.initialize(
      dbName,
      usersDb,
      function (dbCollection) {
        // Insert video into database
        dbCollection.findOne({ _id: ObjectId(user.id) }, async (error, result) => {
          if (error) throw error;
          if (result === null) return res.redirect("/login");
          res.sendFile("./public/youload.html", { root: __dirname });
        })
      }
    );
  } catch (e) {
    console.error(e);
    return res.sendFile("./public/login.html", { root: __dirname });;
  }
});

app.get("/viewVideo", async function (req, res) {
  const token = req.cookies['token'];
  if(!token) return res.redirect("/login");
  try {
    const decoded = jwt.verify(token, "randomString");
    const user = decoded.user;
    db.initialize(
      dbName,
      usersDb,
      function (dbCollection) {
        // Insert video into database
        dbCollection.findOne({ _id: ObjectId(user.id) }, async (error, result) => {
          if (error) throw error;
          if (result === null) return res.redirect("/login");
          res.sendFile("./public/viewVideo.html", { root: __dirname });
        })
      }
    );
  } catch (e) {
    console.error(e);
    return res.sendFile("./public/login.html", { root: __dirname });;
  }
});

// APIS

app.post("/register", async function (req, res) {
  if (req.body.username === null || req.body.password === null) return;
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  let user = { email, username, password };
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  db.initialize(
    dbName,
    usersDb,
    function (dbCollection) {
      // Insert video into database
      dbCollection.insertOne(user, (error, result) => {
        if (error) throw error;
        res.json({
          success: true,
          userAdded: result.ops,
        });
      });
    },
    function (err) {
      res.json({ error: err });
    }
  );
});

app.post("/login", async function (req, res) {
  if (req.body.username === null || req.body.password === null) return;
  const username = req.body.username;
  const password = req.body.password;
  let foundUser;

  db.initialize(
    dbName,
    usersDb,
    function (dbCollection) {
      // Insert video into database
      dbCollection.findOne({ username: username }, async (error, result) => {
        if (error) throw error;
        if (result === null) return res.json({ error: "User does not exist." });
        foundUser = result;
        const comparePassword = await bcrypt.compare(
          password,
          foundUser.password
        );
        if (!comparePassword)
          return res.json({ error: "Password does not match!" });

        const payload = {
          user: {
            id: foundUser._id,
          },
        };

        jwt.sign(
          payload,
          "randomString",
          {
            expiresIn: 3600,
          },
          (err, token) => {
            if (err) throw err;
            console.log(`token ${token}`)
            res.cookie('token', token, {
              httpOnly: true,
              secure: false
            });
            res.json({ success: "true" });
            res.send();
          }
        );
      });
    },
    function (err) {
      res.json({ error: err });
    }
  );
});

app.get("/searchYoutube", function (req, res) {
  const query = req.query.query;
  if (!query) return res.sendStatus(404);
  yts(query).then((results) => {
    res.json(results);
  });
});

app.get("/searchYouload", function (req, res) {
  const query = req.query.query;
  if (!query) return res.sendStatus(404);
  db.initialize(dbName, videosDb, function (dbCollection) {
    dbCollection
      .find({ title: { $regex: query, $options: "i" } })
      .toArray(function (err, result) {
        if (err) res.send(err);
        res.send(JSON.stringify(result));
      });
  });
});

app.get("/videoDetails", function (req, res) {
  const id = req.query.id;
  if (!id) return res.sendStatus(404);
  db.initialize(dbName, videosDb, function (dbCollection) {
    dbCollection.findOne({ videoId: id }, function (err, result) {
      if (err) res.send(err);
      res.send(JSON.stringify(result));
    });
  });
});

app.get("/relatedVideos", function (req, res) {
  const id = req.query.id;
  if (!id) return res.sendStatus(404);
  ytdl.getInfo(id).then((info) => {
    res.json(info.related_videos);
  });
});

app.get("/listVideos", function (req, res) {
  db.initialize(dbName, videosDb, function (dbCollection) {
    dbCollection.find({}).toArray(function (err, result) {
      if (err) res.send(err);
      res.send(JSON.stringify(result));
    });
  });
});

app.get("/image", function (req, res) {
  const imageUrl = req.query.url;
  if (imageUrl === null) return;
  axios
    .get(imageUrl, {
      responseType: "stream",
    })
    .then((response) => {
      res.setHeader("Content-Type", response.headers["content-type"]);
      response.data.pipe(res);
    });
});

app.get("/downloadVideo", function (req, res) {
  if (req.query.url === null) return;
  const ref = req.query.url;
  const videoId = req.query.url.split("v=")[1] || req.query.url; // if passed ID, just keep the ID.
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
    merged: { frame: 0, speed: "0x", fps: 0 },
  };

  // Get audio and video streams
  const audio = ytdl(ref, { quality: "highestaudio" }).on(
    "progress",
    (_, downloaded, total) => {
      tracker.audio = { downloaded, total };
    }
  );
  const video = ytdl(ref, { quality: "highestvideo" }).on(
    "progress",
    (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    }
  );

  // Prepare the progress bar
  let progressbarHandle = null;
  const progressbarInterval = 1000;
  const showProgress = () => {
    readline.cursorTo(process.stdout, 0);
    const toMB = (i) => (i / 1024 / 1024).toFixed(2);

    process.stdout.write(
      `Audio  | ${(
        (tracker.audio.downloaded / tracker.audio.total) *
        100
      ).toFixed(2)}% processed `
    );
    process.stdout.write(
      `(${toMB(tracker.audio.downloaded)}MB of ${toMB(
        tracker.audio.total
      )}MB).${" ".repeat(10)}\n`
    );

    process.stdout.write(
      `Video  | ${(
        (tracker.video.downloaded / tracker.video.total) *
        100
      ).toFixed(2)}% processed `
    );
    process.stdout.write(
      `(${toMB(tracker.video.downloaded)}MB of ${toMB(
        tracker.video.total
      )}MB).${" ".repeat(10)}\n`
    );

    process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
    process.stdout.write(
      `(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${" ".repeat(
        10
      )}\n`
    );

    process.stdout.write(
      `running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(
        2
      )} Minutes.`
    );
    readline.moveCursor(process.stdout, 0, -3);
  };

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(
    ffmpeg,
    [
      // Remove ffmpeg's console spamming
      "-loglevel",
      "8",
      "-hide_banner",
      // Redirect/Enable progress messages
      "-progress",
      "pipe:3",
      // Set inputs
      "-i",
      "pipe:4",
      "-i",
      "pipe:5",
      // Map audio & video from streams
      "-map",
      "0:a",
      "-map",
      "1:v",
      // Keep encoding
      "-c:v",
      "copy",
      // Define output file
      videoPath,
    ],
    {
      windowsHide: true,
      stdio: [
        /* Standard: stdin, stdout, stderr */
        "inherit",
        "inherit",
        "inherit",
        /* Custom: pipe:3, pipe:4, pipe:5 */
        "pipe",
        "pipe",
        "pipe",
      ],
    }
  );
  ffmpegProcess.on("close", () => {
    // File done downloading
    // Add video information to database
    ytdl.getInfo(videoId).then((info) => {
      const thumbnailUrl = info.videoDetails.thumbnails[3].url; // Get third largest thumbnail, but not fullsize.
      fetch(thumbnailUrl)
        .then((res) => {
          const saveLocation = fs.createWriteStream(
            `./public/thumbnails/${videoId}.webp`
          );
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
            thumbnailUrl: `./thumbnails/${videoId}.webp`,
          };

          addToDb(videoItem);
        });
    });

    const addToDb = (videoItem) => {
      db.initialize(
        dbName,
        videosDb,
        function (dbCollection) {
          // Insert video into database
          dbCollection.insertOne(videoItem, (error, result) => {
            if (error) throw error;
            // Cleanup
            process.stdout.write("\n\n\n\n");
            clearInterval(progressbarHandle);
            res.json({
              success: true,
              itemUploaded: result.ops,
            });
          });
        },
        function (err) {
          res.json({ error: err });
        }
      );
    };
  });

  // Link streams
  // FFmpeg creates the transformer streams and we just have to insert / read data
  ffmpegProcess.stdio[3].on("data", (chunk) => {
    // Start the progress bar
    if (!progressbarHandle)
      progressbarHandle = setInterval(showProgress, progressbarInterval);
    // Parse the param=value list returned by ffmpeg
    const lines = chunk.toString().trim().split("\n");
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split("=");
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
