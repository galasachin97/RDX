export const getDateTime = (dateTimeString) => {
  // setTime(new Date(dateTimeString));
  var today = new Date(dateTimeString);
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();
  var pcdate = dd + "/" + mm + "/" + yyyy;

  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();
  var ampm = hours >= 12 ? "PM" : "AM";
  if (hours !== 0) {
    hours = hours % 12;
    hours = hours ? hours : 12;
  }
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  var strTime = hours + ":" + minutes + ":" + seconds + " " + ampm;
  return pcdate + " " + strTime;
};
