import axios from "axios";
import { encryptStorage } from "./storage";
import socketio from "socket.io-client";

let host = window.location.host;
// export const API_URL = "http://" + host + "/api/v1/";
// export const SOCKET_URL = "http://" + host;
// export const API_URL = "http://192.168.68.126/api/v1/";
// export const SOCKET_URL = "http://192.168.68.126";
export const API_URL = "http://192.168.1.13/api/v1/";
export const SOCKET_URL = "http://192.168.1.13";

export const axiosApiInstance = axios.create();
export const axiosPostMediaInstance = axios.create();

// Request interceptor for API calls
axiosApiInstance.interceptors.request.use(
  async (config) => {
    const data = encryptStorage.getItem("UID");
    config.baseURL = API_URL;
    config.headers = {
      Authorization: "Bearer " + data.access_token,
      Accept: "application/json",
    };
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosApiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    if (!error.response) {
      // network error
      console.debug("network error");
      localStorage.setItem("theme", "Light");
      window.location.pathname = "/issue/server";
    }
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      let _data = encryptStorage.getItem("UID");
      originalRequest._retry = true;
      const access_token = await refreshAccessToken();
      if (!access_token) {
        encryptStorage.removeItem("UID");
        encryptStorage.removeItem("VID");
        encryptStorage.removeItem("VID2");
        // window.location.replace("/");
        return;
      }
      axios.defaults.headers.common["Authorization"] = "Bearer " + access_token;
      _data.access_token = access_token;

      localStorage.setItem("accessToken", access_token);
      encryptStorage.setItem("UID", _data);
      localStorage.setItem("accessToken", access_token);
      return axiosApiInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  let dataa = encryptStorage.getItem("UID");
  const headers = {
    Authorization: "Bearer " + dataa.refresh_token,
  };
  try {
    const data = await axios.get(API_URL + "user/refresh", {
      headers: headers,
    });
    if (data.status === 200) {
      return data.data.access_token;
    }
    return "null";
  } catch (error) {
    // window.location.replace("/");
    // console.log(error.response);
    // console.log("REFRESH TOKEN EXPIRED");
  }
}

export const globalSocket = async () => {
  return socketio.connect(SOCKET_URL);
};

export const randomID = (len = 6) => {
  const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  const maxPos = chars.length;
  let id = "";
  for (let i = 0; i < len; i++) {
    id += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return id;
};
