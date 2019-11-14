let video = null;

let socketRunning = true;

const head = document.getElementsByTagName("head")[0];
const script = document.createElement("script");
script.type = "text/javascript";
script.src = `http://localhost:4000/socket.io/socket.io.js`;
script.onerror = function() {
  alert("SocketIO Loading Failed");
  let socketRunning = false;
};
head.appendChild(script);

let socket = null;

let detections = null;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models")
]).then(faceapiReady);

function faceapiReady() {
  console.log("faceAPI is ready");
}

function preload() {
  if (socketRunning) socket = io("http://localhost:4000/");
}

function setup() {
  createCanvas(windowWidth, (windowWidth / 4) * 3);

  const deviceId = localStorage.getItem("mainCam");

  const constraints1 = {
    video: {
      deviceId
    }
  };

  video = createCapture(constraints1);
  video.id("video_element");
  video.size(width, height);
  video.hide();

  const displaySize = { width: width, height: height };

  setInterval(async () => {
    const roughDetect = await faceapi
      .detectAllFaces(video.id(), new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions()
      .withAgeAndGender();

    detections = faceapi.resizeResults(roughDetect, displaySize);

    //console.log(detections);
    if (socket !== null) socket.emit("getDetections", detections);
  }, 50);
}

let preExp = "neutral";

function draw() {
  tint(0, 255, 0);
  image(video, 0, 0);
  filter(POSTERIZE, 8);

  textSize(50);

  noFill();
  stroke(255, 0, 40);
  strokeWeight(2);
  if (detections !== null && detections.length > 0) {
    let index = 0;
    let faceInfo = "";
    detections.map(face => {
      let expIndex = 0;
      let topExp = "neutral";
      let topExpValue = 0;
      const faceExps = Object.keys(face.expressions);
      const expValues = Object.values(face.expressions);
      faceExps.map(expression => {
        if (expValues[expIndex] <= 1) {
          if (expValues[expIndex] > topExpValue) {
            topExpValue = expValues[expIndex];
            topExp = expression.toString();
          }
        }
        expIndex++;
      });

      if (preExp !== topExp) {
        if (socket !== null) socket.emit("watchingEmotion", topExp);
        preExp = topExp;
      }

      const topExpP = nf(topExpValue * 100, 2, 2);

      const faceP = nf(face.detection._score * 100, 2, 2);
      const faceX = floor(
        face.detection._box._x + face.detection._box._width / 2
      );
      const faceY = floor(
        face.detection._box._y + face.detection._box._height / 2
      );
      const faceSize = floor(face.detection._box._height);

      const faceGender = face.gender;
      const genderP = nf(face.genderProbability * 100, 2, 2);
      const faceAge = floor(face.age);

      circle(faceX, faceY, faceSize);
      circle(faceX, faceY, faceSize - 5);
      textSize(30);
      textAlign(CENTER);
      text(faceGender, faceX, faceY - 10);
      text(topExp, faceX, faceY + 20);

      faceInfo += `
      - Target ${index + 1} -
      Face_Detected : ${faceP}%
      Pos_X : ${faceX} / Pos_Y : ${faceY}
      T_Size : ${faceSize}
      Gender : ${faceGender} ${genderP}%
      Age : appx ${faceAge} yrd
      Emotion : ${topExp} ${topExpP}%
      `;

      index++;
    });
    strokeWeight(1);
    textSize(15);
    textAlign(LEFT);
    text(faceInfo, 0, 0);
  }
}
