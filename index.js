const gotDevices = deviceInfos => {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == "videoinput") {
      const option = document.createElement("option");
      option.value = `${deviceInfo.deviceId}`;
      option.innerHTML = `${i} ${deviceInfo.label}`;
      select.appendChild(option);

      //direct select
      if (i === 5) {
        localStorage.setItem("mainCam", deviceInfo.deviceId);
        location.href = "http://localhost:5000/start.html";
      }
    }
  }
};

const camSelected = () => {
  console.log(select.value, "selected");
  localStorage.setItem("mainCam", select.value);
  location.href = "http://localhost:5000/start.html";
};

const select = document.createElement("select");
select.addEventListener("change", camSelected);
document.body.appendChild(select);

const blankOption = document.createElement("option");
blankOption.innerHTML = "-- select camera --";
select.appendChild(blankOption);

navigator.mediaDevices.enumerateDevices().then(gotDevices);
