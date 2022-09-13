import React, { useEffect } from "react";
import "./appcard.scss";
import logo from "../../assets/images/Logo.jpg";
import expand from "../../assets/images/expand.png";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Button from "../Button/Button";
import { axiosApiInstance, randomID, SOCKET_URL } from "../../helper/request";
import ReactTooltip from "react-tooltip";
import Scrollbars from "react-custom-scrollbars";
import { CameraCard } from "../../pages/User/Camera/Camera";
import toast from "react-hot-toast";
import { encryptStorage } from "../../helper/storage";

function SampleNextArrow(props) {
  const { className, onClick } = props;
  return (
    <div
      className="next_arrow"
      //   className={className}
      //   style={{ ...style, display: "block", background: "red" }}
    >
      <button
        onClick={onClick}
        disabled={className?.includes("slick-disabled")}
        className="next_img_holder"
      >
        <img src={expand} alt="next_image" />
      </button>
    </div>
  );
}

function SamplePrevArrow(props) {
  const { className, onClick } = props;
  return (
    <div
      className="next_arrow"
      //   className={className}
      //   style={{ ...style, display: "block", background: "red" }}
    >
      <button
        onClick={onClick}
        className="prev_img_holder"
        disabled={className?.includes("slick-disabled")}
      >
        <img src={expand} alt="prev_image" />
      </button>
    </div>
  );
}

export default function AppCard({
  usecases,
  className,
  style,
  handleViewAll,
  postUpdate,
  postUninstall,
  postDownload,
  history,
  isEditDisabled,
  type,
  editLoading,
  CCOnDelete,
  CCUsertype,
  // CChandleOutsideClick,
  CConEdit,
  CConEditDetail,
  CChandleGetCameraDetail,
  CConViewDetail,
  cornerShadow,
  ...item
}) {
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: type ? 3 : 2,
    // slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: false,
    // arrows: false,
    nextArrow: <SampleNextArrow className="next_arrow" />,
    prevArrow: <SamplePrevArrow />,
  };

  return (
    <div
      className={
        className ? "__app_card__ fadeIn " + className : "__app_card__ fadeIn"
      }
      style={style}
    >
      <div className="_app_info">
        <ReactTooltip delayShow={500} id="global" className="r_tt_adjust" />
        <ReactTooltip delayShow={500} className="r_tt_adjust" id="global3" />
        {/* <img src={item.Icon} className="_cardCover" />
        <div className="_cardCover_2" /> */}
        <h1>{item.Service_name.replaceAll("_", " ")}</h1>
        <p
          data-for="global3"
          data-tip={item.Description.length > 200 ? item.Description : ""}
        >
          {item.Description.length > 200
            ? item.Description.replaceAll("_", " ").substring(0, 200) + "..."
            : item.Description.replaceAll("_", " ")}
        </p>
        {usecases && usecases.length !== 0 && (
          <Button
            onClick={() => handleViewAll(item.Service_id)}
            name="View All"
            style={{ marginTop: "1vw", width: "5vw" }}
          />
        )}
      </div>
      <div className="_app_slider">
        {!cornerShadow && <div className="corner_shadow" />}
        {/* <div className="corner_shadow2" /> */}
        {(!usecases || usecases.length === 0) && (
          <h1 className="no_usecase">
            No {type === "usecase" ? "Usecases" : "Camera"} Found
          </h1>
        )}
        {usecases && usecases?.length > 0 && (
          <Slider {...settings}>
            {type === "usecase"
              ? usecases?.map((items, index) => (
                  <div key={"slide" + index}>
                    <UCCard
                      isEditDisabled={isEditDisabled}
                      history={history}
                      onUpdateClick={() => postUpdate(items)}
                      onUninstallClick={() => {
                        postUninstall(items);
                      }}
                      onDownloadClick={() => postDownload(items)}
                      name={randomID()}
                      {...items}
                      soloRender={false}
                      editLoading={editLoading}
                    />
                  </div>
                ))
              : usecases?.map((item, index) => (
                  <div key={"slide_" + index}>
                    <CameraCard
                      className={"_cam_card_adjust"}
                      key={item.Camera_id}
                      data={item}
                      onDelete={(data) => {
                        CCOnDelete(data);
                      }}
                      history={history}
                      userType={CCUsertype}
                      // handleOutsideClick={() => {
                      //   CChandleOutsideClick();
                      // }}
                      onEdit={() => {
                        CConEdit(true);
                      }}
                      onEditDetail={() => {
                        CConEditDetail(true);
                      }}
                      handleGetCameraDetail={() => {
                        CChandleGetCameraDetail();
                      }}
                      onViewDetail={(_data) => {
                        CConViewDetail(_data);
                      }}
                    />
                  </div>
                ))}
          </Slider>
        )}
      </div>
    </div>
  );
}

export const UCCard = ({
  name,
  onUpdateClick,
  onUninstallClick,
  onDownloadClick,
  soloRender,
  history,
  isEditDisabled,
  editLoading,
  onLiveFeedClick,
  onUploadClick,
  onDefaultClick,
  ...items
}) => {
  useEffect(() => {
    ReactTooltip.rebuild();
  }, [soloRender]);
  // const toggleClass = (element, className) => {
  //   let classNames = element.className.split(" ");
  //   let index = classNames.indexOf(className);
  //   if (index === -1) {
  //     classNames.push(className);
  //   } else {
  //     classNames.splice(index, 1);
  //   }

  //   element.className = classNames.filter((item) => item !== "").join(" ");
  //   classNames.map((item) => element.classList.add(item));
  // };

  const notify = (data) => {
    return toast(
      (t) => (
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
      )
      // {
      //   duration: 500000,
      // }
    );
  };

  const renderIcon = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return { icon: "check_circle", color: "green" };
      case "inactive":
        return { icon: "pause", color: "orange" };
      case "dowloading":
        return { icon: "downloading", color: "pink" };
      case "downloaded":
        return { icon: "get_app", color: "green" };
      case "suspended":
        return { icon: "cancel", color: "red" };
      case "purchased":
        return { icon: "shop_two", color: "gray" };
      default:
        return { icon: "check_circle", color: "green" };
    }
  };

  const UCInfo = ({ title, _data }) => {
    return (
      <div className="uc_info_wrapper">
        <p className="_title">{title}</p>
        <p className="_data">{_data}</p>
      </div>
    );
  };

  const renderImage = (icon) => {
    if (icon.includes("http")) {
      return icon;
    } else {
      return SOCKET_URL + icon;
    }
  };
  return (
    <div className="_ucCard">
      {/* {console.log(items)} */}
      <div className="content" id={name}>
        <div className="flip-card-front">
          <button
            className="switch_icon"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              document.getElementById(name).style.transform = "rotateY(180deg)";
            }}
            data-for="global"
            data-tip="More info"
          >
            <i className="material-icons">priority_high</i>
          </button>

          <img
            src={renderImage(items.Icon)}
            className="uc_image"
            onError={(e) => {
              e.target.src = logo;
            }}
            // style={{ height: items.Service_type === "AI" && "77%" }}
            alt={items.Service_name}
          />
          <div className="_flex">
            <h3
              className="uc_name"
              data-for={soloRender ? "global2" : "global"}
              data-tip={
                items.Service_name.length > 20
                  ? items.Service_name.replaceAll("_", " ")
                  : ""
              }
            >
              {items.Service_name.length > 20
                ? items.Service_name.replaceAll("_", " ").substring(0, 20) +
                  "..."
                : items.Service_name.replaceAll("_", " ")}
              {/* {items.Service_name} */}
            </h3>
            {/* {items.Service_type !== "AI" ? ( */}

            <div className="_flex">
              <i
                className="material-icons"
                style={{ color: renderIcon(items.Status).color }}
              >
                {renderIcon(items.Status).icon}
              </i>
              <p
                className="uc_status"
                style={{ color: renderIcon(items.Status).color }}
              >
                {items.Status}
              </p>
            </div>

            {/*  ) : (
              <div />
            )} */}
          </div>
          <div
            className="uc_desc"
            data-for={soloRender ? "global2" : "global"}
            data-tip={
              items.Description.length > 75
                ? items.Description.replaceAll("_", " ")
                : ""
            }
          >
            {items.Description.length > 75
              ? items.Description.replaceAll("_", " ").substring(0, 75) + "..."
              : items.Description.replaceAll("_", " ")}
          </div>
          {items.Service_type !== "AI" && (
            <div
              className="uc_options"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="option_btn"
                disabled={
                  items.Status === "updating" ||
                  items.Status === "purchased" ||
                  items.Status === "downloading" ||
                  items.Update_available === false
                }
                onClick={onUpdateClick}
                data-tip="Update"
              >
                <i className="material-icons">system_update_alt</i>
              </button>
              <button
                className="option_btn"
                disabled={items.Status !== "purchased"}
                onClick={onDownloadClick}
                data-tip="Download"
              >
                <i className="material-icons">file_download</i>
              </button>
              <button
                className="option_btn"
                onClick={onUninstallClick}
                data-tip="Uninstall"
                disabled={
                  items.Status === "updating" ||
                  items.Status === "downloading" ||
                  items.Status === "active"
                }
              >
                <i className="material-icons">delete</i>
              </button>
              <button
                className="option_btn"
                data-tip="Edit"
                disabled={isEditDisabled || !items.Status.includes("active")}
                onClick={() => {
                  editLoading(true);
                  axiosApiInstance
                    .get("base/device")
                    .then((ress) => {
                      axiosApiInstance
                        .get("camera/configure_services")
                        .then((res) => {
                          let data_ = {
                            usecaseLimit: ress.data.Limitations.Usecase,
                            deepStreamLimit: ress.data.Limitations.Deepstream,
                            cameraLimit: ress.data.Limitations.Camera,
                          };
                          encryptStorage.setItem("LIM", data_);
                          history.push("/app/edit/" + items.Service_name);
                        })
                        .catch((err) => {
                          editLoading(false);
                          notify({
                            type: "alert",
                            msg: "Something went wrong in configuring service!",
                          });
                        });
                    })
                    .catch((err) => {
                      editLoading(false);
                      notify({
                        type: "alert",
                        msg: "Something went wrong in base device service!",
                      });
                    });

                  // axiosApiInstance
                  //   .get("camera/configure_services")
                  //   .then((res) => {
                  //     history.push("/app/edit/" + items.Service_name);
                  //   })
                  //   .catch((err) => {
                  //     editLoading(false);
                  //     notify({
                  //       type: "alert",
                  //       msg: "Something went wrong in configuring service!",
                  //     });
                  //   });
                }}
              >
                <i className="material-icons">edit</i>
              </button>
            </div>
          )}
          {items.Service_type === "AI" && (
            <div
              className="uc_options2"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="option_btn"
                onClick={onUploadClick}
                data-tip="Upload Model File"
                disabled={items.Status === "active"}
              >
                <i className="material-icons">file_upload</i>
              </button>
              <button
                className="option_btn"
                onClick={onLiveFeedClick}
                data-tip="Live Feed"
                disabled={items.Status !== "active"}
              >
                <i className="material-icons">slideshow</i>
              </button>

              <button
                className="option_btn"
                onClick={onDefaultClick}
                data-tip="Default"
                disabled={items.Status === "active"}
              >
                <i className="material-icons">refresh</i>
              </button>
            </div>
          )}
        </div>
        <div className="flip-card-back">
          <button
            className="switch_icon adjust_icon"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              document.getElementById(name).style.transform = "rotateY(0)";
            }}
          >
            <i className="material-icons">close</i>
          </button>

          <div className="uc_full_info">
            <Scrollbars autoHeight autoHeightMin={100} autoHeightMax="13vw">
              <UCInfo
                title="Name"
                _data={items.Service_name.replaceAll("_", " ")}
              />
              <UCInfo
                title="Description"
                _data={items.Description.replaceAll("_", " ")}
              />
              <UCInfo title="Service Type" _data={items.Service_type} />
              <UCInfo title="Service Status" _data={items.Status} />
              <UCInfo title="Service Version" _data={items.Version} />
              <UCInfo title="Service Validity" _data={items.validity} />
              {/* <UCInfo data={items} /> */}
            </Scrollbars>
          </div>
        </div>
      </div>
    </div>
  );
};
