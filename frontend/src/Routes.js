import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import CheckUser from "./pages/CheckUser/CheckUser";
import AuthNetwork from "./pages/Auth/Network/AuthNetwork";
import AuthRegister from "./pages/Auth/Register/AuthRegister";
import AuthAccessKey from "./pages/Auth/AccessKey/AuthAccessKey";
import AuthLogin from "./pages/Auth/Login/AuthLogin";
import Home from "./pages/User/Home/Home";
import AuthType from "./pages/Auth/Type/AuthType";
import AuthOTP from "./pages/Auth/OTP/AuthOTP";
import AuthError from "./pages/Auth/Error/AuthError";
import AuthActivateDevice from "./pages/Auth/ActivateDevice/AuthActivateDevice";
import AuthRegisterDevice from "./pages/Auth/RegisterDevice/AuthRegisterDevice";
import Setting from "./pages/User/Setting/Setting";
import Apps from "./pages/User/App/Apps";
import DeviceInfo from "./pages/User/DeviceInfo/DeviceInfo";
import Users from "./pages/User/Users/Users";
import Alerts from "./pages/User/Alerts/Alerts";
import { Camera } from "./pages/User/Camera/Camera";
import AddCamera from "./pages/User/Camera/AddCamera/AddCamera";
import UpdateCamera from "./pages/User/Camera/UpdateCamera/UpdateCamera";
import AuthResetPassword from "./pages/Auth/ResetPassword/AuthResetPassword";
import AuthResetOTP from "./pages/Auth/ResetPassword/AuthResetOTP";
import AuthResentPasswordinput from "./pages/Auth/ResetPassword/AuthResentPasswordinput";
import Profile from "./pages/User/Profile/Profile";
import EditService from "./pages/User/App/EditService";
import { encryptStorage } from "./helper/storage";
import { useEffect, useState } from "react";
import small_window from "./assets/images/small_window.png";
import ServerDown from "./pages/ServerDown/ServerDown";
import PageNotFound from "./pages/ServerDown/PageNotFound";
import Restart from "./pages/ServerDown/Restart";
import toast, { Toaster, useToasterStore } from "react-hot-toast";
import Shutdown from "./pages/ServerDown/Shutdown";
import { SOCKET_URL } from "./helper/request";
import AddNVR from "./pages/User/Camera/AddNVR/AddNVR";
import Maintenance from "./pages/Auth/Maintenance/Maintenance";
import Report from "./pages/User/Report/Report";

let timeout = null;
const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      encryptStorage.getItem("UID") ? (
        Component ? (
          <Component {...props} />
        ) : (
          rest.render(props)
        )
      ) : (
        <Redirect
          to={{
            pathname: "/auth/login",
            state: { from: props.location },
          }}
        />
      )
    }
  />
  // <Route
  //   {...rest}
  //   render={(props) =>
  //     encryptStorage.getItem("UID") ? (
  //       <Component {...props} />
  //     ) : (
  //       <Redirect
  //         to={{
  //           pathname: "/auth/login",
  //           state: { from: props.location },
  //         }}
  //       />
  //     )
  //   }
  // />
);

const PublicRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      encryptStorage.getItem("UID") ? (
        <Redirect
          to={{
            pathname: "/home",
            state: { from: props.location },
          }}
        />
      ) : (
        <Component {...props} />
      )
    }
  />
);

function Routes() {
  let history = useHistory();
  const location = useLocation();
  const [Role, setRole] = useState(null);
  const { toasts } = useToasterStore();
  const notify = (data) => {
    return toast((t) => (
      <div className="routeModal">
        <div style={{ display: "flex", alignItems: "center" }}>
          {data?.type === "success" ? (
            <i className="material-icons success_icon">done</i>
          ) : (
            <i className="material-icons modal_icon">warning</i>
          )}

          <div className="warning_content">
            <h3>{data?.type === "success" ? "Success" : "Error"}</h3>
            <p>{data?.msg}</p>
          </div>
        </div>
        <div className="warning_options">
          <i
            className="material-icons warning_icon"
            onClick={() => toast.dismiss(t.id)}
          >
            close
          </i>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    // axiosApiInstance.delete("service/live/stop");

    toast.remove();
  }, [location]);

  useEffect(async () => {
    // var font = "1rem 'mdi'";
    // console.log(`Checking ${font}: ${document.fonts.check(font)}`);
    document.body.style.opacity = 0;
    let res = await fetch("http://" + window.location.host + "/Theme.json");
    let jsonData = await res.json();
    // console.log(jsonData);
    var bodyStyles = document.body.style;
    bodyStyles.setProperty("--primary", jsonData["primary_colour"]);
    bodyStyles.setProperty("--secondary", jsonData["secondary_colour"]);
    bodyStyles.setProperty("--solid-button", jsonData["button_colour1"]);
    bodyStyles.setProperty(
      "--gradient-button-color-1",
      jsonData["button_colour2_primary"]
    );
    bodyStyles.setProperty(
      "--gradient-button-color-2",
      jsonData["button_colour2_secondary"]
    );

    setTimeout(() => {
      document.body.style.opacity = 1;
    }, 200);
    console.log(SOCKET_URL + jsonData?.favicon);
    let favEle = document.getElementById("fav-icon");
    console.log(favEle);
    favEle.href(SOCKET_URL + jsonData?.favicon);

    // bodyStyles.setProperty("--body-background", Theme1["Primary Colour"]);
  }, []);

  const [Links, setLinks] = useState({
    superadmin: [
      <PrivateRoute path="/home" component={Home} strict exact />,
      <PrivateRoute path="/settings" component={Setting} strict exact />,
      <PrivateRoute
        path="/apps"
        render={({ match }) => {
          return (
            <Apps
              adata={(d) => {
                notify(d);
              }}
            />
          );
        }}
        // component={Apps}

        strict
        exact
      />,
      <PrivateRoute path="/report" component={Report} strict exact />,
      <PrivateRoute path="/device" component={DeviceInfo} strict exact />,
      <PrivateRoute path="/users" component={Users} strict exact />,
      <PrivateRoute path="/profile" component={Profile} strict exact />,
      <PrivateRoute path="/alerts" component={Alerts} strict exact />,
      <PrivateRoute path="/camera" component={Camera} strict exact />,
      <PrivateRoute path="/camera/add" component={AddCamera} strict exact />,
      <PrivateRoute path="/nvr/add" component={AddNVR} strict exact />,

      <PrivateRoute
        path="/camera/update/:id"
        component={UpdateCamera}
        strict
        exact
      />,
      <PrivateRoute
        path="/app/edit/:id"
        component={EditService}
        strict
        exact
      />,
    ],
    admin: [
      <PrivateRoute path="/home" component={Home} strict exact />,
      <PrivateRoute path="/profile" component={Profile} strict exact />,
      <PrivateRoute path="/alerts" component={Alerts} strict exact />,
      <PrivateRoute path="/camera" component={Camera} strict exact />,
      <PrivateRoute path="/device" component={DeviceInfo} strict exact />,

      <PrivateRoute path="/profile" component={Profile} strict exact />,
      <PrivateRoute path="/camera/add" component={AddCamera} strict exact />,
      <PrivateRoute
        path="/camera/update/:id"
        component={UpdateCamera}
        strict
        exact
      />,
      <PrivateRoute path="/users" component={Users} strict exact />,
    ],
    operator: [
      <PrivateRoute path="/home" component={Home} strict exact />,
      <PrivateRoute path="/alerts" component={Alerts} strict exact />,

      <PrivateRoute path="/camera" component={Camera} strict exact />,
      <PrivateRoute path="/profile" component={Profile} strict exact />,
    ],
    manufacturer: [
      <PrivateRoute path="/home" component={Home} strict exact />,
      <PrivateRoute path="/settings" component={Setting} strict exact />,
      <PrivateRoute path="/device" component={DeviceInfo} strict exact />,

      <PrivateRoute path="/profile" component={Profile} strict exact />,
    ],
  });
  useEffect(() => {
    toasts
      .filter((t) => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= 2) // Is toast index over limit
      .forEach((t) => toast.dismiss(t.id)); // Dismiss – Use toast.remove(t.id) removal without animation
  }, [toasts]);
  useEffect(() => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [pageSize, setPageSize] = useState({
    width: 1366,
    height: 768,
  });

  const onResize = () => {
    var divWidth = window.innerWidth;
    var divHeight = window.innerHeight;
    setPageSize({
      width: divWidth,
      height: divHeight,
      realWidth: window.screen.availWidth,
      realHeight: window.screen.availHeight,
    });
  };
  useEffect(() => {
    // disable console
    console.log = function () {};
    if (encryptStorage.getItem("UID")) {
      let lData = encryptStorage.getItem("UID");
      setRole(lData.role.toLowerCase());
    } else {
      setRole(null);
    }
  });

  if (pageSize.width <= 1000 || pageSize.height <= 560) {
    return (
      <div className="low_resolution_container">
        <p className="extraBold">Ooops... This window is to tight for me!</p>
        <img
          className="small_window"
          draggable="false"
          alt="small_window"
          src={small_window}
        />
        <p className="extraBold">
          Please make it atleast {1000} px in width and {560} px in height
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence exitBeforeEnter>
      <Toaster
        containerStyle={{
          top: 50,
        }}
        toastOptions={{
          style: {
            // minWidth: "480px",
            maxWidth: "525px",
          },
        }}
      />
      {/* {toast(
        (t) => (
          <div className="routeModal">
            <div style={{ display: "flex", alignItems: "center" }}>
              <i className="material-icons success_icon">done</i>
              <div className="warning_content">
                <h3>Error</h3>
                <p>{"Something went wrong!"}</p>
              </div>
            </div>
            <div className="warning_options">
              <i
                className="material-icons warning_icon"
                onClick={() => toast.dismiss(t.id)}
              >
                close
              </i>
            </div>
          </div>
        ),
        {
          duration: "1000000",
        }
      )} */}
      <Switch location={location} key={location.pathname}>
        <Route path="/" component={CheckUser} strict exact />
        <PublicRoute path="/auth/login" component={AuthLogin} strict exact />
        <Route path="/auth/network" component={AuthNetwork} strict exact />
        <Route path="/auth/register" component={AuthRegister} strict exact />
        <Route path="/auth/accesskey" component={AuthAccessKey} strict exact />
        <Route path="/auth/type" component={AuthType} strict exact />
        <Route path="/auth/otp" component={AuthOTP} strict exact />
        <Route
          path="/auth/device/register"
          component={AuthRegisterDevice}
          strict
          exact
        />
        <Route
          path="/auth/activate"
          component={AuthActivateDevice}
          strict
          exact
        />
        <Route path="/auth/error" component={AuthError} strict exact />
        <Route path="/auth/reset" component={AuthResetPassword} strict exact />
        <Route path="/auth/reset/otp" component={AuthResetOTP} strict exact />
        <Route
          path="/auth/reset/password"
          component={AuthResentPasswordinput}
          strict
          exact
        />
        {Role && Links[Role]?.map((item) => item)}
        <Route path="/issue/server" component={ServerDown} strict exact />
        <Route path="/restart" component={Restart} strict exact />
        <Route path="/shutdown" component={Shutdown} strict exact />
        <Route
          path="/info"
          // render={<PageNotFound status="404" />}
          render={({ match }) => {
            return <PageNotFound status="404" />;
          }}
          strict
          exact
        />
        <Route path="/maintenance" component={Maintenance} strict exact />

        <Route path="*" component={PageNotFound} strict exact />
      </Switch>
    </AnimatePresence>
  );
}

export default Routes;
